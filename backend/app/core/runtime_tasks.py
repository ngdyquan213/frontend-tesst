from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Callable

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.logging import build_log_extra
from app.core.runtime_state import runtime_task_state
from app.models.enums import BookingStatus, PaymentStatus
from app.repositories.booking_repository import BookingRepository
from app.repositories.flight_repository import FlightRepository
from app.repositories.hotel_repository import HotelRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.tour_repository import TourRepository
from app.repositories.user_repository import UserRepository
from app.services.booking_inventory_service import BookingInventoryService
from app.services.outbox_service import OutboxService, process_outbox_events

logger = logging.getLogger("app.runtime")


def cleanup_refresh_tokens() -> None:
    db = None
    try:
        db = SessionLocal()
        repo = UserRepository(db)

        now = datetime.now(timezone.utc)
        expired_deleted = repo.delete_expired_refresh_tokens(now)
        revoked_deleted = repo.delete_old_revoked_refresh_tokens(older_than=now - timedelta(days=7))

        db.commit()

        logger.info(
            "runtime_cleanup_refresh_tokens",
            extra=build_log_extra(
                "runtime_cleanup_refresh_tokens",
                expired_deleted=expired_deleted,
                revoked_deleted=revoked_deleted,
            ),
        )
    except Exception:
        if db is not None:
            db.rollback()
        logger.exception("runtime_cleanup_refresh_tokens_failed")
        raise
    finally:
        if db is not None:
            db.close()


def cleanup_expired_booking_holds() -> None:
    db = None
    try:
        db = SessionLocal()
        booking_repo = BookingRepository(db)
        payment_repo = PaymentRepository(db)
        inventory_service = BookingInventoryService(
            flight_repo=FlightRepository(db),
            hotel_repo=HotelRepository(db),
            tour_repo=TourRepository(db),
        )

        now = datetime.now(timezone.utc)
        expired_bookings = booking_repo.list_expired_pending_bookings(now=now)
        expired_count = 0
        cancelled_payments = 0

        for booking in expired_bookings:
            inventory_service.restore_inventory(booking)
            booking.status = BookingStatus.expired
            booking.payment_status = PaymentStatus.cancelled
            booking.cancelled_at = booking.cancelled_at or now
            booking.cancellation_reason = (
                booking.cancellation_reason
                or "Booking hold expired before payment was completed"
            )
            booking.expires_at = None
            booking_repo.save(booking)

            payment = payment_repo.get_latest_by_booking_id_for_update(str(booking.id))
            if payment and payment.status == PaymentStatus.pending:
                payment.status = PaymentStatus.cancelled
                payment.failed_at = now
                payment.failure_reason = "Booking hold expired before payment completed"
                payment_repo.save(payment)
                cancelled_payments += 1

            expired_count += 1

        db.commit()

        logger.info(
            "runtime_cleanup_expired_booking_holds",
            extra=build_log_extra(
                "runtime_cleanup_expired_booking_holds",
                expired_count=expired_count,
                cancelled_payments=cancelled_payments,
            ),
        )
    except Exception:
        if db is not None:
            db.rollback()
        logger.exception("runtime_cleanup_expired_booking_holds_failed")
        raise
    finally:
        if db is not None:
            db.close()


def run_noncritical_maintenance() -> None:
    tasks = (
        ("cleanup_refresh_tokens", cleanup_refresh_tokens),
        ("cleanup_expired_booking_holds", cleanup_expired_booking_holds),
        ("process_outbox_events", _process_outbox_events),
    )

    for task_name, task in tasks:
        runtime_task_state.mark_started(task_name)
        try:
            task()
        except Exception as exc:
            runtime_task_state.mark_failure(task_name, str(exc))
            logger.exception("runtime_noncritical_task_failed | task=%s", task_name)
        else:
            runtime_task_state.mark_success(task_name)


def _process_outbox_events() -> None:
    db = None
    try:
        db = SessionLocal()
        processed_count = process_outbox_events(db)
        backlog = OutboxService(db=db).get_backlog_count()
        logger.info(
            "runtime_outbox_processed",
            extra=build_log_extra(
                "runtime_outbox_processed",
                processed_count=processed_count,
                outbox_backlog=backlog,
            ),
        )
    finally:
        if db is not None:
            db.close()


async def run_noncritical_maintenance_loop(
    *,
    stop_event: asyncio.Event,
    interval_seconds: int | None = None,
    run_immediately: bool = True,
    run_maintenance: Callable[[], None] = run_noncritical_maintenance,
) -> None:
    interval = interval_seconds or settings.RUNTIME_MAINTENANCE_INTERVAL_SECONDS
    should_run = run_immediately

    while not stop_event.is_set():
        if should_run:
            await asyncio.to_thread(run_maintenance)
        should_run = True

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval)
        except TimeoutError:
            continue

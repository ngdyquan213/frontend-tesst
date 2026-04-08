from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Callable

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.logging import build_log_extra
from app.core.runtime_state import runtime_task_state
from app.repositories.user_repository import UserRepository
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


def run_noncritical_maintenance() -> None:
    tasks = (
        ("cleanup_refresh_tokens", cleanup_refresh_tokens),
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

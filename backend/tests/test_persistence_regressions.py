from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.coupon import Coupon, CouponUsage
from app.models.document import UploadedDocument
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    CouponApplicableProductType,
    CouponType,
    DocumentType,
    PaymentMethod,
    PaymentStatus,
    UserStatus,
)
from app.models.flight import Airline, Airport, Flight
from app.models.payment import Payment
from app.models.system import OutboxEvent
from app.models.user import User
from app.repositories.audit_repository import AuditRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.coupon_repository import CouponRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.flight_repository import FlightRepository
from app.repositories.hotel_repository import HotelRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.tour_repository import TourRepository
from app.repositories.user_repository import UserRepository
from app.schemas.booking import BookingCancelRequest, BookingCreateRequest
from app.schemas.coupon import CouponApplyRequest
from app.services.audit_service import AuditService
from app.services.booking_cancellation_domain_service import BookingCancellationDomainService
from app.services.booking_cancellation_service import BookingCancellationService
from app.services.booking_inventory_service import BookingInventoryService
from app.services.booking_service import BookingService
from app.services.coupon_service import CouponService
from app.services.pdf_voucher_service import PDFVoucherService
from app.services.voucher_document_service import VoucherDocumentService
from app.workers.email_worker import EmailWorker
from app.workers.notification_worker import NotificationWorker


def _session_factory(db_engine):
    return sessionmaker(bind=db_engine, autocommit=False, autoflush=False)


def _seed_user(session, suffix: str) -> User:
    user = User(
        email=f"{suffix}@example.com",
        username=f"user_{suffix}",
        full_name=f"User {suffix}",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _seed_flight(session, suffix: str, available_seats: int = 5) -> Flight:
    airline = Airline(code=f"A{suffix[:5].upper()}", name=f"Airline {suffix}")
    dep = Airport(code=f"D{suffix[:5].upper()}", name="Departure", city="HCM", country="VN")
    arr = Airport(code=f"R{suffix[:5].upper()}", name="Arrival", city="HN", country="VN")
    session.add_all([airline, dep, arr])
    session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number=f"FL{suffix[:4].upper()}",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1200000.00"),
        available_seats=available_seats,
        status="scheduled",
    )
    session.add(flight)
    session.commit()
    session.refresh(flight)
    return flight


def _seed_booking(
    session,
    *,
    user: User,
    flight: Flight,
    suffix: str,
    quantity: int = 1,
    payment_status: PaymentStatus = PaymentStatus.pending,
) -> Booking:
    total_amount = Decimal("1200000.00") * quantity
    booking = Booking(
        booking_code=f"BK-{suffix[:8].upper()}",
        user_id=user.id,
        status=BookingStatus.pending,
        total_base_amount=total_amount,
        total_discount_amount=Decimal("0.00"),
        total_final_amount=total_amount,
        currency="VND",
        payment_status=payment_status,
        booked_at=datetime.now(timezone.utc),
    )
    session.add(booking)
    session.flush()

    item = BookingItem(
        booking_id=booking.id,
        item_type=BookingItemType.flight,
        flight_id=flight.id,
        quantity=quantity,
        unit_price=Decimal("1200000.00"),
        total_price=total_amount,
    )
    session.add(item)
    session.commit()
    session.refresh(booking)
    return booking


def test_booking_service_persists_changes_across_sessions(db_engine):
    SessionLocal = _session_factory(db_engine)
    suffix = uuid4().hex

    seed_session = SessionLocal()
    user = _seed_user(seed_session, suffix)
    flight = _seed_flight(seed_session, suffix, available_seats=5)
    user_id = str(user.id)
    flight_id = str(flight.id)
    seed_session.close()

    write_session = SessionLocal()
    service = BookingService(
        db=write_session,
        booking_repo=BookingRepository(write_session),
        flight_repo=FlightRepository(write_session),
        user_repo=UserRepository(write_session),
        audit_service=AuditService(AuditRepository(write_session)),
        email_worker=EmailWorker(),
        notification_worker=NotificationWorker(),
    )
    booking = service.create_booking(
        user_id=user_id,
        payload=BookingCreateRequest(flight_id=flight_id, quantity=1),
    )
    booking_id = str(booking.id)
    write_session.close()

    verify_session = SessionLocal()
    persisted_booking = verify_session.query(Booking).filter(Booking.id == booking_id).first()
    persisted_flight = verify_session.query(Flight).filter(Flight.id == flight_id).first()
    usage_logs = (
        verify_session.query(BookingItem).filter(BookingItem.booking_id == booking_id).count()
    )
    verify_session.close()

    assert persisted_booking is not None
    assert persisted_flight is not None
    assert persisted_flight.available_seats == 4
    assert usage_logs == 1


def test_coupon_service_persists_changes_across_sessions(db_engine):
    SessionLocal = _session_factory(db_engine)
    suffix = uuid4().hex

    seed_session = SessionLocal()
    user = _seed_user(seed_session, suffix)
    flight = _seed_flight(seed_session, suffix, available_seats=5)
    booking = _seed_booking(seed_session, user=user, flight=flight, suffix=suffix)
    coupon = Coupon(
        code=f"CP{suffix[:8].upper()}",
        name=f"Coupon {suffix[:6]}",
        coupon_type=CouponType.percentage,
        applicable_product_type=CouponApplicableProductType.flight,
        discount_value=Decimal("10.00"),
        max_discount_amount=Decimal("200000.00"),
        min_booking_amount=Decimal("100000.00"),
        usage_limit_total=10,
        usage_limit_per_user=1,
        used_count=0,
        starts_at=datetime.now(timezone.utc) - timedelta(days=1),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        is_active=True,
    )
    seed_session.add(coupon)
    seed_session.commit()
    booking_id = str(booking.id)
    user_id = str(user.id)
    coupon_code = coupon.code
    coupon_id = str(coupon.id)
    seed_session.close()

    write_session = SessionLocal()
    service = CouponService(
        db=write_session,
        booking_repo=BookingRepository(write_session),
        coupon_repo=CouponRepository(write_session),
        audit_service=AuditService(AuditRepository(write_session)),
    )
    service.apply_coupon(
        user_id=user_id,
        payload=CouponApplyRequest(booking_id=booking_id, coupon_code=coupon_code),
    )
    write_session.close()

    verify_session = SessionLocal()
    persisted_booking = verify_session.query(Booking).filter(Booking.id == booking_id).first()
    persisted_coupon = verify_session.query(Coupon).filter(Coupon.id == coupon_id).first()
    usage_count = (
        verify_session.query(CouponUsage)
        .filter(CouponUsage.booking_id == booking_id, CouponUsage.coupon_id == coupon_id)
        .count()
    )
    verify_session.close()

    assert persisted_booking is not None
    assert persisted_coupon is not None
    assert persisted_booking.coupon_id == persisted_coupon.id
    assert Decimal(persisted_booking.total_discount_amount) == Decimal("120000.00")
    assert persisted_coupon.used_count == 1
    assert usage_count == 1


def test_booking_cancellation_persists_changes_across_sessions(db_engine):
    SessionLocal = _session_factory(db_engine)
    suffix = uuid4().hex

    seed_session = SessionLocal()
    user = _seed_user(seed_session, suffix)
    flight = _seed_flight(seed_session, suffix, available_seats=4)
    booking = _seed_booking(
        seed_session,
        user=user,
        flight=flight,
        suffix=suffix,
        quantity=1,
        payment_status=PaymentStatus.paid,
    )
    payment = Payment(
        booking_id=booking.id,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.paid,
        amount=Decimal("1200000.00"),
        currency="VND",
        gateway_order_ref=f"PAY-{suffix[:8].upper()}",
        gateway_transaction_ref=f"TX-{suffix[:8].upper()}",
        idempotency_key=f"idem-{suffix[:8]}",
        paid_at=datetime.now(timezone.utc),
    )
    seed_session.add(payment)
    seed_session.commit()
    booking_id = str(booking.id)
    user_id = str(user.id)
    payment_id = str(payment.id)
    flight_id = str(flight.id)
    seed_session.close()

    write_session = SessionLocal()
    service = BookingCancellationService(
        db=write_session,
        booking_repo=BookingRepository(write_session),
        payment_repo=PaymentRepository(write_session),
        audit_service=AuditService(AuditRepository(write_session)),
        email_worker=EmailWorker(),
        inventory_service=BookingInventoryService(
            flight_repo=FlightRepository(write_session),
            hotel_repo=HotelRepository(write_session),
            tour_repo=TourRepository(write_session),
        ),
        domain_service=BookingCancellationDomainService(),
    )
    service.cancel_booking(
        booking_id=booking_id,
        user_id=user_id,
        payload=BookingCancelRequest(reason="Regression test"),
    )
    write_session.close()

    verify_session = SessionLocal()
    persisted_booking = verify_session.query(Booking).filter(Booking.id == booking_id).first()
    persisted_payment = verify_session.query(Payment).filter(Payment.id == payment_id).first()
    persisted_flight = verify_session.query(Flight).filter(Flight.id == flight_id).first()
    verify_session.close()

    assert persisted_booking is not None
    assert persisted_payment is not None
    assert persisted_flight is not None
    assert persisted_booking.status == BookingStatus.cancelled
    assert persisted_booking.payment_status == PaymentStatus.refunded
    assert persisted_payment.status == PaymentStatus.refunded
    assert persisted_flight.available_seats == 5


def test_voucher_generation_uses_configured_upload_dir(db_session, monkeypatch, tmp_path):
    suffix = uuid4().hex
    monkeypatch.setattr(settings, "LOCAL_UPLOAD_DIR", str(tmp_path))

    user = _seed_user(db_session, suffix)
    flight = _seed_flight(db_session, suffix, available_seats=5)
    booking = _seed_booking(db_session, user=user, flight=flight, suffix=suffix)

    booking.user = user

    service = VoucherDocumentService(
        document_repo=DocumentRepository(db_session),
        audit_service=AuditService(AuditRepository(db_session)),
        pdf_voucher_service=PDFVoucherService(),
        email_worker=EmailWorker(),
    )

    document = service.generate_and_store(booking=booking)

    storage_path = tmp_path.resolve() / document.storage_key
    assert not Path(document.storage_key).is_absolute()
    assert document.document_type == DocumentType.voucher
    assert storage_path.exists()
    assert document.checksum_sha256 is not None


def test_voucher_generation_cleans_up_file_on_failure(db_session, monkeypatch, tmp_path):
    suffix = uuid4().hex
    monkeypatch.setattr(settings, "LOCAL_UPLOAD_DIR", str(tmp_path))

    user = _seed_user(db_session, suffix)
    flight = _seed_flight(db_session, suffix, available_seats=5)
    booking = _seed_booking(db_session, user=user, flight=flight, suffix=suffix)
    booking_id = booking.id

    booking.user = user

    audit_service = AuditService(AuditRepository(db_session))
    service = VoucherDocumentService(
        document_repo=DocumentRepository(db_session),
        audit_service=audit_service,
        pdf_voucher_service=PDFVoucherService(),
        email_worker=EmailWorker(),
    )

    def fail_log_action(*args, **kwargs):
        raise RuntimeError("audit write failed")

    monkeypatch.setattr(audit_service, "log_action", fail_log_action)

    with pytest.raises(RuntimeError, match="audit write failed"):
        service.generate_and_store(booking=booking)

    assert list(tmp_path.iterdir()) == []
    assert (
        db_session.query(UploadedDocument)
        .filter(UploadedDocument.booking_id == booking_id)
        .count()
        == 0
    )


def test_booking_service_request_path_only_enqueues_side_effects(db_engine, monkeypatch):
    SessionLocal = _session_factory(db_engine)
    suffix = uuid4().hex

    cleanup_session = SessionLocal()
    cleanup_session.query(OutboxEvent).delete()
    cleanup_session.commit()
    cleanup_session.close()

    seed_session = SessionLocal()
    user = _seed_user(seed_session, suffix)
    flight = _seed_flight(seed_session, suffix, available_seats=5)
    user_id = str(user.id)
    flight_id = str(flight.id)
    seed_session.close()

    write_session = SessionLocal()
    email_worker = EmailWorker()
    notification_worker = NotificationWorker()
    service = BookingService(
        db=write_session,
        booking_repo=BookingRepository(write_session),
        flight_repo=FlightRepository(write_session),
        user_repo=UserRepository(write_session),
        audit_service=AuditService(AuditRepository(write_session)),
        email_worker=email_worker,
        notification_worker=notification_worker,
    )

    email_dispatches = {"count": 0}
    notification_dispatches = {"count": 0}

    def fail_if_email_dispatched(**kwargs):
        email_dispatches["count"] += 1
        raise AssertionError("request path must not dispatch email inline")

    def fail_if_notification_dispatched(**kwargs):
        notification_dispatches["count"] += 1
        raise AssertionError("request path must not dispatch notification inline")

    monkeypatch.setattr(email_worker, "send_booking_created_email", fail_if_email_dispatched)
    monkeypatch.setattr(
        notification_worker,
        "notify_booking_created",
        fail_if_notification_dispatched,
    )

    booking = service.create_booking(
        user_id=user_id,
        payload=BookingCreateRequest(flight_id=flight_id, quantity=1),
    )
    booking_id = str(booking.id)
    write_session.close()

    verify_session = SessionLocal()
    persisted_booking = verify_session.query(Booking).filter(Booking.id == booking_id).first()
    persisted_flight = verify_session.query(Flight).filter(Flight.id == flight_id).first()
    pending_outbox_events = (
        verify_session.query(OutboxEvent)
        .filter(
            OutboxEvent.status == "pending",
            OutboxEvent.target.in_(("email", "notification")),
        )
        .all()
    )
    verify_session.close()

    assert persisted_booking is not None
    assert persisted_flight is not None
    assert persisted_flight.available_seats == 4
    assert email_dispatches["count"] == 0
    assert notification_dispatches["count"] == 0
    assert len(pending_outbox_events) == 2

    process_session = SessionLocal()
    failing_service = BookingService(
        db=process_session,
        booking_repo=BookingRepository(process_session),
        flight_repo=FlightRepository(process_session),
        user_repo=UserRepository(process_session),
        audit_service=AuditService(AuditRepository(process_session)),
        email_worker=email_worker,
        notification_worker=notification_worker,
    )

    processed_count = failing_service.outbox_service.process_due_events()
    process_session.close()

    verify_session = SessionLocal()
    persisted_booking = verify_session.query(Booking).filter(Booking.id == booking_id).first()
    persisted_flight = verify_session.query(Flight).filter(Flight.id == flight_id).first()
    failed_outbox_events = (
        verify_session.query(OutboxEvent)
        .filter(
            OutboxEvent.status == "failed",
            OutboxEvent.target.in_(("email", "notification")),
        )
        .all()
    )
    verify_session.close()

    assert processed_count == 0
    assert persisted_booking is not None
    assert persisted_flight is not None
    assert persisted_flight.available_seats == 4
    assert len(failed_outbox_events) == 2
    assert all(event.attempt_count == 1 for event in failed_outbox_events)
    assert all(event.claim_token is None for event in failed_outbox_events)
    assert all(event.claimed_by is None for event in failed_outbox_events)
    assert all(event.lease_expires_at is None for event in failed_outbox_events)


def test_booking_service_commits_outbox_events_with_booking_transaction(db_engine, monkeypatch):
    SessionLocal = _session_factory(db_engine)
    suffix = uuid4().hex

    cleanup_session = SessionLocal()
    cleanup_session.query(OutboxEvent).delete()
    cleanup_session.commit()
    cleanup_session.close()

    seed_session = SessionLocal()
    user = _seed_user(seed_session, suffix)
    flight = _seed_flight(seed_session, suffix, available_seats=5)
    user_id = str(user.id)
    flight_id = str(flight.id)
    seed_session.close()

    write_session = SessionLocal()
    service = BookingService(
        db=write_session,
        booking_repo=BookingRepository(write_session),
        flight_repo=FlightRepository(write_session),
        user_repo=UserRepository(write_session),
        audit_service=AuditService(AuditRepository(write_session)),
        email_worker=EmailWorker(),
        notification_worker=NotificationWorker(),
    )

    booking = service.create_booking(
        user_id=user_id,
        payload=BookingCreateRequest(flight_id=flight_id, quantity=1),
    )
    booking_id = str(booking.id)
    write_session.close()

    verify_session = SessionLocal()
    persisted_booking = verify_session.query(Booking).filter(Booking.id == booking_id).first()
    persisted_outbox_events = (
        verify_session.query(OutboxEvent)
        .filter(
            OutboxEvent.status == "pending",
            OutboxEvent.target.in_(("email", "notification")),
        )
        .all()
    )
    verify_session.close()

    assert persisted_booking is not None
    assert len(persisted_outbox_events) == 2

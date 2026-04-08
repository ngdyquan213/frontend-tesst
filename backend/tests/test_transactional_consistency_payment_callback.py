from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy.orm import sessionmaker

from app.core.security import build_payment_callback_signature, get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    PaymentMethod,
    PaymentStatus,
    UserStatus,
)
from app.models.flight import Airline, Airport, Flight
from app.models.payment import Payment, PaymentCallback
from app.models.user import User
from app.repositories.audit_repository import AuditRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.payment_repository import PaymentRepository
from app.services.audit_service import AuditService
from app.services.payment_callback_domain_service import PaymentCallbackDomainService
from app.services.payment_callback_service import PaymentCallbackService
from app.workers.email_worker import EmailWorker


def create_user_and_login(
    client, db_session, *, email: str, username: str, password: str = "Password123"
):
    user = User(
        email=email,
        username=username,
        full_name=username,
        password_hash=get_password_hash(password),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    return user, login_resp.json()["access_token"]


def seed_booking_for_payment(db_session, user_id: str):
    airline = Airline(code="TC", name="Transactional Carrier")
    dep = Airport(code="TCA", name="A", city="HCM", country="VN")
    arr = Airport(code="TCB", name="B", city="HN", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="TC100",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1000000.00"),
        available_seats=10,
        status="scheduled",
    )
    db_session.add(flight)
    db_session.flush()

    booking = Booking(
        booking_code="BK-TX-PAY-001",
        user_id=user_id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("1000000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("1000000.00"),
        currency="VND",
        payment_status=PaymentStatus.pending,
        booked_at=datetime.now(timezone.utc),
    )
    db_session.add(booking)
    db_session.flush()

    db_session.add(
        BookingItem(
            booking_id=booking.id,
            item_type=BookingItemType.flight,
            flight_id=flight.id,
            quantity=1,
            unit_price=Decimal("1000000.00"),
            total_price=Decimal("1000000.00"),
        )
    )
    db_session.commit()
    return booking


def test_payment_callback_rolls_back_if_payment_save_fails(db_engine, monkeypatch):
    SessionLocal = sessionmaker(bind=db_engine, autocommit=False, autoflush=False)

    seed_session = SessionLocal()
    user = User(
        email="tx-pay@example.com",
        username="tx_pay",
        full_name="Tx Pay",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    seed_session.add(user)
    seed_session.flush()

    airline = Airline(code="TR", name="Rollback Carrier")
    dep = Airport(code="TRA", name="A", city="HCM", country="VN")
    arr = Airport(code="TRB", name="B", city="HN", country="VN")
    seed_session.add_all([airline, dep, arr])
    seed_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="TR100",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1000000.00"),
        available_seats=10,
        status="scheduled",
    )
    seed_session.add(flight)
    seed_session.flush()

    booking = Booking(
        booking_code="BK-TX-ROLLBACK-001",
        user_id=user.id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("1000000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("1000000.00"),
        currency="VND",
        payment_status=PaymentStatus.pending,
        booked_at=datetime.now(timezone.utc),
    )
    seed_session.add(booking)
    seed_session.flush()

    seed_session.add(
        BookingItem(
            booking_id=booking.id,
            item_type=BookingItemType.flight,
            flight_id=flight.id,
            quantity=1,
            unit_price=Decimal("1000000.00"),
            total_price=Decimal("1000000.00"),
        )
    )
    payment = Payment(
        booking_id=booking.id,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.pending,
        amount=Decimal("1000000.00"),
        currency="VND",
        gateway_order_ref="PAY-TX-ROLLBACK-001",
        gateway_transaction_ref=None,
        idempotency_key="tx-rollback-idem-001",
        paid_at=None,
    )
    seed_session.add(payment)
    seed_session.commit()
    payment_id = payment.id
    booking_id = booking.id
    seed_session.close()

    original_save = PaymentRepository.save

    def broken_save(self, payment_obj):
        raise RuntimeError("Simulated payment save failure")

    monkeypatch.setattr(PaymentRepository, "save", broken_save)

    callback_session = SessionLocal()
    service = PaymentCallbackService(
        db=callback_session,
        booking_repo=BookingRepository(callback_session),
        payment_repo=PaymentRepository(callback_session),
        audit_service=AuditService(AuditRepository(callback_session)),
        email_worker=EmailWorker(),
        domain_service=PaymentCallbackDomainService(),
    )

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": "PAY-TX-ROLLBACK-001",
        "gateway_transaction_ref": "TXN-TX-ROLLBACK-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    try:
        with pytest.raises(RuntimeError, match="Simulated payment save failure"):
            service.process_callback(**payload)
    finally:
        callback_session.close()
        monkeypatch.setattr(PaymentRepository, "save", original_save)

    verify_session = SessionLocal()
    persisted_payment = verify_session.query(Payment).filter(Payment.id == payment_id).first()
    persisted_booking = verify_session.query(Booking).filter(Booking.id == booking_id).first()
    persisted_callbacks = (
        verify_session.query(PaymentCallback).filter(PaymentCallback.payment_id == payment_id).all()
    )

    assert persisted_payment is not None
    assert (
        persisted_payment.status.value
        if hasattr(persisted_payment.status, "value")
        else str(persisted_payment.status)
    ) == "pending"
    assert persisted_booking is not None
    assert (
        persisted_booking.payment_status.value
        if hasattr(persisted_booking.payment_status, "value")
        else str(persisted_booking.payment_status)
    ) == "pending"
    assert persisted_callbacks == []
    verify_session.close()


def test_payment_callback_persists_across_sessions(db_engine):
    SessionLocal = sessionmaker(bind=db_engine, autocommit=False, autoflush=False)

    seed_session = SessionLocal()
    user = User(
        email="persist-callback@example.com",
        username="persist_callback",
        full_name="Persist Callback",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    seed_session.add(user)
    seed_session.flush()

    airline = Airline(code="PC", name="Persist Carrier")
    dep = Airport(code="PCA", name="Persist A", city="HCM", country="VN")
    arr = Airport(code="PCB", name="Persist B", city="HN", country="VN")
    seed_session.add_all([airline, dep, arr])
    seed_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="PC100",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1000000.00"),
        available_seats=10,
        status="scheduled",
    )
    seed_session.add(flight)
    seed_session.flush()

    booking = Booking(
        booking_code="BK-TX-PERSIST-001",
        user_id=user.id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("1000000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("1000000.00"),
        currency="VND",
        payment_status=PaymentStatus.pending,
        booked_at=datetime.now(timezone.utc),
    )
    seed_session.add(booking)
    seed_session.flush()

    seed_session.add(
        BookingItem(
            booking_id=booking.id,
            item_type=BookingItemType.flight,
            flight_id=flight.id,
            quantity=1,
            unit_price=Decimal("1000000.00"),
            total_price=Decimal("1000000.00"),
        )
    )
    payment = Payment(
        booking_id=booking.id,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.pending,
        amount=Decimal("1000000.00"),
        currency="VND",
        gateway_order_ref="PAY-PERSIST-001",
        gateway_transaction_ref=None,
        idempotency_key="persist-idem-001",
        paid_at=None,
    )
    seed_session.add(payment)
    seed_session.commit()
    payment_id = payment.id
    booking_id = booking.id
    seed_session.close()

    callback_session = SessionLocal()
    service = PaymentCallbackService(
        db=callback_session,
        booking_repo=BookingRepository(callback_session),
        payment_repo=PaymentRepository(callback_session),
        audit_service=AuditService(AuditRepository(callback_session)),
        email_worker=EmailWorker(),
        domain_service=PaymentCallbackDomainService(),
    )

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": "PAY-PERSIST-001",
        "gateway_transaction_ref": "TXN-PERSIST-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    service.process_callback(**payload)
    callback_session.close()

    verify_session = SessionLocal()
    persisted_payment = verify_session.query(Payment).filter(Payment.id == payment_id).first()
    persisted_booking = verify_session.query(Booking).filter(Booking.id == booking_id).first()
    persisted_callbacks = (
        verify_session.query(PaymentCallback).filter(PaymentCallback.payment_id == payment_id).all()
    )

    assert persisted_payment is not None
    assert (
        persisted_payment.status.value
        if hasattr(persisted_payment.status, "value")
        else str(persisted_payment.status)
    ) == "paid"
    assert persisted_booking is not None
    assert (
        persisted_booking.payment_status.value
        if hasattr(persisted_booking.payment_status, "value")
        else str(persisted_booking.payment_status)
    ) == "paid"
    assert len(persisted_callbacks) == 1
    verify_session.close()


def test_payment_callback_uses_locked_booking_and_payment_lookup(db_engine, monkeypatch):
    SessionLocal = sessionmaker(bind=db_engine, autocommit=False, autoflush=False)

    seed_session = SessionLocal()
    user = User(
        email="lock-callback@example.com",
        username="lock_callback",
        full_name="Lock Callback",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    seed_session.add(user)
    seed_session.commit()

    booking = seed_booking_for_payment(seed_session, str(user.id))
    payment = Payment(
        booking_id=booking.id,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.pending,
        amount=Decimal("1000000.00"),
        currency="VND",
        gateway_order_ref="PAY-LOCK-LOOKUP-001",
        gateway_transaction_ref=None,
        idempotency_key="lock-lookup-idem-001",
        paid_at=None,
    )
    seed_session.add(payment)
    seed_session.commit()
    payment_id = str(payment.id)
    booking_id = str(booking.id)
    seed_session.close()

    callback_session = SessionLocal()
    booking_repo = BookingRepository(callback_session)
    payment_repo = PaymentRepository(callback_session)
    booking_locked_calls: list[str] = []
    payment_locked_calls: list[str] = []
    original_booking_locked_lookup = booking_repo.get_by_id_for_update
    original_payment_locked_lookup = payment_repo.get_by_id_for_update

    def fail_unlocked_booking_lookup(*args, **kwargs):
        raise AssertionError("callback flow must use locked booking lookup")

    def fail_old_payment_lock_lookup(*args, **kwargs):
        raise AssertionError("callback flow should no longer lock by gateway ref directly")

    def track_locked_booking_lookup(booking_id_value: str):
        booking_locked_calls.append(booking_id_value)
        return original_booking_locked_lookup(booking_id_value)

    def track_locked_payment_lookup(payment_id_value: str):
        payment_locked_calls.append(payment_id_value)
        return original_payment_locked_lookup(payment_id_value)

    monkeypatch.setattr(booking_repo, "get_by_id", fail_unlocked_booking_lookup)
    monkeypatch.setattr(booking_repo, "get_by_id_for_update", track_locked_booking_lookup)
    monkeypatch.setattr(
        payment_repo,
        "get_by_gateway_order_ref_for_update",
        fail_old_payment_lock_lookup,
    )
    monkeypatch.setattr(payment_repo, "get_by_id_for_update", track_locked_payment_lookup)

    service = PaymentCallbackService(
        db=callback_session,
        booking_repo=booking_repo,
        payment_repo=payment_repo,
        audit_service=AuditService(AuditRepository(callback_session)),
        email_worker=EmailWorker(),
        domain_service=PaymentCallbackDomainService(),
    )

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": "PAY-LOCK-LOOKUP-001",
        "gateway_transaction_ref": "TXN-LOCK-LOOKUP-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    try:
        service.process_callback(**payload)
    finally:
        callback_session.close()

    assert booking_locked_calls == [booking_id]
    assert payment_locked_calls == [payment_id]

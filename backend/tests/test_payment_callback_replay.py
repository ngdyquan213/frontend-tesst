from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from threading import Barrier

from sqlalchemy.orm import sessionmaker

from app.core.exceptions import ValidationAppException
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


def create_user_and_login(client, db_session, email: str, username: str):
    user = User(
        email=email,
        username=username,
        full_name=username,
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123"},
    )
    return user, resp.json()["access_token"]


def seed_booking(db_session, user_id: str):
    airline = Airline(code="RP", name="Replay Airline")
    dep = Airport(code="RPA", name="Replay A", city="A", country="VN")
    arr = Airport(code="RPB", name="Replay B", city="B", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="RP100",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1000000.00"),
        available_seats=5,
        status="scheduled",
    )
    db_session.add(flight)
    db_session.flush()

    booking = Booking(
        booking_code="BK-REPLAY-001",
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


def test_payment_callback_replay_detected(client, db_session):
    user, token = create_user_and_login(client, db_session, "replay@example.com", "replay")
    booking = seed_booking(db_session, str(user.id))

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "replay-idem"},
    )
    payment = init_resp.json()

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-REPLAY-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    first = client.post("/api/v1/payments/callback", json=payload)
    second = client.post("/api/v1/payments/callback", json=payload)

    assert first.status_code == 200
    assert second.status_code == 400
    assert second.json()["detail"] == "Replay callback detected"


def test_payment_callback_replay_detected_under_concurrency(db_engine, monkeypatch):
    SessionLocal = sessionmaker(bind=db_engine, autocommit=False, autoflush=False)

    seed_session = SessionLocal()
    users: list[User] = []
    for index in range(2):
        user = User(
            email=f"replay-concurrent-{index}@example.com",
            username=f"replay_concurrent_{index}",
            full_name=f"Replay Concurrent {index}",
            password_hash=get_password_hash("Password123"),
            status=UserStatus.active,
            email_verified=True,
            phone_verified=False,
            failed_login_count=0,
        )
        seed_session.add(user)
        users.append(user)
    seed_session.flush()

    airline = Airline(code="RC", name="Replay Concurrent Airline")
    dep = Airport(code="RCA", name="Replay A", city="A", country="VN")
    arr = Airport(code="RCB", name="Replay B", city="B", country="VN")
    seed_session.add_all([airline, dep, arr])
    seed_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="RC100",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1000000.00"),
        available_seats=5,
        status="scheduled",
    )
    seed_session.add(flight)
    seed_session.flush()

    payments: list[Payment] = []
    for index, user in enumerate(users, start=1):
        booking = Booking(
            booking_code=f"BK-REPLAY-CONCURRENT-00{index}",
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
            gateway_order_ref=f"PAY-REPLAY-CONCURRENT-00{index}",
            gateway_transaction_ref=None,
            idempotency_key=f"replay-concurrent-idem-00{index}",
            paid_at=None,
        )
        seed_session.add(payment)
        payments.append(payment)
    seed_session.commit()
    payment_ids = [payment.id for payment in payments]
    seed_session.close()

    original_add_callback = PaymentRepository.add_callback
    barrier = Barrier(2)

    def coordinated_add_callback(self, callback):
        if callback.gateway_transaction_ref == "TXN-REPLAY-CONCURRENT-001":
            barrier.wait(timeout=5)
        return original_add_callback(self, callback)

    monkeypatch.setattr(PaymentRepository, "add_callback", coordinated_add_callback)

    payloads = []
    for index in range(2):
        payload = {
            "gateway_name": "vnpay",
            "gateway_order_ref": f"PAY-REPLAY-CONCURRENT-00{index + 1}",
            "gateway_transaction_ref": "TXN-REPLAY-CONCURRENT-001",
            "amount": "1000000.00",
            "currency": "VND",
            "status": "paid",
        }
        payload["signature"] = build_payment_callback_signature(**payload)
        payloads.append(payload)

    def process_once(payload) -> tuple[str, str]:
        session = SessionLocal()
        service = PaymentCallbackService(
            db=session,
            booking_repo=BookingRepository(session),
            payment_repo=PaymentRepository(session),
            audit_service=AuditService(AuditRepository(session)),
            email_worker=EmailWorker(),
            domain_service=PaymentCallbackDomainService(),
        )
        try:
            service.process_callback(**payload)
            return "success", "processed"
        except ValidationAppException as exc:
            return "error", str(exc)
        finally:
            session.close()

    try:
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(process_once, payloads))
    finally:
        monkeypatch.setattr(PaymentRepository, "add_callback", original_add_callback)

    statuses = Counter(status for status, _value in results)
    assert statuses["success"] == 1
    assert statuses["error"] == 1
    assert any(
        value == "Replay callback detected" for status, value in results if status == "error"
    )

    verify_session = SessionLocal()
    callbacks = (
        verify_session.query(PaymentCallback)
        .filter(PaymentCallback.payment_id.in_(payment_ids))
        .all()
    )
    assert len(callbacks) == 1
    verify_session.close()

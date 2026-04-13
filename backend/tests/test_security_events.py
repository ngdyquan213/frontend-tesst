from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import build_payment_callback_signature, get_password_hash
from app.models.audit import SecurityEvent
from app.models.booking import Booking, BookingItem
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    PaymentStatus,
    SecurityEventType,
    UserStatus,
)
from app.models.flight import Airline, Airport, Flight
from app.models.user import User


def create_user(db_session, *, email: str, username: str, password: str = "Password123"):
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
    return user


def get_latest_security_event(db_session):
    return db_session.query(SecurityEvent).order_by(SecurityEvent.detected_at.desc()).first()


def seed_flight_booking_for_payment(
    db_session,
    user_id: str,
    *,
    booking_code: str = "BK-SE-001",
    code_suffix: str = "01",
):
    airline = Airline(code=f"SE{code_suffix}", name="Security Event Airline")
    dep = Airport(code=f"SA{code_suffix}", name="A", city="A", country="VN")
    arr = Airport(code=f"SB{code_suffix}", name="B", city="B", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="SE100",
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
        booking_code=booking_code,
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

    item = BookingItem(
        booking_id=booking.id,
        item_type=BookingItemType.flight,
        flight_id=flight.id,
        quantity=1,
        unit_price=Decimal("1000000.00"),
        total_price=Decimal("1000000.00"),
    )
    db_session.add(item)
    db_session.commit()
    return booking


def test_login_failure_creates_security_event(client, db_session):
    create_user(
        db_session,
        email="sec-login@example.com",
        username="sec_login",
        password="Password123",
    )

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "sec-login@example.com", "password": "WrongPassword123"},
    )
    assert resp.status_code == 401

    event = get_latest_security_event(db_session)
    assert event is not None
    assert (
        event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type)
    ) == SecurityEventType.auth.value
    assert "Login failed" in event.title


def test_invalid_payment_callback_signature_creates_security_event(client, db_session):
    user = create_user(
        db_session,
        email="sec-pay1@example.com",
        username="sec_pay1",
    )
    booking = seed_flight_booking_for_payment(db_session, str(user.id))

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "sec-pay1@example.com", "password": "Password123"},
    )
    token = login.json()["access_token"]

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "sec-invalid-signature"},
    )
    assert init_resp.status_code == 201
    payment = init_resp.json()

    resp = client.post(
        "/api/v1/payments/callback",
        json={
            "timestamp": int(datetime.now(timezone.utc).timestamp()),
            "gateway_name": "vnpay",
            "gateway_order_ref": payment["gateway_order_ref"],
            "gateway_transaction_ref": "TXN-SEC-INVALID-001",
            "amount": "1000000.00",
            "currency": "VND",
            "status": "paid",
            "signature": "invalid-signature",
        },
    )
    assert resp.status_code == 400

    event = get_latest_security_event(db_session)
    assert event is not None
    assert (
        event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type)
    ) == SecurityEventType.payment.value
    assert "Invalid payment callback signature" in event.title


def test_replay_callback_creates_security_event(client, db_session):
    user = create_user(
        db_session,
        email="sec-pay2@example.com",
        username="sec_pay2",
    )
    primary_booking = seed_flight_booking_for_payment(
        db_session,
        str(user.id),
        booking_code="BK-SE-REPLAY-001",
        code_suffix="11",
    )
    duplicate_booking = seed_flight_booking_for_payment(
        db_session,
        str(user.id),
        booking_code="BK-SE-REPLAY-002",
        code_suffix="12",
    )

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "sec-pay2@example.com", "password": "Password123"},
    )
    token = login.json()["access_token"]

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(primary_booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "sec-replay"},
    )
    assert init_resp.status_code == 201
    payment = init_resp.json()
    duplicate_init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(duplicate_booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "sec-replay-duplicate"},
    )
    assert duplicate_init_resp.status_code == 201
    duplicate_payment = duplicate_init_resp.json()

    payload = {
        "timestamp": int(datetime.now(timezone.utc).timestamp()),
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-SEC-REPLAY-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)
    conflicting_payload = {
        "timestamp": payload["timestamp"],
        "gateway_name": payload["gateway_name"],
        "gateway_order_ref": duplicate_payment["gateway_order_ref"],
        "gateway_transaction_ref": payload["gateway_transaction_ref"],
        "amount": payload["amount"],
        "currency": payload["currency"],
        "status": payload["status"],
    }
    conflicting_payload["signature"] = build_payment_callback_signature(**conflicting_payload)

    first = client.post("/api/v1/payments/callback", json=payload)
    second = client.post("/api/v1/payments/callback", json=conflicting_payload)

    assert first.status_code == 200
    assert second.status_code == 400

    event = get_latest_security_event(db_session)
    assert event is not None
    assert (
        event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type)
    ) == SecurityEventType.payment.value
    assert "Replay payment callback detected" in event.title


def test_payment_amount_mismatch_creates_security_event(client, db_session):
    user = create_user(
        db_session,
        email="sec-pay3@example.com",
        username="sec_pay3",
    )
    booking = seed_flight_booking_for_payment(db_session, str(user.id))

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "sec-pay3@example.com", "password": "Password123"},
    )
    token = login.json()["access_token"]

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "sec-mismatch"},
    )
    assert init_resp.status_code == 201
    payment = init_resp.json()

    payload = {
        "timestamp": int(datetime.now(timezone.utc).timestamp()),
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-SEC-MISMATCH-001",
        "amount": "999999.00",
        "currency": "VND",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    resp = client.post("/api/v1/payments/callback", json=payload)
    assert resp.status_code == 400

    event = get_latest_security_event(db_session)
    assert event is not None
    assert (
        event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type)
    ) == SecurityEventType.payment.value
    assert "Payment callback amount mismatch" in event.title

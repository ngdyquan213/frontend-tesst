from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import build_payment_callback_signature, get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    PaymentStatus,
    UserStatus,
)
from app.models.flight import Airline, Airport, Flight
from app.models.user import User


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
    token = login_resp.json()["access_token"]
    return user, token


def seed_flight_booking(
    db_session, user_id: str, *, booking_code: str, amount: Decimal = Decimal("1000000.00")
):
    airline = Airline(code=f"AL{booking_code[-2:]}", name=f"Airline {booking_code}")
    dep = Airport(code=f"D{booking_code[-2:]}", name="Departure", city="HCM", country="VN")
    arr = Airport(code=f"A{booking_code[-2:]}", name="Arrival", city="HN", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number=f"VN{booking_code[-3:]}",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=amount,
        available_seats=10,
        status="scheduled",
    )
    db_session.add(flight)
    db_session.flush()

    booking = Booking(
        booking_code=booking_code,
        user_id=user_id,
        status=BookingStatus.pending,
        total_base_amount=amount,
        total_discount_amount=Decimal("0.00"),
        total_final_amount=amount,
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
        unit_price=amount,
        total_price=amount,
    )
    db_session.add(item)
    db_session.commit()

    return booking


def test_initiate_payment_is_idempotent_for_same_booking_and_key(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        email="pay-idem@example.com",
        username="pay_idem",
    )
    booking = seed_flight_booking(db_session, str(user.id), booking_code="BK-PAY-IDEM-001")

    headers = {
        "Authorization": f"Bearer {token}",
        "Idempotency-Key": "idem-key-001",
    }

    payload = {
        "booking_id": str(booking.id),
        "payment_method": "vnpay",
    }

    resp1 = client.post("/api/v1/payments/initiate", json=payload, headers=headers)
    resp2 = client.post("/api/v1/payments/initiate", json=payload, headers=headers)

    assert resp1.status_code in (200, 201)
    assert resp2.status_code in (200, 201)

    body1 = resp1.json()
    body2 = resp2.json()

    assert body1["id"] == body2["id"]
    assert body1["gateway_order_ref"] == body2["gateway_order_ref"]
    assert body1["status"] == "pending"


def test_initiate_payment_requires_idempotency_key(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        email="pay-no-idem@example.com",
        username="pay_no_idem",
    )
    booking = seed_flight_booking(db_session, str(user.id), booking_code="BK-PAY-NO-IDEM")

    resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "vnpay",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 400
    body = resp.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert body["message"] == "Idempotency key is required"


def test_payment_callback_rejects_invalid_status(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        email="pay-invalid-status@example.com",
        username="pay_invalid_status",
    )
    booking = seed_flight_booking(db_session, str(user.id), booking_code="BK-PAY-INVALID-STATUS")

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "vnpay",
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": "pay-invalid-status-001",
        },
    )
    assert init_resp.status_code in (200, 201)
    payment = init_resp.json()

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-INVALID-STATUS-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "unknown_status",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    resp = client.post("/api/v1/payments/callback", json=payload)

    assert resp.status_code == 400
    body = resp.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert body["message"] == "Unsupported payment callback status"


def test_payment_callback_not_found_order_ref(client):
    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": "ORDER-NOT-FOUND-001",
        "gateway_transaction_ref": "TXN-NOT-FOUND-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    resp = client.post("/api/v1/payments/callback", json=payload)

    assert resp.status_code == 404
    body = resp.json()
    assert body["error_code"] == "NOT_FOUND"
    assert body["message"] == "Payment not found"


def test_payment_callback_paid_transition_updates_payment_and_booking(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        email="pay-paid@example.com",
        username="pay_paid",
    )
    booking = seed_flight_booking(db_session, str(user.id), booking_code="BK-PAY-PAID-001")

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "vnpay",
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": "pay-paid-001",
        },
    )
    assert init_resp.status_code in (200, 201)
    payment = init_resp.json()

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-PAID-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    resp = client.post("/api/v1/payments/callback", json=payload)
    assert resp.status_code == 200

    body = resp.json()
    assert body["status"] == "paid"
    assert body["gateway_transaction_ref"] == "TXN-PAID-001"


def test_payment_callback_failed_transition_updates_payment(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        email="pay-failed@example.com",
        username="pay_failed",
    )
    booking = seed_flight_booking(db_session, str(user.id), booking_code="BK-PAY-FAILED-001")

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "vnpay",
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": "pay-failed-001",
        },
    )
    assert init_resp.status_code in (200, 201)
    payment = init_resp.json()

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-FAILED-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "failed",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    resp = client.post("/api/v1/payments/callback", json=payload)
    assert resp.status_code == 200

    body = resp.json()
    assert body["status"] == "failed"
    assert body["gateway_transaction_ref"] == "TXN-FAILED-001"


def test_payment_callback_cancelled_transition_updates_payment(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        email="pay-cancelled@example.com",
        username="pay_cancelled",
    )
    booking = seed_flight_booking(db_session, str(user.id), booking_code="BK-PAY-CANCEL-001")

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "vnpay",
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": "pay-cancel-001",
        },
    )
    assert init_resp.status_code in (200, 201)
    payment = init_resp.json()

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-CANCELLED-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "cancelled",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    resp = client.post("/api/v1/payments/callback", json=payload)
    assert resp.status_code == 200

    body = resp.json()
    assert body["status"] == "cancelled"
    assert body["gateway_transaction_ref"] == "TXN-CANCELLED-001"

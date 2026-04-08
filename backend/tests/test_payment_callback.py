from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import build_payment_callback_signature, get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.enums import BookingItemType, BookingStatus, PaymentStatus, UserStatus
from app.models.flight import Airline, Airport, Flight
from app.models.user import User


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
    assert resp.status_code == 200
    return user, resp.json()["access_token"]


def seed_flight(db_session):
    airline = Airline(code="CB", name="Callback Airline")
    dep = Airport(code="CBC", name="Callback Departure", city="A", country="VN")
    arr = Airport(code="CBD", name="Callback Arrival", city="B", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="CB100",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("2000000.00"),
        available_seats=10,
        status="scheduled",
    )
    db_session.add(flight)
    db_session.commit()
    return flight


def seed_booking(db_session, user_id: str):
    flight = seed_flight(db_session)

    booking = Booking(
        booking_code="BK-CALLBACK-001",
        user_id=user_id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("2000000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("2000000.00"),
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
        unit_price=Decimal("2000000.00"),
        total_price=Decimal("2000000.00"),
    )
    db_session.add(item)
    db_session.commit()

    return booking


def test_payment_callback_paid_success(client, db_session):
    user, token = create_user_and_login(client, db_session, "cb1@example.com", "cb1")
    booking = seed_booking(db_session, str(user.id))

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "cb-idem-1"},
    )
    assert init_resp.status_code == 201
    payment = init_resp.json()

    signature = build_payment_callback_signature(
        gateway_name="vnpay",
        gateway_order_ref=payment["gateway_order_ref"],
        gateway_transaction_ref="TXN-CB-001",
        amount="2000000.00",
        currency="VND",
        status="paid",
    )

    callback_resp = client.post(
        "/api/v1/payments/callback",
        json={
            "gateway_name": "vnpay",
            "gateway_order_ref": payment["gateway_order_ref"],
            "gateway_transaction_ref": "TXN-CB-001",
            "amount": "2000000.00",
            "currency": "VND",
            "status": "paid",
            "signature": signature,
        },
    )
    assert callback_resp.status_code == 200
    assert callback_resp.json()["success"] is True

    status_resp = client.get(
        f"/api/v1/payments/booking/{booking.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert status_resp.status_code == 200
    body = status_resp.json()
    assert body["booking_payment_status"] == "paid"
    assert body["payment"]["status"] == "paid"


def test_payment_callback_invalid_signature(client, db_session):
    user, token = create_user_and_login(client, db_session, "cb2@example.com", "cb2")
    booking = seed_booking(db_session, str(user.id))

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "cb-idem-2"},
    )
    assert init_resp.status_code == 201
    payment = init_resp.json()

    callback_resp = client.post(
        "/api/v1/payments/callback",
        json={
            "gateway_name": "vnpay",
            "gateway_order_ref": payment["gateway_order_ref"],
            "gateway_transaction_ref": "TXN-CB-002",
            "amount": "2000000.00",
            "currency": "VND",
            "status": "paid",
            "signature": "invalid-signature",
        },
    )
    assert callback_resp.status_code == 400
    assert callback_resp.json()["detail"] == "Invalid callback signature"


def test_payment_callback_rejects_source_outside_allowlist(client, db_session, monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(
        config_module.settings,
        "PAYMENT_CALLBACK_SOURCE_ALLOWLIST",
        "203.0.113.10/32",
    )

    user, token = create_user_and_login(client, db_session, "cb3@example.com", "cb3")
    booking = seed_booking(db_session, str(user.id))

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "cb-idem-3"},
    )
    assert init_resp.status_code == 201
    payment = init_resp.json()

    signature = build_payment_callback_signature(
        gateway_name="vnpay",
        gateway_order_ref=payment["gateway_order_ref"],
        gateway_transaction_ref="TXN-CB-003",
        amount="2000000.00",
        currency="VND",
        status="paid",
    )

    callback_resp = client.post(
        "/api/v1/payments/callback",
        json={
            "gateway_name": "vnpay",
            "gateway_order_ref": payment["gateway_order_ref"],
            "gateway_transaction_ref": "TXN-CB-003",
            "amount": "2000000.00",
            "currency": "VND",
            "status": "paid",
            "signature": signature,
        },
    )

    assert callback_resp.status_code == 400
    assert callback_resp.json()["detail"] == "Callback source is not allowed"

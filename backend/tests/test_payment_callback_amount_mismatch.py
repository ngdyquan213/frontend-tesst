from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import build_payment_callback_signature, get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.enums import BookingItemType, BookingStatus, PaymentStatus, UserStatus
from app.models.flight import Airline, Airport, Flight
from app.models.user import User


def test_payment_callback_amount_mismatch(client, db_session):
    user = User(
        email="mismatch@example.com",
        username="mismatch",
        full_name="Mismatch User",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.flush()

    airline = Airline(code="MM", name="Mismatch Airline")
    dep = Airport(code="MMA", name="A", city="A", country="VN")
    arr = Airport(code="MMB", name="B", city="B", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="MM100",
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
        booking_code="BK-MISMATCH-001",
        user_id=user.id,
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

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "mismatch@example.com", "password": "Password123"},
    )
    token = login.json()["access_token"]

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "mismatch-idem"},
    )
    payment = init_resp.json()

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-MISMATCH-001",
        "amount": "999999.00",
        "currency": "VND",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    resp = client.post("/api/v1/payments/callback", json=payload)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Payment amount mismatch"


def test_payment_callback_currency_mismatch(client, db_session):
    user = User(
        email="currency-mismatch@example.com",
        username="currency_mismatch",
        full_name="Currency Mismatch User",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.flush()

    airline = Airline(code="CM", name="Currency Mismatch Airline")
    dep = Airport(code="CMA", name="A", city="A", country="VN")
    arr = Airport(code="CMB", name="B", city="B", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="CM100",
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
        booking_code="BK-CURRENCY-MISMATCH-001",
        user_id=user.id,
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

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "currency-mismatch@example.com", "password": "Password123"},
    )
    token = login.json()["access_token"]

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "currency-mismatch-idem"},
    )
    payment = init_resp.json()

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-CURRENCY-MISMATCH-001",
        "amount": "1000000.00",
        "currency": "USD",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    resp = client.post("/api/v1/payments/callback", json=payload)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Payment currency mismatch"

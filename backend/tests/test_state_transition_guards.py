from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import build_payment_callback_signature, get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    PaymentMethod,
    PaymentStatus,
    RefundStatus,
    UserStatus,
)
from app.models.flight import Airline, Airport, Flight
from app.models.payment import Payment
from app.models.refund import Refund
from app.models.role import Role, UserRole
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
    return user, login_resp.json()["access_token"]


def create_admin_and_login(client, db_session):
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db_session.add(admin_role)
        db_session.flush()

    admin_user = User(
        email="admin-state@example.com",
        username="admin_state",
        full_name="Admin State",
        password_hash=get_password_hash("Admin12345"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(admin_user)
    db_session.flush()

    db_session.add(UserRole(user_id=admin_user.id, role_id=admin_role.id))
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin-state@example.com", "password": "Admin12345"},
    )
    assert resp.status_code == 200
    return admin_user, resp.json()["access_token"]


def seed_booking_for_payment(db_session, user_id: str, booking_code: str):
    airline = Airline(code=f"S{booking_code[-2:]}", name=f"State Air {booking_code}")
    dep = Airport(code=f"SD{booking_code[-2:]}", name="Departure", city="HCM", country="VN")
    arr = Airport(code=f"SA{booking_code[-2:]}", name="Arrival", city="HN", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number=f"ST{booking_code[-3:]}",
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


def seed_cancelled_booking_with_refund(db_session, user_id: str):
    booking = seed_booking_for_payment(db_session, user_id, "BK-REFUND-GUARD-001")
    payment = Payment(
        booking_id=booking.id,
        initiated_by=user_id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.refunded,
        amount=Decimal("1000000.00"),
        currency="VND",
        gateway_order_ref="ORDER-REFUND-GUARD",
        gateway_transaction_ref="TXN-REFUND-GUARD",
        paid_at=datetime.now(timezone.utc),
    )
    db_session.add(payment)
    db_session.flush()

    refund = Refund(
        payment_id=payment.id,
        amount=Decimal("1000000.00"),
        currency="VND",
        status=RefundStatus.pending,
        reason="Pending admin review",
    )
    db_session.add(refund)

    booking.status = BookingStatus.cancelled
    booking.payment_status = PaymentStatus.refunded
    booking.cancelled_at = datetime.now(timezone.utc)

    db_session.commit()
    return booking, payment, refund


def test_payment_callback_rejects_duplicate_paid_transition(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        email="state-paid@example.com",
        username="state_paid",
    )
    booking = seed_booking_for_payment(db_session, str(user.id), "BK-STATE-PAID-001")

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "state-paid-001"},
    )
    assert init_resp.status_code in (200, 201)
    payment = init_resp.json()

    payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-STATE-PAID-001",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "paid",
    }
    payload["signature"] = build_payment_callback_signature(**payload)

    first = client.post("/api/v1/payments/callback", json=payload)
    assert first.status_code == 200

    second_payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-STATE-PAID-002",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "paid",
    }
    second_payload["signature"] = build_payment_callback_signature(**second_payload)

    second = client.post("/api/v1/payments/callback", json=second_payload)
    assert second.status_code == 409
    assert second.json()["error_code"] == "CONFLICT"


def test_payment_callback_rejects_transition_from_paid_to_failed(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        email="state-paid-failed@example.com",
        username="state_paid_failed",
    )
    booking = seed_booking_for_payment(db_session, str(user.id), "BK-STATE-PF-001")

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "state-pf-001"},
    )
    assert init_resp.status_code in (200, 201)
    payment = init_resp.json()

    paid_payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-STATE-PF-PAID",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "paid",
    }
    paid_payload["signature"] = build_payment_callback_signature(**paid_payload)
    paid_resp = client.post("/api/v1/payments/callback", json=paid_payload)
    assert paid_resp.status_code == 200

    failed_payload = {
        "gateway_name": "vnpay",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-STATE-PF-FAILED",
        "amount": "1000000.00",
        "currency": "VND",
        "status": "failed",
    }
    failed_payload["signature"] = build_payment_callback_signature(**failed_payload)
    failed_resp = client.post("/api/v1/payments/callback", json=failed_payload)

    assert failed_resp.status_code == 409
    assert failed_resp.json()["error_code"] == "CONFLICT"


def test_cancel_booking_rejects_already_cancelled_booking(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        email="state-cancel@example.com",
        username="state_cancel",
    )
    booking = seed_booking_for_payment(db_session, str(user.id), "BK-STATE-CANCEL-001")
    booking.status = BookingStatus.cancelled
    booking.cancelled_at = datetime.now(timezone.utc)
    db_session.commit()

    resp = client.post(
        f"/api/v1/bookings/{booking.id}/cancel",
        json={"reason": "Second cancellation"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 409
    assert resp.json()["error_code"] == "CONFLICT"


def test_admin_refund_cannot_transition_from_processed_to_failed(client, db_session):
    _admin_user, admin_token = create_admin_and_login(client, db_session)
    normal_user, _ = create_user_and_login(
        client,
        db_session,
        email="state-refund@example.com",
        username="state_refund",
    )
    _booking, _payment, refund = seed_cancelled_booking_with_refund(db_session, str(normal_user.id))

    first = client.put(
        f"/api/v1/admin/refunds/{refund.id}",
        json={"status": "processed", "reason": "Approved"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert first.status_code == 200

    second = client.put(
        f"/api/v1/admin/refunds/{refund.id}",
        json={"status": "failed", "reason": "Should not move back"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert second.status_code == 409
    assert second.json()["error_code"] == "CONFLICT"

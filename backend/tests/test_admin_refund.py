from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import get_password_hash
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


def create_admin_and_login(client, db_session):
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db_session.add(admin_role)
        db_session.flush()

    admin_user = User(
        email="admin-refund@example.com",
        username="admin_refund",
        full_name="Admin Refund",
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
        json={"email": "admin-refund@example.com", "password": "Admin12345"},
    )
    assert resp.status_code == 200
    return admin_user, resp.json()["access_token"]


def create_normal_user(db_session):
    user = User(
        email="refund-user@example.com",
        username="refund_user",
        full_name="Refund User",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()
    return user


def seed_refund(db_session, user_id: str):
    airline = Airline(code="AR", name="Admin Refund Air")
    dep = Airport(code="ARA", name="A", city="A", country="VN")
    arr = Airport(code="ARB", name="B", city="B", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="AR100",
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
        booking_code="BK-ADMIN-REFUND",
        user_id=user_id,
        status=BookingStatus.cancelled,
        total_base_amount=Decimal("1000000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("1000000.00"),
        currency="VND",
        payment_status=PaymentStatus.refunded,
        booked_at=datetime.now(timezone.utc),
        cancelled_at=datetime.now(timezone.utc),
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
    db_session.flush()

    payment = Payment(
        booking_id=booking.id,
        initiated_by=user_id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.refunded,
        amount=Decimal("1000000.00"),
        currency="VND",
        gateway_order_ref="ORDER-ADMIN-REFUND-001",
        gateway_transaction_ref="TXN-ADMIN-REFUND-001",
        paid_at=datetime.now(timezone.utc),
    )
    db_session.add(payment)
    db_session.flush()

    refund = Refund(
        payment_id=payment.id,
        amount=Decimal("1000000.00"),
        currency="VND",
        status="pending",
        reason="Initial refund pending",
    )
    db_session.add(refund)
    db_session.commit()
    return booking, refund


def test_admin_can_list_refunds(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    user = create_normal_user(db_session)
    seed_refund(db_session, str(user.id))

    resp = client.get(
        "/api/v1/admin/refunds",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert body["total"] >= 1
    assert len(body["items"]) >= 1


def test_admin_can_update_refund_status(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    user = create_normal_user(db_session)
    _, refund = seed_refund(db_session, str(user.id))

    resp = client.put(
        f"/api/v1/admin/refunds/{refund.id}",
        json={"status": "processed", "reason": "Reviewed and approved"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "processed"
    assert body["reason"] == "Reviewed and approved"

    db_session.expire_all()
    saved_refund = db_session.query(Refund).filter(Refund.id == refund.id).first()
    assert saved_refund is not None
    assert saved_refund.status == RefundStatus.processed
    assert saved_refund.reason == "Reviewed and approved"


def test_admin_can_list_cancelled_bookings(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    user = create_normal_user(db_session)
    seed_refund(db_session, str(user.id))

    resp = client.get(
        "/api/v1/admin/cancelled-bookings",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert body["total"] >= 1

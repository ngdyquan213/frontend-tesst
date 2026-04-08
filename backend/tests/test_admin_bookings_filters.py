from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentStatus, UserStatus
from app.models.role import Role, UserRole
from app.models.user import User


def create_admin_and_login(client, db_session):
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db_session.add(admin_role)
        db_session.flush()

    admin_user = User(
        email="admin-booking-filter@example.com",
        username="admin_booking_filter",
        full_name="Admin Booking Filter",
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
        json={"email": admin_user.email, "password": "Admin12345"},
    )
    assert resp.status_code == 200
    return admin_user, resp.json()["access_token"]


def seed_user(db_session, suffix: str):
    user = User(
        email=f"user-booking-{suffix}@example.com",
        username=f"user_booking_{suffix}",
        full_name=f"User Booking {suffix}",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()
    return user


def seed_booking(
    db_session,
    *,
    user_id,
    booking_code: str,
    status: BookingStatus,
    payment_status: PaymentStatus,
    amount: str,
    booked_at: datetime,
):
    booking = Booking(
        booking_code=booking_code,
        user_id=user_id,
        status=status,
        total_base_amount=Decimal(amount),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal(amount),
        currency="VND",
        payment_status=payment_status,
        booked_at=booked_at,
    )
    db_session.add(booking)
    db_session.commit()
    return booking


def test_admin_bookings_filter_by_status(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_user(db_session, "status")

    seed_booking(
        db_session,
        user_id=user.id,
        booking_code="BK-PENDING-001",
        status=BookingStatus.pending,
        payment_status=PaymentStatus.pending,
        amount="1000000.00",
        booked_at=datetime.now(timezone.utc),
    )
    seed_booking(
        db_session,
        user_id=user.id,
        booking_code="BK-CANCELLED-001",
        status=BookingStatus.cancelled,
        payment_status=PaymentStatus.cancelled,
        amount="1200000.00",
        booked_at=datetime.now(timezone.utc),
    )

    resp = client.get(
        "/api/v1/admin/bookings?status=pending",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()

    assert body["total"] >= 1
    assert all(item["status"] == "pending" for item in body["items"])


def test_admin_bookings_filter_by_payment_status(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_user(db_session, "payment")

    seed_booking(
        db_session,
        user_id=user.id,
        booking_code="BK-PAY-PENDING-001",
        status=BookingStatus.pending,
        payment_status=PaymentStatus.pending,
        amount="900000.00",
        booked_at=datetime.now(timezone.utc),
    )
    seed_booking(
        db_session,
        user_id=user.id,
        booking_code="BK-PAY-PAID-001",
        status=BookingStatus.confirmed,
        payment_status=PaymentStatus.paid,
        amount="1500000.00",
        booked_at=datetime.now(timezone.utc),
    )

    resp = client.get(
        "/api/v1/admin/bookings?payment_status=paid",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()

    assert body["total"] >= 1
    assert all(item["payment_status"] == "paid" for item in body["items"])


def test_admin_bookings_search_by_code(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_user(db_session, "code")

    seed_booking(
        db_session,
        user_id=user.id,
        booking_code="SPECIAL-CODE-ABC",
        status=BookingStatus.pending,
        payment_status=PaymentStatus.pending,
        amount="800000.00",
        booked_at=datetime.now(timezone.utc),
    )
    seed_booking(
        db_session,
        user_id=user.id,
        booking_code="NORMAL-CODE-XYZ",
        status=BookingStatus.pending,
        payment_status=PaymentStatus.pending,
        amount="850000.00",
        booked_at=datetime.now(timezone.utc),
    )

    resp = client.get(
        "/api/v1/admin/bookings?booking_code=ABC",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()

    assert body["total"] >= 1
    assert all("ABC" in item["booking_code"] for item in body["items"])


def test_admin_bookings_sort_by_amount_asc(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_user(db_session, "sort")

    seed_booking(
        db_session,
        user_id=user.id,
        booking_code="BK-AMOUNT-LOW",
        status=BookingStatus.pending,
        payment_status=PaymentStatus.pending,
        amount="500000.00",
        booked_at=datetime.now(timezone.utc) - timedelta(hours=2),
    )
    seed_booking(
        db_session,
        user_id=user.id,
        booking_code="BK-AMOUNT-HIGH",
        status=BookingStatus.pending,
        payment_status=PaymentStatus.pending,
        amount="1500000.00",
        booked_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )

    resp = client.get(
        "/api/v1/admin/bookings?sort_by=total_final_amount&sort_order=asc",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()

    amounts = [Decimal(str(item["total_final_amount"])) for item in body["items"]]
    assert amounts == sorted(amounts)

from datetime import datetime, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.models.audit import AuditLog
from app.models.booking import Booking
from app.models.enums import (
    BookingStatus,
    LogActorType,
    PaymentMethod,
    PaymentStatus,
    RefundStatus,
    UserStatus,
)
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
        email="admin-dashboard@example.com",
        username="admin_dashboard",
        full_name="Admin Dashboard",
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


def seed_normal_user(db_session):
    user = User(
        email="dashboard-user@example.com",
        username="dashboard_user",
        full_name="Dashboard User",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_admin_dashboard_summary(client, db_session):
    admin_user, token = create_admin_and_login(client, db_session)
    user = seed_normal_user(db_session)

    booking1 = Booking(
        booking_code="DASH-BOOKING-001",
        user_id=user.id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("1000000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("1000000.00"),
        currency="VND",
        payment_status=PaymentStatus.pending,
        booked_at=datetime.now(timezone.utc),
    )
    booking2 = Booking(
        booking_code="DASH-BOOKING-002",
        user_id=user.id,
        status=BookingStatus.cancelled,
        total_base_amount=Decimal("2000000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("2000000.00"),
        currency="VND",
        payment_status=PaymentStatus.refunded,
        booked_at=datetime.now(timezone.utc),
    )
    db_session.add_all([booking1, booking2])
    db_session.flush()

    payment1 = Payment(
        booking_id=booking1.id,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.paid,
        amount=Decimal("1000000.00"),
        currency="VND",
        gateway_order_ref="DASH-ORDER-001",
        gateway_transaction_ref="DASH-TXN-001",
        paid_at=datetime.now(timezone.utc),
    )
    payment2 = Payment(
        booking_id=booking2.id,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.refunded,
        amount=Decimal("2000000.00"),
        currency="VND",
        gateway_order_ref="DASH-ORDER-002",
        gateway_transaction_ref="DASH-TXN-002",
        paid_at=datetime.now(timezone.utc),
    )
    db_session.add_all([payment1, payment2])
    db_session.flush()

    refund = Refund(
        payment_id=payment2.id,
        amount=Decimal("500000.00"),
        currency="VND",
        status=RefundStatus.processed,
        reason="Dashboard test refund",
        processed_at=datetime.now(timezone.utc),
    )
    db_session.add(refund)

    log = AuditLog(
        actor_type=LogActorType.admin,
        actor_user_id=admin_user.id,
        action="dashboard_test_action",
        resource_type="dashboard",
        resource_id=None,
        ip_address="127.0.0.1",
        user_agent="pytest",
    )
    db_session.add(log)
    db_session.commit()

    resp = client.get(
        "/api/v1/admin/dashboard/summary?recent_limit=5",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200

    body = resp.json()
    assert "booking_status_counts" in body
    assert "payment_status_counts" in body
    assert "refund_status_counts" in body
    assert "revenue" in body
    assert "recent_activities" in body

    revenue = body["revenue"]
    assert Decimal(str(revenue["total_paid_amount"])) >= Decimal("1000000.00")
    assert Decimal(str(revenue["total_refunded_amount"])) >= Decimal("500000.00")
    assert Decimal(str(revenue["net_revenue_amount"])) == (
        Decimal(str(revenue["total_paid_amount"])) - Decimal(str(revenue["total_refunded_amount"]))
    )

    assert len(body["recent_activities"]) >= 1

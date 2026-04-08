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
from app.services.admin_export_service import AdminExportService


def create_admin_and_login(client, db_session):
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db_session.add(admin_role)
        db_session.flush()

    admin_user = User(
        email="admin-export@example.com",
        username="admin_export",
        full_name="Admin Export",
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
        email=f"user-export-{suffix}@example.com",
        username=f"user_export_{suffix}",
        full_name=f"User Export {suffix}",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_export_bookings_csv(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_user(db_session, "booking")

    booking = Booking(
        booking_code="EXPORT-BOOKING-001",
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
    db_session.commit()

    resp = client.get(
        "/api/v1/admin/bookings/export.csv?booking_code=EXPORT-BOOKING",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    content = resp.content.decode("utf-8-sig")
    assert "booking_code" in content
    assert "EXPORT-BOOKING-001" in content


def test_export_refunds_csv(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_user(db_session, "refund")

    payment = Payment(
        booking_id=None,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.refunded,
        amount=Decimal("500000.00"),
        currency="VND",
        gateway_order_ref="EXPORT-REFUND-ORDER",
    )
    db_session.add(payment)
    db_session.flush()

    refund = Refund(
        payment_id=payment.id,
        amount=Decimal("500000.00"),
        currency="VND",
        status=RefundStatus.pending,
        reason="Export test",
    )
    db_session.add(refund)
    db_session.commit()

    resp = client.get(
        "/api/v1/admin/refunds/export.csv?status=pending",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    content = resp.content.decode("utf-8-sig")
    assert "payment_id" in content
    assert str(payment.id) in content


def test_export_audit_logs_csv(client, db_session):
    admin_user, token = create_admin_and_login(client, db_session)

    log = AuditLog(
        actor_type=LogActorType.admin,
        actor_user_id=admin_user.id,
        action="export_test_action",
        resource_type="test_resource",
        resource_id=None,
        ip_address="127.0.0.1",
        user_agent="pytest",
    )
    db_session.add(log)
    db_session.commit()

    resp = client.get(
        "/api/v1/admin/audit-logs/export.csv",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    content = resp.content.decode("utf-8-sig")
    assert "action" in content
    assert "export_test_action" in content


def test_export_bookings_csv_sanitizes_formula_injection(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_user(db_session, "formula")

    booking = Booking(
        booking_code="=CMD|' /C calc'!A0",
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
    db_session.commit()

    resp = client.get(
        "/api/v1/admin/bookings/export.csv",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    content = resp.content.decode("utf-8-sig")
    assert "'=CMD|' /C calc'!A0" in content


def test_export_bookings_csv_fetches_all_batches():
    class FakeBooking:
        def __init__(self, index: int) -> None:
            self.id = index
            self.booking_code = f"EXPORT-{index}"
            self.user_id = index
            self.status = BookingStatus.pending
            self.total_final_amount = Decimal("1000.00")
            self.currency = "VND"
            self.payment_status = PaymentStatus.pending
            self.booked_at = datetime.now(timezone.utc)
            self.cancelled_at = None

    class FakeAdminRepo:
        def list_bookings(
            self,
            *,
            skip: int,
            limit: int,
            status=None,
            payment_status=None,
            booking_code=None,
            sort_by="booked_at",
            sort_order="desc",
        ):
            items = [FakeBooking(index) for index in range(2050)]
            return items[skip : skip + limit]

    export_service = AdminExportService(FakeAdminRepo())

    csv_bytes = export_service.export_bookings_csv()
    content = csv_bytes.decode("utf-8-sig")

    assert "EXPORT-0" in content
    assert "EXPORT-2049" in content

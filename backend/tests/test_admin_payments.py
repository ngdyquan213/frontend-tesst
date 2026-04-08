from decimal import Decimal

from app.core.security import get_password_hash
from app.models.enums import PaymentMethod, PaymentStatus, UserStatus
from app.models.payment import Payment
from app.models.role import Role, UserRole
from app.models.user import User


def create_admin_and_login(client, db_session):
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db_session.add(admin_role)
        db_session.flush()

    admin_user = User(
        email="admin-payments@example.com",
        username="admin_payments",
        full_name="Admin Payments",
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


def test_admin_payments_list_allows_null_booking_id(client, db_session):
    admin_user, token = create_admin_and_login(client, db_session)

    payment = Payment(
        booking_id=None,
        initiated_by=admin_user.id,
        payment_method=PaymentMethod.manual,
        status=PaymentStatus.pending,
        amount=Decimal("250000.00"),
        currency="VND",
        gateway_order_ref="ADMIN-PAYMENT-NO-BOOKING",
        gateway_transaction_ref=None,
        paid_at=None,
    )
    db_session.add(payment)
    db_session.commit()

    resp = client.get(
        "/api/v1/admin/payments",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    match = next(item for item in body["items"] if item["id"] == str(payment.id))
    assert match["booking_id"] is None
    assert match["payment_method"] == "manual"
    assert match["status"] == "pending"

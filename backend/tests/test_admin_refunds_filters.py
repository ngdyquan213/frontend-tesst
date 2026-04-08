from datetime import datetime, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.models.enums import PaymentMethod, PaymentStatus, RefundStatus, UserStatus
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
        email="admin-refund-filter@example.com",
        username="admin_refund_filter",
        full_name="Admin Refund Filter",
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


def seed_user(db_session):
    user = User(
        email="refund-filter-user@example.com",
        username="refund_filter_user",
        full_name="Refund Filter User",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()
    return user


def seed_payment_and_refund(
    db_session, *, user_id, order_ref: str, refund_status: RefundStatus, amount: str
):
    payment = Payment(
        booking_id=None,
        initiated_by=user_id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.refunded,
        amount=Decimal(amount),
        currency="VND",
        gateway_order_ref=order_ref,
        gateway_transaction_ref=f"TXN-{order_ref}",
        paid_at=datetime.now(timezone.utc),
    )
    db_session.add(payment)
    db_session.flush()

    refund = Refund(
        payment_id=payment.id,
        amount=Decimal(amount),
        currency="VND",
        status=refund_status,
        reason=f"Reason {order_ref}",
        processed_at=datetime.now(timezone.utc)
        if refund_status == RefundStatus.processed
        else None,
    )
    db_session.add(refund)
    db_session.commit()
    return payment, refund


def test_admin_refunds_filter_by_status(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_user(db_session)

    seed_payment_and_refund(
        db_session,
        user_id=user.id,
        order_ref="REF-PENDING-001",
        refund_status=RefundStatus.pending,
        amount="100000.00",
    )
    seed_payment_and_refund(
        db_session,
        user_id=user.id,
        order_ref="REF-PROCESSED-001",
        refund_status=RefundStatus.processed,
        amount="200000.00",
    )

    resp = client.get(
        "/api/v1/admin/refunds?status=pending",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()

    assert body["total"] >= 1
    assert all(item["status"] == "pending" for item in body["items"])


def test_admin_refunds_filter_by_payment_id(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_user(db_session)

    payment, refund = seed_payment_and_refund(
        db_session,
        user_id=user.id,
        order_ref="REF-PAYMENT-ID-001",
        refund_status=RefundStatus.pending,
        amount="300000.00",
    )

    resp = client.get(
        f"/api/v1/admin/refunds?payment_id={payment.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()

    assert body["total"] >= 1
    assert all(item["payment_id"] == str(payment.id) for item in body["items"])


def test_admin_refunds_sort_by_amount_asc(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_user(db_session)

    seed_payment_and_refund(
        db_session,
        user_id=user.id,
        order_ref="REF-AMOUNT-LOW",
        refund_status=RefundStatus.pending,
        amount="50000.00",
    )
    seed_payment_and_refund(
        db_session,
        user_id=user.id,
        order_ref="REF-AMOUNT-HIGH",
        refund_status=RefundStatus.pending,
        amount="250000.00",
    )

    resp = client.get(
        "/api/v1/admin/refunds?sort_by=amount&sort_order=asc",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()

    amounts = [Decimal(str(item["amount"])) for item in body["items"]]
    assert amounts == sorted(amounts)

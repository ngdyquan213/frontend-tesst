from app.core.security import get_password_hash
from app.models.coupon import Coupon
from app.models.enums import CouponType, UserStatus
from app.models.role import Role, UserRole
from app.models.user import User


def create_admin_and_login(client, db_session):
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db_session.add(admin_role)
        db_session.flush()

    admin_user = User(
        email="admin-test@example.com",
        username="admin_test",
        full_name="Admin Test",
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
        json={"email": "admin-test@example.com", "password": "Admin12345"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return admin_user, token


def create_normal_user_and_login(client, db_session):
    user = User(
        email="normal-test@example.com",
        username="normal_test",
        full_name="Normal Test",
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
        json={"email": "normal-test@example.com", "password": "Password123"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return user, token


def seed_coupon(db_session):
    coupon = Coupon(
        code="ADMIN10",
        name="Admin 10%",
        coupon_type=CouponType.percentage,
        discount_value=10,
        max_discount_amount=100000,
        min_booking_amount=500000,
        usage_limit_total=100,
        usage_limit_per_user=1,
        used_count=0,
        is_active=True,
    )
    db_session.add(coupon)
    db_session.commit()
    return coupon


def test_admin_can_update_coupon(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    coupon = seed_coupon(db_session)

    resp = client.put(
        f"/api/v1/admin/coupons/{coupon.id}",
        json={
            "name": "Admin 15%",
            "discount_value": 15,
            "usage_limit_total": 200,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Admin 15%"
    assert body["discount_value"] == "15"
    assert body["usage_limit_total"] == 200
    assert body["is_active"] is True


def test_admin_can_deactivate_coupon(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    coupon = seed_coupon(db_session)

    resp = client.post(
        f"/api/v1/admin/coupons/{coupon.id}/deactivate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == str(coupon.id)
    assert body["is_active"] is False

    db_session.expire_all()
    saved_coupon = db_session.query(Coupon).filter(Coupon.id == coupon.id).first()
    assert saved_coupon is not None
    assert saved_coupon.is_active is False


def test_non_admin_cannot_update_coupon(client, db_session):
    _, user_token = create_normal_user_and_login(client, db_session)
    coupon = seed_coupon(db_session)

    resp = client.put(
        f"/api/v1/admin/coupons/{coupon.id}",
        json={"name": "Should Fail"},
        headers={"Authorization": f"Bearer {user_token}"},
    )

    assert resp.status_code == 403
    assert resp.json()["detail"] == "Admin access required"


def test_non_admin_cannot_deactivate_coupon(client, db_session):
    _, user_token = create_normal_user_and_login(client, db_session)
    coupon = seed_coupon(db_session)

    resp = client.post(
        f"/api/v1/admin/coupons/{coupon.id}/deactivate",
        headers={"Authorization": f"Bearer {user_token}"},
    )

    assert resp.status_code == 403
    assert resp.json()["detail"] == "Admin access required"

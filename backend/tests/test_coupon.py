from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.models.coupon import Coupon
from app.models.enums import CouponType, UserStatus
from app.models.user import User


def create_user_and_login(client, db_session):
    user = User(
        email="coupon@example.com",
        username="coupon_user",
        full_name="Coupon User",
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
        json={"email": "coupon@example.com", "password": "Password123"},
    )
    return user, resp.json()["access_token"]


def test_apply_coupon_requires_existing_booking(client, db_session):
    _, token = create_user_and_login(client, db_session)

    coupon = Coupon(
        code="WELCOME10",
        name="Welcome 10",
        coupon_type=CouponType.percentage,
        discount_value=Decimal("10"),
        max_discount_amount=Decimal("100000"),
        min_booking_amount=Decimal("100000"),
        usage_limit_total=100,
        usage_limit_per_user=1,
        used_count=0,
        starts_at=datetime.now(timezone.utc) - timedelta(days=1),
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        is_active=True,
    )
    db_session.add(coupon)
    db_session.commit()

    resp = client.post(
        "/api/v1/coupons/apply",
        json={
            "booking_id": "00000000-0000-0000-0000-000000000000",
            "coupon_code": "WELCOME10",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400

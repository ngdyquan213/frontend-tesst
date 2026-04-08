from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from app.core.security import get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.coupon import Coupon
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    CouponApplicableProductType,
    CouponType,
    PaymentStatus,
    UserStatus,
)
from app.models.user import User

pytestmark = pytest.mark.postgres


def create_user(db_session_pg):
    user = User(
        email="pgcoupon@example.com",
        username="pgcoupon",
        full_name="PG Coupon",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session_pg.add(user)
    db_session_pg.commit()
    return user


def test_postgres_booking_item_json_and_coupon_flow(client_pg, db_session_pg):
    user = create_user(db_session_pg)

    login = client_pg.post(
        "/api/v1/auth/login",
        json={"email": "pgcoupon@example.com", "password": "Password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    booking = Booking(
        booking_code="PG-BOOKING-001",
        user_id=user.id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("1500000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("1500000.00"),
        currency="VND",
        payment_status=PaymentStatus.pending,
        booked_at=datetime.now(timezone.utc),
    )
    db_session_pg.add(booking)
    db_session_pg.flush()

    item = BookingItem(
        booking_id=booking.id,
        item_type=BookingItemType.tour,
        quantity=2,
        unit_price=Decimal("750000.00"),
        total_price=Decimal("1500000.00"),
        metadata_json={"adult_count": 2, "child_count": 0, "infant_count": 0},
    )
    db_session_pg.add(item)

    coupon = Coupon(
        code="PGTOUR",
        name="PG Tour Coupon",
        coupon_type=CouponType.fixed_amount,
        applicable_product_type=CouponApplicableProductType.tour,
        discount_value=Decimal("100000.00"),
        max_discount_amount=None,
        min_booking_amount=Decimal("500000.00"),
        usage_limit_total=100,
        usage_limit_per_user=1,
        used_count=0,
        starts_at=datetime.now(timezone.utc) - timedelta(days=1),
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        is_active=True,
    )
    db_session_pg.add(coupon)
    db_session_pg.commit()

    resp = client_pg.post(
        "/api/v1/coupons/apply",
        json={"booking_id": str(booking.id), "coupon_code": "PGTOUR"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["coupon_code"] == "PGTOUR"

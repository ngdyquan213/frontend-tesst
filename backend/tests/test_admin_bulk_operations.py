from datetime import datetime, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.models.coupon import Coupon
from app.models.enums import (
    CouponApplicableProductType,
    CouponType,
    PaymentMethod,
    PaymentStatus,
    RefundStatus,
    TourScheduleStatus,
    TourStatus,
    UserStatus,
)
from app.models.payment import Payment
from app.models.refund import Refund
from app.models.role import Role, UserRole
from app.models.tour import Tour, TourSchedule
from app.models.user import User


def create_admin_and_login(client, db_session):
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db_session.add(admin_role)
        db_session.flush()

    admin_user = User(
        email="admin-bulk@example.com",
        username="admin_bulk",
        full_name="Admin Bulk",
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
        email="normal-bulk@example.com",
        username="normal_bulk",
        full_name="Normal Bulk",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_bulk_deactivate_coupons(client, db_session):
    _, token = create_admin_and_login(client, db_session)

    c1 = Coupon(
        code="BULK001",
        name="Bulk 1",
        coupon_type=CouponType.fixed_amount,
        applicable_product_type=CouponApplicableProductType.flight,
        discount_value=Decimal("100000.00"),
        min_booking_amount=Decimal("0.00"),
        usage_limit_total=10,
        usage_limit_per_user=1,
        used_count=0,
        is_active=True,
    )
    c2 = Coupon(
        code="BULK002",
        name="Bulk 2",
        coupon_type=CouponType.fixed_amount,
        applicable_product_type=CouponApplicableProductType.hotel,
        discount_value=Decimal("100000.00"),
        min_booking_amount=Decimal("0.00"),
        usage_limit_total=10,
        usage_limit_per_user=1,
        used_count=0,
        is_active=True,
    )
    db_session.add_all([c1, c2])
    db_session.commit()

    resp = client.post(
        "/api/v1/admin/coupons/bulk-deactivate",
        json={"ids": [str(c1.id), str(c2.id)]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success_count"] == 2
    assert body["failed_count"] == 0

    db_session.expire_all()
    assert db_session.query(Coupon).filter(Coupon.id == c1.id).first().is_active is False
    assert db_session.query(Coupon).filter(Coupon.id == c2.id).first().is_active is False


def test_bulk_close_tour_schedules(client, db_session):
    _, token = create_admin_and_login(client, db_session)

    tour = Tour(
        code="TOUR-BULK-001",
        name="Bulk Tour",
        destination="Da Lat",
        description="Bulk Tour",
        duration_days=3,
        duration_nights=2,
        meeting_point="Center",
        tour_type="domestic",
        status=TourStatus.active,
    )
    db_session.add(tour)
    db_session.flush()

    s1 = TourSchedule(
        tour_id=tour.id,
        departure_date=datetime.now(timezone.utc),
        return_date=datetime.now(timezone.utc),
        capacity=10,
        available_slots=10,
        status=TourScheduleStatus.scheduled,
    )
    s2 = TourSchedule(
        tour_id=tour.id,
        departure_date=datetime.now(timezone.utc),
        return_date=datetime.now(timezone.utc),
        capacity=8,
        available_slots=8,
        status=TourScheduleStatus.scheduled,
    )
    db_session.add_all([s1, s2])
    db_session.commit()

    resp = client.post(
        "/api/v1/admin/tour-schedules/bulk-close",
        json={"ids": [str(s1.id), str(s2.id)]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success_count"] == 2
    assert body["failed_count"] == 0

    db_session.expire_all()
    schedule_1 = db_session.query(TourSchedule).filter(TourSchedule.id == s1.id).first()
    schedule_2 = db_session.query(TourSchedule).filter(TourSchedule.id == s2.id).first()
    assert schedule_1.status == TourScheduleStatus.closed
    assert schedule_2.status == TourScheduleStatus.closed


def test_bulk_update_refunds(client, db_session):
    _, token = create_admin_and_login(client, db_session)
    user = seed_normal_user(db_session)

    p1 = Payment(
        booking_id=None,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.refunded,
        amount=Decimal("100000.00"),
        currency="VND",
        gateway_order_ref="BULK-ORDER-1",
    )
    p2 = Payment(
        booking_id=None,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.refunded,
        amount=Decimal("200000.00"),
        currency="VND",
        gateway_order_ref="BULK-ORDER-2",
    )
    db_session.add_all([p1, p2])
    db_session.flush()

    r1 = Refund(
        payment_id=p1.id,
        amount=Decimal("100000.00"),
        currency="VND",
        status=RefundStatus.pending,
        reason="bulk",
    )
    r2 = Refund(
        payment_id=p2.id,
        amount=Decimal("200000.00"),
        currency="VND",
        status=RefundStatus.pending,
        reason="bulk",
    )
    db_session.add_all([r1, r2])
    db_session.commit()

    resp = client.post(
        "/api/v1/admin/refunds/bulk-update",
        json={
            "refund_ids": [str(r1.id), str(r2.id)],
            "status": "processed",
            "reason": "bulk approved",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success_count"] == 2
    assert body["failed_count"] == 0

    db_session.expire_all()
    refund_1 = db_session.query(Refund).filter(Refund.id == r1.id).first()
    refund_2 = db_session.query(Refund).filter(Refund.id == r2.id).first()
    assert refund_1.status == RefundStatus.processed
    assert refund_2.status == RefundStatus.processed

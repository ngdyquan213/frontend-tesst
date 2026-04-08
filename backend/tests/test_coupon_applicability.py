from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.coupon import Coupon
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    CouponApplicableProductType,
    CouponType,
    PaymentStatus,
    TourScheduleStatus,
    TourStatus,
    TravelerType,
    UserStatus,
)
from app.models.flight import Airline, Airport, Flight
from app.models.tour import Tour, TourPriceRule, TourSchedule
from app.models.user import User


def create_user_and_login(client, db_session):
    user = User(
        email="coupon-app@example.com",
        username="coupon_app",
        full_name="Coupon App User",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "coupon-app@example.com", "password": "Password123"},
    )
    return user, login.json()["access_token"]


def seed_flight_booking(db_session, user_id: str):
    airline = Airline(code="CA", name="Coupon Airline")
    dep = Airport(code="CAA", name="A", city="A", country="VN")
    arr = Airport(code="CAB", name="B", city="B", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="CA100",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1500000.00"),
        available_seats=5,
        status="scheduled",
    )
    db_session.add(flight)
    db_session.flush()

    booking = Booking(
        booking_code="BK-FLIGHT-COUPON",
        user_id=user_id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("1500000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("1500000.00"),
        currency="VND",
        payment_status=PaymentStatus.pending,
        booked_at=datetime.now(timezone.utc),
    )
    db_session.add(booking)
    db_session.flush()

    db_session.add(
        BookingItem(
            booking_id=booking.id,
            item_type=BookingItemType.flight,
            flight_id=flight.id,
            quantity=1,
            unit_price=Decimal("1500000.00"),
            total_price=Decimal("1500000.00"),
        )
    )
    db_session.commit()
    return booking


def seed_tour_booking(db_session, user_id: str):
    tour = Tour(
        code="COUPON-TOUR-001",
        name="Coupon Tour",
        destination="Da Nang",
        description="Tour for coupon testing",
        duration_days=3,
        duration_nights=2,
        meeting_point="Airport",
        tour_type="domestic",
        status=TourStatus.active,
    )
    db_session.add(tour)
    db_session.flush()

    schedule = TourSchedule(
        tour_id=tour.id,
        departure_date=datetime.now(timezone.utc).date() + timedelta(days=7),
        return_date=datetime.now(timezone.utc).date() + timedelta(days=9),
        capacity=10,
        available_slots=10,
        status=TourScheduleStatus.scheduled,
    )
    db_session.add(schedule)
    db_session.flush()

    db_session.add_all(
        [
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=TravelerType.adult,
                price=Decimal("3000000.00"),
                currency="VND",
            ),
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=TravelerType.child,
                price=Decimal("2000000.00"),
                currency="VND",
            ),
        ]
    )
    db_session.flush()

    booking = Booking(
        booking_code="BK-TOUR-COUPON",
        user_id=user_id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("3000000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("3000000.00"),
        currency="VND",
        payment_status=PaymentStatus.pending,
        booked_at=datetime.now(timezone.utc),
    )
    db_session.add(booking)
    db_session.flush()

    db_session.add(
        BookingItem(
            booking_id=booking.id,
            item_type=BookingItemType.tour,
            tour_schedule_id=schedule.id,
            quantity=1,
            unit_price=Decimal("3000000.00"),
            total_price=Decimal("3000000.00"),
        )
    )
    db_session.commit()
    return booking


def seed_coupon(db_session, code: str, product_type: CouponApplicableProductType):
    coupon = Coupon(
        code=code,
        name=f"{code} coupon",
        coupon_type=CouponType.fixed_amount,
        applicable_product_type=product_type,
        discount_value=Decimal("200000.00"),
        max_discount_amount=None,
        min_booking_amount=Decimal("500000.00"),
        usage_limit_total=100,
        usage_limit_per_user=1,
        used_count=0,
        starts_at=datetime.now(timezone.utc) - timedelta(days=1),
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        is_active=True,
    )
    db_session.add(coupon)
    db_session.commit()
    return coupon


def test_flight_coupon_applies_to_flight_booking(client, db_session):
    user, token = create_user_and_login(client, db_session)
    booking = seed_flight_booking(db_session, str(user.id))
    seed_coupon(db_session, "FLIGHT-OK", CouponApplicableProductType.flight)

    resp = client.post(
        "/api/v1/coupons/apply",
        json={"booking_id": str(booking.id), "coupon_code": "FLIGHT-OK"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    assert resp.json()["applicable_product_type"] == "flight"


def test_flight_coupon_rejected_for_tour_booking(client, db_session):
    user, token = create_user_and_login(client, db_session)
    booking = seed_tour_booking(db_session, str(user.id))
    seed_coupon(db_session, "FLIGHT-ONLY", CouponApplicableProductType.flight)

    resp = client.post(
        "/api/v1/coupons/apply",
        json={"booking_id": str(booking.id), "coupon_code": "FLIGHT-ONLY"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Coupon is not applicable to this booking type"

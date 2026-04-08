from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.booking import Booking, BookingItem, Traveler
from app.models.coupon import Coupon, CouponUsage
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    DocumentType,
    PaymentMethod,
    PaymentStatus,
    TravelerType,
    UserStatus,
)
from app.models.flight import Flight
from app.models.payment import Payment
from app.models.user import User
from scripts.create_admin import create_or_update_admin
from scripts.seed_coupons import seed_default_coupons
from scripts.seed_data import seed_catalog

DEMO_ANCHOR_DATETIME = datetime(2026, 4, 1, 8, 0, tzinfo=timezone.utc)
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin12345"
CUSTOMER_EMAIL = "qa.customer@example.com"
CUSTOMER_PASSWORD = "Traveler12345"
DEMO_BOOKING_CODE = "BK-DEMO-FLIGHT-001"


def create_or_update_user(
    db: Session,
    *,
    email: str,
    password: str,
    username: str,
    full_name: str,
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            password_hash=get_password_hash(password),
            status=UserStatus.active,
            email_verified=True,
            phone_verified=False,
            failed_login_count=0,
        )
        db.add(user)
        db.flush()
    else:
        user.username = username
        user.full_name = full_name
        user.password_hash = get_password_hash(password)
        user.status = UserStatus.active
        user.email_verified = True

    return user


def seed_demo_booking(
    db: Session,
    *,
    user: User,
    coupon: Coupon,
    flight: Flight,
) -> Booking:
    booking = db.query(Booking).filter(Booking.booking_code == DEMO_BOOKING_CODE).first()
    if booking:
        return booking

    total_base_amount = Decimal(flight.base_price)
    total_discount_amount = Decimal("185000.00")
    total_final_amount = total_base_amount - total_discount_amount

    booking = Booking(
        booking_code=DEMO_BOOKING_CODE,
        user_id=user.id,
        status=BookingStatus.confirmed,
        total_base_amount=total_base_amount,
        total_discount_amount=total_discount_amount,
        total_final_amount=total_final_amount,
        currency="VND",
        coupon_id=coupon.id,
        payment_status=PaymentStatus.paid,
        booked_at=DEMO_ANCHOR_DATETIME + timedelta(hours=1),
        notes="Deterministic demo booking for frontend and QA handoff.",
    )
    db.add(booking)
    db.flush()

    db.add(
        BookingItem(
            booking_id=booking.id,
            item_type=BookingItemType.flight,
            flight_id=flight.id,
            quantity=1,
            unit_price=total_base_amount,
            total_price=total_base_amount,
            metadata_json={
                "seed_profile": "demo",
                "anchor_datetime": DEMO_ANCHOR_DATETIME.isoformat(),
            },
        )
    )
    db.add(
        Traveler(
            booking_id=booking.id,
            full_name="QA Traveler",
            traveler_type=TravelerType.adult,
            date_of_birth=date(1993, 6, 15),
            passport_number="P1234567",
            nationality="Vietnam",
            document_type=DocumentType.passport,
        )
    )
    db.add(
        Payment(
            booking_id=booking.id,
            initiated_by=user.id,
            payment_method=PaymentMethod.vnpay,
            status=PaymentStatus.paid,
            amount=total_final_amount,
            currency="VND",
            gateway_order_ref="DEMO-ORDER-001",
            gateway_transaction_ref="DEMO-TXN-001",
            idempotency_key="demo-flight-booking-001",
            paid_at=DEMO_ANCHOR_DATETIME + timedelta(hours=1, minutes=5),
        )
    )
    db.add(
        CouponUsage(
            coupon_id=coupon.id,
            user_id=user.id,
            booking_id=booking.id,
            used_at=DEMO_ANCHOR_DATETIME + timedelta(hours=1),
        )
    )
    coupon.used_count = max(coupon.used_count or 0, 1)
    flight.available_seats = max(int(flight.available_seats) - 1, 0)
    db.flush()
    return booking


def main() -> None:
    db = SessionLocal()
    try:
        with db.begin():
            seed_catalog(db, anchor_datetime=DEMO_ANCHOR_DATETIME)
            seed_default_coupons(db, anchor_datetime=DEMO_ANCHOR_DATETIME)

            create_or_update_admin(
                db,
                email=ADMIN_EMAIL,
                password=ADMIN_PASSWORD,
                username="admin",
                full_name="System Admin",
            )
            customer = create_or_update_user(
                db,
                email=CUSTOMER_EMAIL,
                password=CUSTOMER_PASSWORD,
                username="qa_customer",
                full_name="QA Customer",
            )

            welcome_coupon = db.query(Coupon).filter(Coupon.code == "WELCOME10").one()
            seed_flight = db.query(Flight).filter(Flight.flight_number == "VN220").one()
            booking = seed_demo_booking(
                db,
                user=customer,
                coupon=welcome_coupon,
                flight=seed_flight,
            )

        print("Demo seed completed successfully.")
        print(f"anchor_datetime={DEMO_ANCHOR_DATETIME.isoformat()}")
        print(f"admin_email={ADMIN_EMAIL}")
        print(f"admin_password={ADMIN_PASSWORD}")
        print(f"customer_email={CUSTOMER_EMAIL}")
        print(f"customer_password={CUSTOMER_PASSWORD}")
        print(f"booking_code={booking.booking_code}")
        print("coupon_codes=WELCOME10,FLIGHT200K,HOTEL15,TOUR300K")
    finally:
        db.close()


if __name__ == "__main__":
    main()

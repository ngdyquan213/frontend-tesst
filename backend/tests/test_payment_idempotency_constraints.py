from datetime import datetime, timezone
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentMethod, PaymentStatus, UserStatus
from app.models.payment import Payment
from app.models.user import User


def test_payment_unique_constraint_blocks_duplicate_booking_and_idempotency_key(db_session):
    user = User(
        email="payment-unique@example.com",
        username="payment_unique",
        full_name="Payment Unique",
        password_hash="hashed",
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.flush()

    booking = Booking(
        booking_code="BK-UNIQUE-PAYMENT-001",
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
    db_session.flush()

    first_payment = Payment(
        booking_id=booking.id,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.pending,
        amount=Decimal("1000000.00"),
        currency="VND",
        gateway_order_ref="PAY-BK-UNIQUE-PAYMENT-001-idem-001",
        idempotency_key="idem-001",
    )
    db_session.add(first_payment)
    db_session.flush()

    duplicate_payment = Payment(
        booking_id=booking.id,
        initiated_by=user.id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.pending,
        amount=Decimal("1000000.00"),
        currency="VND",
        gateway_order_ref="PAY-BK-UNIQUE-PAYMENT-001-idem-001-duplicate",
        idempotency_key="idem-001",
    )
    db_session.add(duplicate_payment)

    with pytest.raises(IntegrityError):
        db_session.flush()

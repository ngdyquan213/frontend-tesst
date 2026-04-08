from datetime import datetime, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentMethod, PaymentStatus, RefundStatus, UserStatus
from app.models.payment import Payment
from app.models.refund import Refund
from app.models.user import User
from app.repositories.admin_repository import AdminRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.user_repository import UserRepository
from app.services.admin_service import AdminService


def create_user_and_login(client, db_session, email: str, username: str):
    user = User(
        email=email,
        username=username,
        full_name=username,
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123"},
    )
    assert response.status_code == 200
    return user, response.json()["access_token"]


def seed_paid_booking(db_session, user_id: str) -> tuple[Booking, Payment]:
    booking = Booking(
        booking_code=f"BK-REFUND-{str(user_id).replace('-', '')[:8].upper()}",
        user_id=user_id,
        status=BookingStatus.confirmed,
        total_base_amount=Decimal("3200000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("3200000.00"),
        currency="VND",
        payment_status=PaymentStatus.paid,
        booked_at=datetime.now(timezone.utc),
    )
    db_session.add(booking)
    db_session.flush()

    payment = Payment(
        booking_id=booking.id,
        initiated_by=booking.user_id,
        payment_method=PaymentMethod.manual,
        status=PaymentStatus.paid,
        amount=Decimal("3200000.00"),
        currency="VND",
        gateway_order_ref=f"PAY-{booking.booking_code}",
        gateway_transaction_ref="MANUAL-SETTLED",
        idempotency_key=f"refund-{booking.booking_code.lower()}",
        paid_at=datetime.now(timezone.utc),
    )
    db_session.add(payment)
    db_session.commit()
    db_session.refresh(booking)
    db_session.refresh(payment)
    return booking, payment


def test_create_refund_request_for_paid_booking(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        "refund-user@example.com",
        "refund_user",
    )
    booking, payment = seed_paid_booking(db_session, str(user.id))

    response = client.post(
        "/api/v1/refunds",
        json={
            "booking_id": str(booking.id),
            "reason": "The operator changed the itinerary after payment was completed.",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["booking_id"] == str(booking.id)
    assert body["payment_id"] == str(payment.id)
    assert body["status"] == RefundStatus.pending.value
    assert body["amount"] == "3200000.00"


def test_create_refund_request_rejects_duplicate_open_request(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        "refund-duplicate@example.com",
        "refund_duplicate",
    )
    booking, payment = seed_paid_booking(db_session, str(user.id))
    existing_refund = Refund(
        payment_id=payment.id,
        amount=Decimal("3200000.00"),
        currency="VND",
        status=RefundStatus.pending,
        reason="Initial request waiting for review.",
    )
    db_session.add(existing_refund)
    db_session.commit()

    response = client.post(
        "/api/v1/refunds",
        json={
            "booking_id": str(booking.id),
            "reason": "Submitting the same request again should be blocked.",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 409
    assert "already exists" in response.json()["message"].lower()


def test_admin_processing_refund_updates_payment_and_booking_status(db_session):
    user = User(
        email="refund-admin-sync@example.com",
        username="refund_admin_sync",
        full_name="Refund Admin Sync",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    booking, payment = seed_paid_booking(db_session, str(user.id))
    refund = Refund(
        payment_id=payment.id,
        amount=Decimal("3200000.00"),
        currency="VND",
        status=RefundStatus.pending,
        reason="Traveler requested a refund.",
    )
    db_session.add(refund)
    db_session.commit()

    service = AdminService(
        db=db_session,
        user_repo=UserRepository(db_session),
        admin_repo=AdminRepository(db_session),
        payment_repo=PaymentRepository(db_session),
    )

    updated_refund = service.update_refund_status(
        refund_id=str(refund.id),
        new_status=RefundStatus.processed,
        reason="Approved after manual review.",
    )
    db_session.commit()
    db_session.refresh(updated_refund)
    db_session.refresh(payment)
    db_session.refresh(booking)

    assert updated_refund.status == RefundStatus.processed
    assert updated_refund.processed_at is not None
    assert payment.status == PaymentStatus.refunded
    assert booking.payment_status == PaymentStatus.refunded

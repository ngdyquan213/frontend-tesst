from app.core.security import get_password_hash
from app.models.booking import Booking
from app.models.document import UploadedDocument
from app.models.enums import (
    BookingStatus,
    DocumentType,
    PaymentMethod,
    PaymentStatus,
    RefundStatus,
    UserStatus,
)
from app.models.payment import Payment
from app.models.refund import Refund
from app.models.user import User


def create_user(
    db_session,
    *,
    email: str = "notify@example.com",
    password: str = "Password123",
) -> User:
    user = User(
        email=email,
        username=email.split("@")[0],
        full_name="Notify User",
        password_hash=get_password_hash(password),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_login_sets_http_only_cookies_and_supports_cookie_authenticated_profile(client, db_session):
    user = create_user(db_session, email="cookie-auth@example.com")

    response = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "Password123"},
    )

    assert response.status_code == 200
    set_cookie_header = response.headers.get("set-cookie", "")
    assert "travelbook_access_token=" in set_cookie_header
    assert "HttpOnly" in set_cookie_header

    me_response = client.get("/api/v1/users/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == user.email


def test_notifications_are_server_backed_and_read_state_persists_across_requests(
    client,
    db_session,
):
    user = create_user(db_session)
    booking = Booking(
        booking_code="BK-NOTIFY-001",
        user_id=user.id,
        status=BookingStatus.confirmed,
        total_base_amount=100,
        total_discount_amount=0,
        total_final_amount=100,
        currency="USD",
        payment_status=PaymentStatus.paid,
    )
    db_session.add(booking)
    db_session.flush()

    document = UploadedDocument(
        user_id=user.id,
        booking_id=booking.id,
        document_type=DocumentType.passport,
        original_filename="passport.pdf",
        stored_filename="passport.pdf",
        mime_type="application/pdf",
        file_size=1024,
        storage_bucket="local",
        storage_key="uploads/passport.pdf",
        status="approved",
    )
    payment = Payment(
        booking_id=booking.id,
        initiated_by=user.id,
        payment_method=PaymentMethod.manual,
        status=PaymentStatus.paid,
        amount=100,
        currency="USD",
        idempotency_key="notify-payment-1",
    )
    db_session.add_all([document, payment])
    db_session.flush()

    refund = Refund(
        payment_id=payment.id,
        amount=25,
        currency="USD",
        status=RefundStatus.pending,
        reason="Partial refund issued",
    )
    db_session.add(refund)
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "Password123"},
    )
    assert login_response.status_code == 200

    notifications_response = client.get("/api/v1/notifications")
    assert notifications_response.status_code == 200
    items = notifications_response.json()["items"]
    assert len(items) >= 3
    unread_booking = next((item for item in items if item["id"] == f"booking-{booking.id}"), None)
    assert unread_booking is not None
    assert unread_booking["read"] is False

    mark_response = client.post(f"/api/v1/notifications/booking-{booking.id}/read")
    assert mark_response.status_code == 200
    assert mark_response.json()["read"] is True

    refreshed_response = client.get("/api/v1/notifications")
    assert refreshed_response.status_code == 200
    refreshed_items = refreshed_response.json()["items"]
    refreshed_booking = next(
        (item for item in refreshed_items if item["id"] == f"booking-{booking.id}"),
        None,
    )
    assert refreshed_booking is not None
    assert refreshed_booking["read"] is True

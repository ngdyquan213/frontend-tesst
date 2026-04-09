from datetime import datetime, timezone
from decimal import Decimal

from app.core.constants import PERM_ADMIN_BOOKINGS_READ, PERM_ADMIN_SUPPORT_READ
from app.core.security import get_password_hash
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentStatus, UserStatus
from app.models.role import Permission, Role, RolePermission, UserRole
from app.models.user import User


def create_user_and_login(
    client,
    db_session,
    email: str,
    username: str,
    *,
    email_verified: bool = True,
):
    user = User(
        email=email,
        username=username,
        full_name=username,
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=email_verified,
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


def seed_booking_for_user(
    db_session,
    user_id: str,
    booking_code: str = "BK-SUPPORT-001",
) -> Booking:
    booking = Booking(
        booking_code=booking_code,
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
    db_session.commit()
    db_session.refresh(booking)
    return booking


def test_create_support_ticket_and_list_history(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        "support-user@example.com",
        "support_user",
    )
    booking = seed_booking_for_user(db_session, str(user.id))

    create_response = client.post(
        "/api/v1/support/tickets",
        json={
            "full_name": "Traveler Support",
            "email": "support-user@example.com",
            "topic_id": "bookings",
            "subject": "Need help confirming transfer timing",
            "message": (
                "Please confirm the marina transfer timing because the departure "
                "notes changed this morning."
            ),
            "booking_reference": booking.booking_code,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert create_response.status_code == 201
    created_ticket = create_response.json()
    assert created_ticket["reference"].startswith("SR-")
    assert created_ticket["booking_reference"] == booking.booking_code
    assert created_ticket["status"] == "open"

    list_response = client.get(
        "/api/v1/support/tickets",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert list_response.status_code == 200
    body = list_response.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == created_ticket["id"]


def test_create_support_ticket_uses_authenticated_account_identity(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        "support-identity@example.com",
        "support_identity",
    )
    user.full_name = "Verified Traveler"
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/v1/support/tickets",
        json={
            "full_name": "Imposter Name",
            "email": "spoofed@example.com",
            "topic_id": "payments",
            "subject": "Need help with payment status",
            "message": (
                "Please confirm the payment state because the gateway callback "
                "looked delayed."
            ),
            "booking_reference": None,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["requester_name"] == "Verified Traveler"
    assert body["requester_email"] == "support-identity@example.com"


def test_create_support_ticket_requires_verified_email(client, db_session):
    _user, token = create_user_and_login(
        client,
        db_session,
        "support-unverified@example.com",
        "support_unverified",
        email_verified=False,
    )

    response = client.post(
        "/api/v1/support/tickets",
        json={
            "full_name": "Traveler Unverified",
            "email": "support-unverified@example.com",
            "topic_id": "payments",
            "subject": "Need help with account-linked payment follow-up",
            "message": (
                "Please help with this payment follow-up because I still need the "
                "request attached to the right account."
            ),
            "booking_reference": None,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
    assert "verify your email" in response.json()["message"].lower()


def test_support_ticket_detail_is_scoped_to_owner(client, db_session):
    user_one, token_one = create_user_and_login(
        client,
        db_session,
        "support-owner@example.com",
        "support_owner",
    )
    booking = seed_booking_for_user(db_session, str(user_one.id), "BK-SUPPORT-OWNER")

    create_response = client.post(
        "/api/v1/support/tickets",
        json={
            "full_name": "Owner",
            "email": "support-owner@example.com",
            "topic_id": "payments",
            "subject": "Invoice copy request",
            "message": (
                "Please send the invoice copy because accounting needs it before "
                "the payment window closes."
            ),
            "booking_reference": booking.booking_code,
        },
        headers={"Authorization": f"Bearer {token_one}"},
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    _user_two, token_two = create_user_and_login(
        client,
        db_session,
        "support-other@example.com",
        "support_other",
    )

    other_response = client.get(
        f"/api/v1/support/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {token_two}"},
    )

    assert other_response.status_code == 404


def test_create_support_ticket_rejects_unknown_booking_reference(client, db_session):
    _user, token = create_user_and_login(
        client,
        db_session,
        "support-invalid@example.com",
        "support_invalid",
    )

    response = client.post(
        "/api/v1/support/tickets",
        json={
            "full_name": "Traveler",
            "email": "support-invalid@example.com",
            "topic_id": "refunds",
            "subject": "Refund timeline question",
            "message": (
                "I need help understanding the refund timeline after the itinerary "
                "change announced today."
            ),
            "booking_reference": "BK-NOT-MINE",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "booking reference" in response.json()["message"].lower()


def test_create_support_ticket_rejects_invalid_email_payload(client, db_session):
    _user, token = create_user_and_login(
        client,
        db_session,
        "support-schema@example.com",
        "support_schema",
    )

    response = client.post(
        "/api/v1/support/tickets",
        json={
            "full_name": "Traveler Schema",
            "email": "invalid-email",
            "topic_id": "bookings",
            "subject": "Need help validating contact data",
            "message": (
                "Please validate this support request payload before it reaches the "
                "service layer so malformed contact data is rejected early."
            ),
            "booking_reference": None,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422


def test_traveler_and_admin_can_reply_to_support_ticket(client, db_session):
    traveler, traveler_token = create_user_and_login(
        client,
        db_session,
        "support-thread-traveler@example.com",
        "support_thread_traveler",
    )
    booking = seed_booking_for_user(db_session, str(traveler.id), "BK-SUPPORT-THREAD")

    created = client.post(
        "/api/v1/support/tickets",
        json={
            "full_name": "Traveler Thread",
            "email": "support-thread-traveler@example.com",
            "topic_id": "trip-support",
            "subject": "Transfer timing changed again",
            "message": (
                "Please confirm the latest transfer timing because the itinerary "
                "changed twice already."
            ),
            "booking_reference": booking.booking_code,
        },
        headers={"Authorization": f"Bearer {traveler_token}"},
    )
    assert created.status_code == 201
    ticket_id = created.json()["id"]

    traveler_reply = client.post(
        f"/api/v1/support/tickets/{ticket_id}/replies",
        json={"message": "Adding the updated flight arrival time for reference."},
        headers={"Authorization": f"Bearer {traveler_token}"},
    )
    assert traveler_reply.status_code == 200
    assert len(traveler_reply.json()["replies"]) == 1
    assert traveler_reply.json()["replies"][0]["author_role"] == "traveler"

    admin, admin_token = create_user_and_login(
        client,
        db_session,
        "support-thread-admin@example.com",
        "support_thread_admin",
    )
    admin.full_name = "Support Admin"
    db_session.add(admin)
    db_session.commit()

    admin_reply = client.post(
        f"/api/v1/support/admin/tickets/{ticket_id}/replies",
        json={
            "message": (
                "Operations confirmed the new transfer window and updated the "
                "handoff notes."
            ),
            "status": "waiting_for_traveler",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert admin_reply.status_code == 403


def test_admin_support_endpoints_work_with_admin_role(client, db_session):
    traveler, traveler_token = create_user_and_login(
        client,
        db_session,
        "support-admin-view-traveler@example.com",
        "support_admin_view_traveler",
    )
    booking = seed_booking_for_user(db_session, str(traveler.id), "BK-SUPPORT-ADMIN")

    created = client.post(
        "/api/v1/support/tickets",
        json={
            "full_name": "Traveler Admin View",
            "email": "support-admin-view-traveler@example.com",
            "topic_id": "bookings",
            "subject": "Need booking operations follow-up",
            "message": (
                "Please confirm if the operations team updated the arrival "
                "coordination notes for this booking."
            ),
            "booking_reference": booking.booking_code,
        },
        headers={"Authorization": f"Bearer {traveler_token}"},
    )
    assert created.status_code == 201
    ticket_id = created.json()["id"]

    admin, admin_token = create_user_and_login(
        client,
        db_session,
        "support-admin-view@example.com",
        "support_admin_view",
    )

    role = db_session.query(Role).filter(Role.name == "admin").first()
    if not role:
        role = Role(name="admin", description="Admin")
        db_session.add(role)
        db_session.flush()
    db_session.add(UserRole(user_id=admin.id, role_id=role.id))
    db_session.commit()

    list_response = client.get(
        "/api/v1/support/admin/tickets",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["total"] >= 1

    reply_response = client.post(
        f"/api/v1/support/admin/tickets/{ticket_id}/replies",
        json={
            "message": (
                "We have updated the handoff note and are waiting on your "
                "confirmation."
            ),
            "status": "waiting_for_traveler",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reply_response.status_code == 200
    assert reply_response.json()["status"] == "waiting_for_traveler"
    assert reply_response.json()["replies"][-1]["author_role"] == "support"

    update_response = client.put(
        f"/api/v1/support/admin/tickets/{ticket_id}",
        json={"status": "resolved"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "resolved"


def test_support_admin_endpoints_require_support_permission_when_permissions_exist(
    client,
    db_session,
):
    traveler, traveler_token = create_user_and_login(
        client,
        db_session,
        "support-perm-traveler@example.com",
        "support_perm_traveler",
    )
    booking = seed_booking_for_user(db_session, str(traveler.id), "BK-SUPPORT-PERM")

    created = client.post(
        "/api/v1/support/tickets",
        json={
            "full_name": "Traveler Permission",
            "email": "support-perm-traveler@example.com",
            "topic_id": "bookings",
            "subject": "Need support permission review",
            "message": (
                "Please confirm who can view this support request in the admin "
                "workspace today."
            ),
            "booking_reference": booking.booking_code,
        },
        headers={"Authorization": f"Bearer {traveler_token}"},
    )
    assert created.status_code == 201

    permission = (
        db_session.query(Permission)
        .filter(Permission.name == PERM_ADMIN_BOOKINGS_READ)
        .one_or_none()
    )
    if permission is None:
        permission = Permission(
            name=PERM_ADMIN_BOOKINGS_READ,
            description="Can read admin bookings",
        )

    role = Role(name="support_booking_reader", description="Limited support booking reader")
    db_session.add(role)
    if permission.id is None:
        db_session.add(permission)
    db_session.flush()
    db_session.add(RolePermission(role_id=role.id, permission_id=permission.id))

    admin_like_user, admin_like_token = create_user_and_login(
        client,
        db_session,
        "support-perm-admin@example.com",
        "support_perm_admin",
    )
    db_session.add(UserRole(user_id=admin_like_user.id, role_id=role.id))
    db_session.commit()

    response = client.get(
        "/api/v1/support/admin/tickets",
        headers={"Authorization": f"Bearer {admin_like_token}"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == f"Missing permission: {PERM_ADMIN_SUPPORT_READ}"

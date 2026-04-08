from app.core.constants import PERM_ADMIN_BOOKINGS_READ, PERM_ADMIN_USERS_READ
from app.core.security import get_password_hash
from app.models.enums import UserStatus
from app.models.role import Permission, Role, RolePermission, UserRole
from app.models.user import User


def create_user_and_login(
    client,
    db_session,
    *,
    email: str,
    username: str,
    password: str,
) -> tuple[User, str]:
    user = User(
        email=email,
        username=username,
        full_name=username.title(),
        password_hash=get_password_hash(password),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200

    return user, login.json()["access_token"]


def test_non_admin_cannot_access_admin_users(client, db_session):
    _, token = create_user_and_login(
        client,
        db_session,
        email="plain@example.com",
        username="plain",
        password="Password123",
    )

    resp = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Admin access required"


def test_user_with_specific_permission_can_access_admin_users(client, db_session):
    permission = (
        db_session.query(Permission).filter(Permission.name == PERM_ADMIN_USERS_READ).one_or_none()
    )
    if permission is None:
        permission = Permission(
            name=PERM_ADMIN_USERS_READ,
            description="Can read admin users",
        )
    role = Role(name="support_agent", description="Support role")
    db_session.add(role)
    if permission.id is None:
        db_session.add(permission)
    db_session.flush()
    db_session.add(RolePermission(role_id=role.id, permission_id=permission.id))

    user, token = create_user_and_login(
        client,
        db_session,
        email="support@example.com",
        username="support",
        password="Password123",
    )
    db_session.add(UserRole(user_id=user.id, role_id=role.id))
    db_session.commit()

    resp = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200


def test_user_with_other_admin_permission_cannot_access_admin_users(client, db_session):
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
    role = Role(name="booking_auditor", description="Booking audit role")
    db_session.add(role)
    if permission.id is None:
        db_session.add(permission)
    db_session.flush()
    db_session.add(RolePermission(role_id=role.id, permission_id=permission.id))

    user, token = create_user_and_login(
        client,
        db_session,
        email="auditor@example.com",
        username="auditor",
        password="Password123",
    )
    db_session.add(UserRole(user_id=user.id, role_id=role.id))
    db_session.commit()

    resp = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 403
    assert resp.json()["detail"] == f"Missing permission: {PERM_ADMIN_USERS_READ}"

from app.core.constants import (
    PERM_ADMIN_BOOKINGS_READ,
    PERM_ADMIN_DOCUMENTS_READ,
    PERM_ADMIN_DOCUMENTS_WRITE,
    PERM_ADMIN_USERS_READ,
)
from app.core.security import get_password_hash
from app.models.document import UploadedDocument
from app.models.enums import DocumentType, UserStatus
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


def test_user_with_document_read_permission_can_access_admin_documents(client, db_session):
    permission = (
        db_session.query(Permission)
        .filter(Permission.name == PERM_ADMIN_DOCUMENTS_READ)
        .one_or_none()
    )
    if permission is None:
        permission = Permission(
            name=PERM_ADMIN_DOCUMENTS_READ,
            description="Can read admin documents",
        )
    role = Role(name="document_reviewer_read", description="Document review read role")
    db_session.add(role)
    if permission.id is None:
        db_session.add(permission)
    db_session.flush()
    db_session.add(RolePermission(role_id=role.id, permission_id=permission.id))

    user, token = create_user_and_login(
        client,
        db_session,
        email="document-reader@example.com",
        username="document_reader",
        password="Password123",
    )
    db_session.add(UserRole(user_id=user.id, role_id=role.id))
    db_session.commit()

    resp = client.get(
        "/api/v1/admin/documents",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200


def test_user_without_document_write_permission_cannot_review_admin_documents(client, db_session):
    read_permission = (
        db_session.query(Permission)
        .filter(Permission.name == PERM_ADMIN_DOCUMENTS_READ)
        .one_or_none()
    )
    if read_permission is None:
        read_permission = Permission(
            name=PERM_ADMIN_DOCUMENTS_READ,
            description="Can read admin documents",
        )

    role = Role(name="document_reviewer_limited", description="Limited document review role")
    db_session.add(role)
    if read_permission.id is None:
        db_session.add(read_permission)
    db_session.flush()
    db_session.add(RolePermission(role_id=role.id, permission_id=read_permission.id))

    user, token = create_user_and_login(
        client,
        db_session,
        email="document-limited@example.com",
        username="document_limited",
        password="Password123",
    )
    db_session.add(UserRole(user_id=user.id, role_id=role.id))

    owner, _owner_token = create_user_and_login(
        client,
        db_session,
        email="document-owner@example.com",
        username="document_owner",
        password="Password123",
    )
    document = UploadedDocument(
        user_id=owner.id,
        document_type=DocumentType.passport,
        original_filename="passport.pdf",
        stored_filename="passport-stored.pdf",
        mime_type="application/pdf",
        file_size=1024,
        storage_bucket="local",
        storage_key="uploads/passport-stored.pdf",
        is_private=True,
    )
    db_session.add(document)
    db_session.commit()

    resp = client.post(
        f"/api/v1/admin/documents/{document.id}/review",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 403
    assert resp.json()["detail"] == f"Missing permission: {PERM_ADMIN_DOCUMENTS_WRITE}"

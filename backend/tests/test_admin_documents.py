from app.core.security import get_password_hash
from app.models.document import UploadedDocument
from app.models.enums import DocumentType, UserStatus
from app.models.role import Role, UserRole
from app.models.user import User


def create_admin_and_login(client, db_session):
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db_session.add(admin_role)
        db_session.flush()

    admin_user = User(
        email="admin-docs@example.com",
        username="admin_docs",
        full_name="Admin Docs",
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

    response = client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "Admin12345"},
    )
    assert response.status_code == 200
    return admin_user, response.json()["access_token"]


def create_traveler(db_session):
    traveler = User(
        email="traveler-docs@example.com",
        username="traveler_docs",
        full_name="Traveler Docs",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(traveler)
    db_session.commit()
    return traveler


def seed_document(db_session, *, user_id: str) -> UploadedDocument:
    document = UploadedDocument(
        user_id=user_id,
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
    return document


def test_admin_can_list_documents_queue(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    traveler = create_traveler(db_session)
    seed_document(db_session, user_id=traveler.id)

    response = client.get(
        "/api/v1/admin/documents",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["status"] == "pending"


def test_admin_can_review_document(client, db_session):
    admin_user, admin_token = create_admin_and_login(client, db_session)
    traveler = create_traveler(db_session)
    document = seed_document(db_session, user_id=traveler.id)

    response = client.post(
        f"/api/v1/admin/documents/{document.id}/review",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "approved"

    db_session.expire_all()
    saved_document = (
        db_session.query(UploadedDocument)
        .filter(UploadedDocument.id == document.id)
        .first()
    )
    assert saved_document is not None
    assert saved_document.status == "approved"
    assert saved_document.reviewed_by_user_id == admin_user.id
    assert saved_document.reviewed_at is not None

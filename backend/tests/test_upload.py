from io import BytesIO

from app.core.security import get_password_hash
from app.models.enums import UserStatus
from app.models.user import User


def create_user_and_token(client, db_session):
    user = User(
        email="upload@example.com",
        username="upload_user",
        full_name="Upload User",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "upload@example.com", "password": "Password123"},
    )
    return user, resp.json()["access_token"]


def test_upload_document_success(client, db_session, sample_pdf_bytes):
    _, token = create_user_and_token(client, db_session)

    file_content = BytesIO(sample_pdf_bytes)
    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("passport.pdf", file_content, "application/pdf")},
        data={"document_type": "passport"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["document_type"] == "passport"
    assert body["file_size"] == len(sample_pdf_bytes)
    assert "storage_key" not in body
    assert "stored_filename" not in body

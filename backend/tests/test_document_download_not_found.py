from app.core.security import get_password_hash
from app.models.enums import UserStatus
from app.models.user import User


def test_download_missing_document_returns_404(client, db_session):
    user = User(
        email="doc404@example.com",
        username="doc404",
        full_name="Doc 404",
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
        json={"email": "doc404@example.com", "password": "Password123"},
    )
    token = login.json()["access_token"]

    resp = client.get(
        "/api/v1/uploads/documents/00000000-0000-0000-0000-000000000000/download",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Document not found"

from app.core.security import get_password_hash
from app.models.enums import UserStatus
from app.models.user import PasswordResetToken, RefreshToken, User


def create_user(
    db_session,
    *,
    email: str = "account@example.com",
    password: str = "Password123",
) -> User:
    user = User(
        email=email,
        username=email.split("@")[0],
        full_name="Account User",
        password_hash=get_password_hash(password),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()
    return user


def login(client, *, email: str, password: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()


def test_user_can_update_profile(client, db_session):
    user = create_user(db_session)
    session = login(client, email=user.email, password="Password123")

    response = client.put(
        "/api/v1/users/me",
        json={"full_name": "Updated Account User"},
        headers={"Authorization": f"Bearer {session['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Account User"

    db_session.expire_all()
    saved_user = db_session.query(User).filter(User.id == user.id).first()
    assert saved_user is not None
    assert saved_user.full_name == "Updated Account User"


def test_user_can_change_password_and_revokes_refresh_tokens(client, db_session):
    user = create_user(db_session, email="password-change@example.com")
    session = login(client, email=user.email, password="Password123")

    response = client.post(
        "/api/v1/users/me/change-password",
        json={
            "current_password": "Password123",
            "new_password": "EvenBetterPass123",
        },
        headers={"Authorization": f"Bearer {session['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Password changed successfully"

    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "Password123"},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "EvenBetterPass123"},
    )
    assert new_login.status_code == 200

    db_session.expire_all()
    refresh_tokens = db_session.query(RefreshToken).filter(RefreshToken.user_id == user.id).all()
    assert refresh_tokens
    assert any(token.revoked_at is not None for token in refresh_tokens)

    me_response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {session['access_token']}"},
    )
    assert me_response.status_code == 401


def test_forgot_password_creates_reset_token_and_keeps_generic_response(
    client,
    db_session,
    monkeypatch,
):
    user = create_user(db_session, email="forgot@example.com")
    monkeypatch.setattr(
        "app.services.auth_service.create_password_reset_token_value",
        lambda: "reset-token-1234567890",
    )

    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": user.email},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "If the account exists, reset instructions have been sent"

    tokens = (
        db_session.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user.id)
        .all()
    )
    assert len(tokens) == 1
    assert tokens[0].used_at is None

    unknown_response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "missing@example.com"},
    )
    assert unknown_response.status_code == 200
    assert unknown_response.json()["message"] == response.json()["message"]


def test_reset_password_marks_token_used_and_allows_new_login(client, db_session, monkeypatch):
    user = create_user(db_session, email="reset@example.com")
    monkeypatch.setattr(
        "app.services.auth_service.create_password_reset_token_value",
        lambda: "reset-token-abcdef123456",
    )

    pre_reset_session = login(client, email=user.email, password="Password123")
    assert pre_reset_session["refresh_token"]

    forgot_response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": user.email},
    )
    assert forgot_response.status_code == 200

    reset_response = client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": "reset-token-abcdef123456",
            "password": "ResetPass12345",
        },
    )

    assert reset_response.status_code == 200
    assert reset_response.json()["message"] == "Password reset successfully"

    db_session.expire_all()
    token_row = (
        db_session.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user.id)
        .order_by(PasswordResetToken.created_at.desc())
        .first()
    )
    assert token_row is not None
    assert token_row.used_at is not None

    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "Password123"},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "ResetPass12345"},
    )
    assert new_login.status_code == 200

    me_response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {pre_reset_session['access_token']}"},
    )
    assert me_response.status_code == 401

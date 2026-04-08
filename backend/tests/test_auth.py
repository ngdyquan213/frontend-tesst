from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from app.core.security import get_password_hash
from app.models.enums import UserStatus
from app.models.user import LoginAttempt, RefreshToken, User
from app.services.auth_service import AuthService


def test_register_and_login(client):
    register_payload = {
        "email": "user1@example.com",
        "username": "user1",
        "full_name": "User One",
        "password": "Password123",
    }

    resp = client.post("/api/v1/auth/register", json=register_payload)
    print("REGISTER STATUS:", resp.status_code)
    print("REGISTER BODY:", resp.text)
    assert resp.status_code == 201

    body = resp.json()
    assert body["email"] == "user1@example.com"

    login_payload = {
        "email": "user1@example.com",
        "password": "Password123",
    }
    resp = client.post("/api/v1/auth/login", json=login_payload)
    print("LOGIN STATUS:", resp.status_code)
    print("LOGIN BODY:", resp.text)
    assert resp.status_code == 200

    token_body = resp.json()
    assert "access_token" in token_body


def test_failed_login_increments_counter_and_records_attempt(client, db_session):
    user = User(
        email="lockme@example.com",
        username="lockme",
        full_name="Lock Me",
        password_hash=get_password_hash("Password123"),
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "lockme@example.com", "password": "WrongPassword"},
    )

    assert resp.status_code == 401

    db_session.refresh(user)
    assert user.failed_login_count == 1

    attempts = (
        db_session.query(LoginAttempt).filter(LoginAttempt.email == "lockme@example.com").all()
    )
    assert len(attempts) == 1
    assert attempts[0].success is False


def test_login_locks_account_after_threshold_and_resets_after_unlock(
    client,
    db_session,
    monkeypatch,
):
    user = User(
        email="locked@example.com",
        username="locked_user",
        full_name="Locked User",
        password_hash=get_password_hash("Password123"),
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    for _ in range(5):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "locked@example.com", "password": "WrongPassword"},
        )

    assert resp.status_code == 401
    db_session.refresh(user)
    assert user.failed_login_count == 5
    assert user.locked_until is not None

    locked_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "locked@example.com", "password": "Password123"},
    )
    assert locked_resp.status_code == 401
    assert locked_resp.json()["message"] == "Account is temporarily locked"

    user.locked_until = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.add(user)
    db_session.commit()

    success_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "locked@example.com", "password": "Password123"},
    )
    assert success_resp.status_code == 200

    db_session.refresh(user)
    assert user.failed_login_count == 0
    assert user.locked_until is None


def test_inactive_user_token_is_rejected(client, db_session):
    user = User(
        email="inactive-token@example.com",
        username="inactive_token",
        full_name="Inactive Token",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive-token@example.com", "password": "Password123"},
    )
    assert login_resp.status_code == 200
    access_token = login_resp.json()["access_token"]

    user.status = UserStatus.inactive
    db_session.add(user)
    db_session.commit()

    me_resp = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_resp.status_code == 401
    assert me_resp.json()["message"] == "User is not active"


def test_login_persists_refresh_token_session_metadata(client, db_session):
    user = User(
        email="session-meta@example.com",
        username="session_meta",
        full_name="Session Meta",
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
        json={"email": "session-meta@example.com", "password": "Password123"},
        headers={
            "user-agent": "pytest-agent/1.0",
            "x-forwarded-for": "203.0.113.10",
        },
    )

    assert response.status_code == 200

    refresh_token = (
        db_session.query(RefreshToken)
        .filter(RefreshToken.user_id == user.id)
        .order_by(RefreshToken.created_at.desc())
        .first()
    )
    assert refresh_token is not None
    assert refresh_token.ip_address == "203.0.113.10"
    assert refresh_token.user_agent == "pytest-agent/1.0"


@pytest.mark.parametrize(
    ("constraint_name", "message", "expected_message"),
    [
        (
            "users_email_key",
            "duplicate key value violates unique constraint",
            "Email already registered",
        ),
        (
            "users_username_key",
            "duplicate key value violates unique constraint",
            "Username already taken",
        ),
        (
            None,
            (
                'duplicate key value violates unique constraint "users_email_key" '
                "Key (email)=(user@example.com) already exists."
            ),
            "Email already registered",
        ),
    ],
)
def test_register_integrity_error_is_mapped_to_conflict(
    db_session,
    constraint_name,
    message,
    expected_message,
):
    class FakeDiag:
        def __init__(self, name):
            self.constraint_name = name

    class FakeOrig(Exception):
        def __init__(self, error_message: str, name: str | None):
            super().__init__(error_message)
            self.diag = FakeDiag(name)

    with pytest.raises(Exception) as exc_info:
        AuthService._raise_registration_conflict(
            IntegrityError("INSERT INTO users ...", {}, FakeOrig(message, constraint_name))
        )

    assert str(exc_info.value) == expected_message

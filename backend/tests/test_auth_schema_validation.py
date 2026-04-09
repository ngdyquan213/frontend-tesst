import pytest
from pydantic import ValidationError

from app.schemas.auth import ChangePasswordRequest, RegisterRequest, ResetPasswordRequest


def test_register_request_accepts_strong_password():
    payload = RegisterRequest(
        email="traveler@example.com",
        full_name="Traveler Example",
        password="Password123",
    )

    assert payload.password == "Password123"


@pytest.mark.parametrize(
    ("password", "message"),
    [
        ("Short1Abc", "at least 10 characters"),
        ("password123", "uppercase"),
        ("PASSWORD123", "lowercase"),
        ("PasswordOnly", "number"),
    ],
)
def test_register_request_rejects_weak_passwords(password: str, message: str):
    with pytest.raises(ValidationError, match=message):
        RegisterRequest(
            email="traveler@example.com",
            full_name="Traveler Example",
            password=password,
        )


def test_reset_password_request_enforces_password_policy():
    with pytest.raises(ValidationError, match="uppercase"):
        ResetPasswordRequest(token="reset-token-123456", password="weakpassword1")


def test_change_password_request_enforces_password_policy_for_new_password():
    with pytest.raises(ValidationError, match="number"):
        ChangePasswordRequest(
            current_password="Password123",
            new_password="PasswordOnly",
        )

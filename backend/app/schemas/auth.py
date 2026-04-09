from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.password_policy import validate_password_for_schema
from app.models.enums import UserStatus


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str | None = Field(default=None, min_length=3, max_length=50)
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    _validate_password = field_validator("password")(validate_password_for_schema)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=16, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    _validate_password = field_validator("password")(validate_password_for_schema)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    _validate_new_password = field_validator("new_password")(validate_password_for_schema)


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=16, max_length=255)


class ResendVerificationEmailRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"
    user: "UserMeResponse | None" = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class MessageResponse(BaseModel):
    message: str


class UserMeResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    status: UserStatus
    role: str
    roles: list[str] = []
    permissions: list[str] = []
    email_verified: bool
    created_at: datetime
    updated_at: datetime

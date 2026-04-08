from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from app.core.exceptions import (
    AuthenticationAppException,
    ConflictAppException,
    NotFoundAppException,
)
from app.models.enums import UserStatus
from app.models.user import User


@dataclass(slots=True)
class FailedLoginResult:
    lockout_applied: bool


class AuthDomainService:
    def __init__(self, *, max_failed_logins: int, lockout_minutes: int) -> None:
        self.max_failed_logins = max_failed_logins
        self.lockout_minutes = lockout_minutes

    def assert_registration_available(
        self,
        *,
        existing_email: User | None,
        existing_username: User | None,
    ) -> None:
        if existing_email:
            raise ConflictAppException("Email already registered")

        if existing_username:
            raise ConflictAppException("Username already taken")

    def build_registered_user(
        self,
        *,
        email: str,
        username: str,
        full_name: str,
        password_hash: str,
    ) -> User:
        return User(
            email=email,
            username=username,
            full_name=full_name,
            password_hash=password_hash,
            status=UserStatus.active,
            email_verified=True,
            phone_verified=False,
            failed_login_count=0,
        )

    def get_active_lockout_until(self, *, user: User | None, now: datetime) -> datetime | None:
        if user and user.locked_until and user.locked_until > now:
            return user.locked_until
        return None

    def apply_failed_login(self, *, user: User, now: datetime) -> FailedLoginResult:
        user.failed_login_count += 1
        lockout_applied = False

        if user.failed_login_count >= self.max_failed_logins:
            user.locked_until = now + timedelta(minutes=self.lockout_minutes)
            lockout_applied = True

        return FailedLoginResult(lockout_applied=lockout_applied)

    def apply_successful_login(
        self,
        *,
        user: User,
        now: datetime,
        ip_address: str | None,
    ) -> None:
        self.assert_user_is_active(user)
        user.last_login_at = now
        user.last_login_ip = ip_address
        user.failed_login_count = 0
        user.locked_until = None

    def assert_user_is_active(self, user: User | None) -> None:
        if not user:
            raise NotFoundAppException("User not found")

        if user.status != UserStatus.active:
            raise AuthenticationAppException("User is not active")

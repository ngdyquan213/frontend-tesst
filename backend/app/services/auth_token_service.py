from __future__ import annotations

from datetime import datetime, timezone

from app.core.security import (
    create_access_token,
    create_refresh_token_value,
    get_refresh_token_expiry,
    hash_refresh_token,
)
from app.models.user import RefreshToken
from app.repositories.user_repository import UserRepository


class AuthTokenService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    def create_and_store_refresh_token(
        self,
        *,
        user_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> str:
        refresh_token_value = create_refresh_token_value()
        refresh_token_hash = hash_refresh_token(refresh_token_value)
        refresh_token_expires_at = get_refresh_token_expiry()

        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=refresh_token_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=refresh_token_expires_at,
            revoked_at=None,
        )
        self.user_repo.add_refresh_token(refresh_token)
        return refresh_token_value

    def issue_session_tokens(
        self,
        *,
        user_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[str, str]:
        access_token = create_access_token(user_id)
        refresh_token = self.create_and_store_refresh_token(
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return access_token, refresh_token

    def validate_refresh_token(self, *, refresh_token: str, lock_for_update: bool = False):
        token_hash = hash_refresh_token(refresh_token)
        if lock_for_update:
            stored = self.user_repo.get_refresh_token_by_hash_for_update(token_hash)
        else:
            stored = self.user_repo.get_refresh_token_by_hash(token_hash)

        if not stored:
            raise ValueError("Invalid refresh token")

        now = datetime.now(timezone.utc)
        if stored.revoked_at is not None:
            raise ValueError("Refresh token has been revoked")

        if stored.expires_at < now:
            raise ValueError("Refresh token has expired")

        return stored

    def rotate_refresh_token(
        self,
        *,
        refresh_token: str,
        user_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
        stored_token: RefreshToken | None = None,
    ) -> tuple[RefreshToken, str, str]:
        stored = stored_token or self.validate_refresh_token(
            refresh_token=refresh_token,
            lock_for_update=True,
        )
        now = datetime.now(timezone.utc)

        self.user_repo.revoke_refresh_token(stored, revoked_at=now)

        access_token = create_access_token(user_id)
        new_refresh_token = self.create_and_store_refresh_token(
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return stored, access_token, new_refresh_token

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationAppException, ValidationAppException
from app.core.password_policy import get_password_policy_error
from app.core.security import get_password_hash, verify_password
from app.models.enums import LogActorType
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService


class UserService:
    def __init__(
        self,
        *,
        db: Session,
        audit_service: AuditService,
        user_repo: UserRepository,
    ) -> None:
        self.db = db
        self.audit_service = audit_service
        self.user_repo = user_repo

    def get_my_profile(
        self,
        *,
        current_user,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        return current_user

    def update_my_profile(
        self,
        *,
        current_user,
        full_name: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        normalized_name = full_name.strip()
        if not normalized_name:
            raise ValidationAppException("Full name is required")

        try:
            current_user.full_name = normalized_name
            self.user_repo.save_user(current_user)
            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=current_user.id,
                action="user_profile_updated",
                resource_type="user",
                resource_id=current_user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"endpoint": "/users/me"},
            )
            self.db.commit()
            self.db.refresh(current_user)
        except Exception:
            self.db.rollback()
            raise

        return current_user

    def change_my_password(
        self,
        *,
        current_user,
        current_password: str,
        new_password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        if not verify_password(current_password, current_user.password_hash):
            raise AuthenticationAppException("Current password is incorrect")

        if current_password == new_password:
            raise ValidationAppException("New password must be different from the current password")

        password_policy_error = get_password_policy_error(new_password)
        if password_policy_error:
            raise ValidationAppException(password_policy_error)

        try:
            current_user.password_hash = get_password_hash(new_password)
            self.user_repo.save_user(current_user)
            revoked_count = self.user_repo.revoke_all_refresh_tokens_for_user(
                user_id=str(current_user.id),
                revoked_at=datetime.now(timezone.utc),
            )
            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=current_user.id,
                action="user_password_changed",
                resource_type="user",
                resource_id=current_user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"revoked_count": revoked_count},
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

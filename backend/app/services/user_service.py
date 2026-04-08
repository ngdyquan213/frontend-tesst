from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.enums import LogActorType
from app.services.audit_service import AuditService


class UserService:
    def __init__(self, *, db: Session, audit_service: AuditService) -> None:
        self.db = db
        self.audit_service = audit_service

    def get_my_profile(
        self,
        *,
        current_user,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        try:
            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=current_user.id,
                action="user_profile_viewed",
                resource_type="user",
                resource_id=current_user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"endpoint": "/users/me"},
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return current_user

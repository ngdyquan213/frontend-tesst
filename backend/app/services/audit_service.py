from __future__ import annotations

from typing import Any
from uuid import UUID

from app.core.logging import request_id_ctx_var
from app.models.audit import AuditLog, SecurityEvent
from app.models.enums import LogActorType, SecurityEventType
from app.repositories.audit_repository import AuditRepository
from app.utils.ip_utils import normalize_ip


class AuditService:
    def __init__(self, audit_repo: AuditRepository) -> None:
        self.audit_repo = audit_repo

    @staticmethod
    def _resolve_request_id(request_id: UUID | None) -> UUID | None:
        if request_id is not None:
            return request_id

        current_request_id = request_id_ctx_var.get()
        if not current_request_id:
            return None

        try:
            return UUID(current_request_id)
        except ValueError:
            return None

    def log_action(
        self,
        *,
        actor_type: LogActorType,
        action: str,
        resource_type: str,
        actor_user_id: UUID | None = None,
        resource_id: UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        request_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> AuditLog:
        log = AuditLog(
            actor_type=actor_type,
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=normalize_ip(ip_address),
            user_agent=user_agent,
            request_id=self._resolve_request_id(request_id),
            metadata_json=metadata,
        )
        return self.audit_repo.add_audit_log(log)

    def log_security_event(
        self,
        *,
        event_type: SecurityEventType,
        severity: str,
        title: str,
        description: str | None = None,
        related_user_id: UUID | None = None,
        ip_address: str | None = None,
        event_data: dict[str, Any] | None = None,
    ) -> SecurityEvent:
        event = SecurityEvent(
            event_type=event_type,
            severity=severity,
            title=title,
            description=description,
            related_user_id=related_user_id,
            ip_address=normalize_ip(ip_address),
            event_data=event_data,
        )
        return self.audit_repo.add_security_event(event)

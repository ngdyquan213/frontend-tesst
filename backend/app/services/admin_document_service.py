from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundAppException, ValidationAppException
from app.models.enums import LogActorType
from app.repositories.document_repository import DocumentRepository
from app.services.audit_service import AuditService

ALLOWED_DOCUMENT_REVIEW_STATUSES = {"approved", "rejected"}


class AdminDocumentService:
    def __init__(
        self,
        *,
        db: Session,
        document_repo: DocumentRepository,
        audit_service: AuditService,
    ) -> None:
        self.db = db
        self.document_repo = document_repo
        self.audit_service = audit_service

    def list_documents(
        self,
        *,
        actor_user_id,
        skip: int = 0,
        limit: int = 50,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        documents = self.document_repo.list_for_admin(skip=skip, limit=limit)
        total = self.document_repo.count_for_admin()

        try:
            self.audit_service.log_action(
                actor_type=LogActorType.admin,
                actor_user_id=actor_user_id,
                action="admin_list_documents",
                resource_type="uploaded_document",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "result_count": len(documents),
                    "total_count": total,
                    "skip": skip,
                    "limit": limit,
                },
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return documents, total

    def review_document(
        self,
        *,
        actor_user_id,
        document_id: str,
        status: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        normalized_status = status.strip().lower()
        if normalized_status not in ALLOWED_DOCUMENT_REVIEW_STATUSES:
            raise ValidationAppException("Invalid document review status")

        document = self.document_repo.get_by_id_for_admin(document_id)
        if not document:
            raise NotFoundAppException("Document not found")

        try:
            document.status = normalized_status
            document.reviewed_at = datetime.now(timezone.utc)
            document.reviewed_by_user_id = actor_user_id
            self.document_repo.add_document(document)
            self.audit_service.log_action(
                actor_type=LogActorType.admin,
                actor_user_id=actor_user_id,
                action="admin_review_document",
                resource_type="uploaded_document",
                resource_id=document.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"status": normalized_status},
            )
            self.db.commit()
            self.db.refresh(document)
        except Exception:
            self.db.rollback()
            raise

        return document

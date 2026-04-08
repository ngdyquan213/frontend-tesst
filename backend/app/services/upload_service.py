from __future__ import annotations

import logging

from fastapi import UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import NotFoundAppException, ValidationAppException
from app.core.logging import build_log_extra
from app.models.document import UploadedDocument
from app.models.enums import DocumentType, LogActorType
from app.repositories.booking_repository import BookingRepository
from app.repositories.document_repository import DocumentRepository
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.services.malware_scan_service import MalwareScanService
from app.services.storage_service import StorageService
from app.utils.file_utils import (
    normalize_upload_filename,
    validate_file,
    validate_file_signature,
)
from app.utils.ip_utils import normalize_ip

logger = logging.getLogger("app.upload")


class UploadService(ApplicationService):
    def __init__(
        self,
        db: Session,
        document_repo: DocumentRepository,
        audit_service: AuditService,
        booking_repo: BookingRepository | None = None,
        storage_service: StorageService | None = None,
        malware_scan_service: MalwareScanService | None = None,
    ) -> None:
        self.db = db
        self.document_repo = document_repo
        self.audit_service = audit_service
        self.booking_repo = booking_repo or BookingRepository(db)
        self.storage_service = storage_service or StorageService()
        self.malware_scan_service = malware_scan_service or MalwareScanService()

    def _validate_booking_and_traveler_relation(
        self,
        *,
        user_id: str,
        booking_id: str | None,
        traveler_id: str | None,
    ) -> tuple[str | None, str | None]:
        resolved_booking_id = booking_id
        resolved_traveler_id = traveler_id

        if booking_id:
            booking = self.booking_repo.get_by_id_and_user_id(booking_id, user_id)
            if not booking:
                raise NotFoundAppException("Booking not found")

        if traveler_id:
            traveler = self.booking_repo.get_traveler_by_id_and_user_id(traveler_id, user_id)
            if not traveler:
                raise ValidationAppException("Traveler not found")

            if booking_id and str(traveler.booking_id) != booking_id:
                raise ValidationAppException("Traveler does not belong to the provided booking")

            resolved_booking_id = booking_id or str(traveler.booking_id)
            resolved_traveler_id = traveler_id

        return resolved_booking_id, resolved_traveler_id
    def upload_document(
        self,
        *,
        user_id: str,
        file: UploadFile,
        document_type: DocumentType,
        booking_id: str | None = None,
        traveler_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> UploadedDocument:
        original_filename = normalize_upload_filename(file.filename or "")

        try:
            validate_file(original_filename, file.content_type or "")
            validate_file_signature(file, file.content_type or "")
        except ValueError as exc:
            raise ValidationAppException(str(exc)) from exc

        booking_id, traveler_id = self._validate_booking_and_traveler_relation(
            user_id=user_id,
            booking_id=booking_id,
            traveler_id=traveler_id,
        )

        normalized_ip = normalize_ip(ip_address)

        logger.info(
            "upload_started",
            extra=build_log_extra(
                "upload_started",
                filename=original_filename,
                mime_type=file.content_type,
                user_id=user_id,
                booking_id=booking_id,
                traveler_id=traveler_id,
                malware_scan_enabled=settings.UPLOAD_MALWARE_SCAN_ENABLED,
                malware_scan_backend=settings.UPLOAD_MALWARE_SCAN_BACKEND,
            ),
        )

        self.malware_scan_service.scan_upload(
            file=file,
            original_filename=original_filename,
            mime_type=file.content_type or "application/octet-stream",
        )

        stored_object = self.storage_service.store_upload(
            file=file,
            original_filename=original_filename,
        )

        try:
            document = UploadedDocument(
                user_id=user_id,
                booking_id=booking_id,
                traveler_id=traveler_id,
                document_type=document_type,
                original_filename=original_filename,
                stored_filename=stored_object.stored_filename,
                mime_type=file.content_type or "application/octet-stream",
                file_size=stored_object.file_size,
                storage_bucket=stored_object.storage_bucket,
                storage_key=stored_object.storage_key,
                checksum_sha256=stored_object.checksum_sha256,
                is_private=True,
            )
            self.document_repo.add_document(document)
            self.db.flush()

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=user_id,
                action="document_uploaded",
                resource_type="uploaded_document",
                resource_id=document.id,
                ip_address=normalized_ip,
                user_agent=user_agent,
                metadata={
                    "document_type": document_type.value,
                    "original_filename": document.original_filename,
                    "booking_id": booking_id,
                    "traveler_id": traveler_id,
                    "storage_bucket": stored_object.storage_bucket,
                    "storage_key": stored_object.storage_key,
                    "file_size": stored_object.file_size,
                },
            )

            self.commit_and_refresh(document)
        except Exception:
            self.db.rollback()
            self.storage_service.delete_object(
                storage_bucket=stored_object.storage_bucket,
                storage_key=stored_object.storage_key,
            )
            raise

        logger.info(
            "upload_completed",
            extra=build_log_extra(
                "upload_completed",
                document_id=str(document.id),
                filename=document.original_filename,
                file_size=stored_object.file_size,
                user_id=user_id,
                malware_scan_enabled=settings.UPLOAD_MALWARE_SCAN_ENABLED,
                malware_scan_backend=settings.UPLOAD_MALWARE_SCAN_BACKEND,
            ),
        )

        return document

    def list_my_documents(self, user_id: str):
        return self.document_repo.list_by_user_id(user_id)

    def get_my_document(
        self,
        *,
        user_id: str,
        document_id: str,
    ) -> UploadedDocument:
        document = self.document_repo.get_by_id_and_user_id(document_id, user_id)
        if not document:
            raise NotFoundAppException("Document not found")

        if document.storage_bucket == settings.LOCAL_STORAGE_BUCKET:
            file_path = self.storage_service.resolve_local_path(document.storage_key)
            if not file_path.exists():
                raise NotFoundAppException("Document file not found")

        return document

    def build_my_document_download_response(
        self,
        *,
        user_id: str,
        document_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> FileResponse | StreamingResponse:
        document = self.get_my_document(
            user_id=user_id,
            document_id=document_id,
        )
        response = self.storage_service.build_download_response(document=document)
        normalized_ip = normalize_ip(ip_address)

        self.audit_service.log_action(
            actor_type=LogActorType.user,
            actor_user_id=user_id,
            action="document_downloaded",
            resource_type="uploaded_document",
            resource_id=document.id,
            ip_address=normalized_ip,
            user_agent=user_agent,
            metadata={"storage_key": document.storage_key},
        )
        self.commit()

        return response

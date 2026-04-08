from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path
from tempfile import SpooledTemporaryFile
from typing import BinaryIO, Iterator

from fastapi import UploadFile
from fastapi.responses import FileResponse, StreamingResponse

from app.core.config import settings
from app.core.exceptions import (
    ExternalServiceAppException,
    NotFoundAppException,
    ValidationAppException,
)
from app.utils.file_utils import build_content_disposition_header, generate_stored_filename

CHUNK_SIZE = 1024 * 1024


@dataclass(slots=True)
class StoredObject:
    storage_bucket: str
    storage_key: str
    stored_filename: str
    file_size: int
    checksum_sha256: str


class StorageService:
    def __init__(self) -> None:
        self.backend = settings.STORAGE_BACKEND
        self.local_upload_dir = Path(settings.LOCAL_UPLOAD_DIR).resolve()

    def store_upload(self, *, file: UploadFile, original_filename: str) -> StoredObject:
        if self.backend == "local":
            return self._store_upload_local(file=file, original_filename=original_filename)
        return self._store_upload_s3(file=file, original_filename=original_filename)

    def store_bytes(
        self,
        *,
        content: bytes,
        original_filename: str,
        mime_type: str,
    ) -> StoredObject:
        if self.backend == "local":
            return self._store_bytes_local(content=content, original_filename=original_filename)
        return self._store_bytes_s3(
            content=content,
            original_filename=original_filename,
            mime_type=mime_type,
        )

    def delete_object(self, *, storage_bucket: str, storage_key: str) -> None:
        if storage_bucket == settings.LOCAL_STORAGE_BUCKET:
            self.resolve_local_path(storage_key).unlink(missing_ok=True)
            return
        try:
            self._s3_client().delete_object(Bucket=storage_bucket, Key=storage_key)
        except Exception as exc:
            raise self._translate_s3_exception(
                exc,
                default_message="Document storage is temporarily unavailable",
            ) from exc

    def build_download_response(self, *, document) -> FileResponse | StreamingResponse:
        if document.storage_bucket == settings.LOCAL_STORAGE_BUCKET:
            path = self.resolve_local_path(document.storage_key)
            if not path.exists():
                raise NotFoundAppException("Document file not found")
            return FileResponse(
                path=path,
                media_type=document.mime_type,
                filename=document.original_filename,
            )

        try:
            body = self._s3_client().get_object(
                Bucket=document.storage_bucket,
                Key=document.storage_key,
            )["Body"]
        except Exception as exc:
            raise self._translate_s3_exception(
                exc,
                default_message="Document storage is temporarily unavailable",
            ) from exc
        headers = {
            "Content-Disposition": build_content_disposition_header(document.original_filename)
        }
        return StreamingResponse(
            self._iter_stream(body),
            media_type=document.mime_type,
            headers=headers,
        )

    def _store_upload_local(self, *, file: UploadFile, original_filename: str) -> StoredObject:
        self.local_upload_dir.mkdir(parents=True, exist_ok=True)
        stored_filename = generate_stored_filename(original_filename)
        destination = self.local_upload_dir / stored_filename
        total_written = 0
        checksum = hashlib.sha256()

        try:
            with open(destination, "wb") as out:
                while True:
                    chunk = file.file.read(CHUNK_SIZE)
                    if not chunk:
                        break

                    total_written += len(chunk)
                    if total_written > settings.MAX_UPLOAD_SIZE_BYTES:
                        raise ValidationAppException("Uploaded file exceeds maximum allowed size")

                    checksum.update(chunk)
                    out.write(chunk)
        except Exception:
            destination.unlink(missing_ok=True)
            raise
        finally:
            file.file.seek(0)

        if total_written == 0:
            destination.unlink(missing_ok=True)
            raise ValidationAppException("Uploaded file is empty")

        return StoredObject(
            storage_bucket=settings.LOCAL_STORAGE_BUCKET,
            storage_key=stored_filename,
            stored_filename=stored_filename,
            file_size=total_written,
            checksum_sha256=checksum.hexdigest(),
        )

    def _store_bytes_local(self, *, content: bytes, original_filename: str) -> StoredObject:
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise ValidationAppException("Uploaded file exceeds maximum allowed size")

        self.local_upload_dir.mkdir(parents=True, exist_ok=True)
        stored_filename = generate_stored_filename(original_filename)
        destination = self.local_upload_dir / stored_filename

        try:
            with open(destination, "wb") as out:
                out.write(content)
        except Exception:
            destination.unlink(missing_ok=True)
            raise

        return StoredObject(
            storage_bucket=settings.LOCAL_STORAGE_BUCKET,
            storage_key=stored_filename,
            stored_filename=stored_filename,
            file_size=len(content),
            checksum_sha256=hashlib.sha256(content).hexdigest(),
        )

    def _store_upload_s3(self, *, file: UploadFile, original_filename: str) -> StoredObject:
        stored_filename = generate_stored_filename(original_filename)
        total_written = 0
        checksum = hashlib.sha256()
        temp_file = SpooledTemporaryFile(max_size=settings.MAX_UPLOAD_SIZE_BYTES)

        try:
            while True:
                chunk = file.file.read(CHUNK_SIZE)
                if not chunk:
                    break

                total_written += len(chunk)
                if total_written > settings.MAX_UPLOAD_SIZE_BYTES:
                    raise ValidationAppException("Uploaded file exceeds maximum allowed size")

                checksum.update(chunk)
                temp_file.write(chunk)
            if total_written == 0:
                raise ValidationAppException("Uploaded file is empty")

            temp_file.seek(0)
            self._s3_client().upload_fileobj(
                temp_file,
                settings.S3_BUCKET_NAME,
                stored_filename,
                ExtraArgs={"ContentType": file.content_type or "application/octet-stream"},
            )
        finally:
            temp_file.close()
            file.file.seek(0)

        return StoredObject(
            storage_bucket=settings.S3_BUCKET_NAME,
            storage_key=stored_filename,
            stored_filename=stored_filename,
            file_size=total_written,
            checksum_sha256=checksum.hexdigest(),
        )

    def _store_bytes_s3(
        self,
        *,
        content: bytes,
        original_filename: str,
        mime_type: str,
    ) -> StoredObject:
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise ValidationAppException("Uploaded file exceeds maximum allowed size")

        stored_filename = generate_stored_filename(original_filename)
        self._s3_client().put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=stored_filename,
            Body=content,
            ContentType=mime_type,
        )
        return StoredObject(
            storage_bucket=settings.S3_BUCKET_NAME,
            storage_key=stored_filename,
            stored_filename=stored_filename,
            file_size=len(content),
            checksum_sha256=hashlib.sha256(content).hexdigest(),
        )

    def resolve_local_path(self, storage_key: str) -> Path:
        key_path = Path(storage_key)
        if key_path.is_absolute():
            raise NotFoundAppException("Document file not found")

        resolved = (self.local_upload_dir / key_path).resolve()
        if self.local_upload_dir not in resolved.parents and resolved != self.local_upload_dir:
            raise NotFoundAppException("Document file not found")
        return resolved

    def _s3_client(self):
        if not settings.S3_BUCKET_NAME:
            raise RuntimeError("S3_BUCKET_NAME is required when STORAGE_BACKEND=s3")

        try:
            import boto3
        except ImportError as exc:
            raise RuntimeError("boto3 is required when STORAGE_BACKEND=s3") from exc

        session = boto3.session.Session(
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region_name=settings.S3_REGION,
        )
        return session.client("s3", endpoint_url=settings.S3_ENDPOINT_URL or None)

    def _iter_stream(self, body: BinaryIO) -> Iterator[bytes]:
        try:
            while True:
                chunk = body.read(CHUNK_SIZE)
                if not chunk:
                    break
                yield chunk
        finally:
            close = getattr(body, "close", None)
            if callable(close):
                close()

    @staticmethod
    def _translate_s3_exception(
        exc: Exception,
        *,
        default_message: str,
    ) -> NotFoundAppException | ExternalServiceAppException:
        error_code = None
        response = getattr(exc, "response", None)
        if isinstance(response, dict):
            error_code = response.get("Error", {}).get("Code")

        if str(error_code) in {"404", "NoSuchKey", "NotFound"}:
            return NotFoundAppException("Document file not found")
        return ExternalServiceAppException(default_message)

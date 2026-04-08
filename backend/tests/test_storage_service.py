import asyncio
from io import BytesIO
from types import SimpleNamespace

import pytest
from fastapi import UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from starlette.datastructures import Headers

from app.core.exceptions import ExternalServiceAppException, ValidationAppException
from app.services.storage_service import StorageService


def build_upload_file(
    content: bytes,
    filename: str = "passport.pdf",
    content_type: str = "application/octet-stream",
) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(content),
        headers=Headers({"content-type": content_type}),
    )


def test_store_upload_s3_rejects_empty_file(monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "STORAGE_BACKEND", "s3")
    monkeypatch.setattr(config_module.settings, "S3_BUCKET_NAME", "bucket-1")

    service = StorageService()

    class FakeClient:
        def upload_fileobj(self, *args, **kwargs):
            raise AssertionError("empty uploads should not reach S3")

    monkeypatch.setattr(service, "_s3_client", lambda: FakeClient())

    with pytest.raises(ValidationAppException, match="Uploaded file is empty"):
        service.store_upload(
            file=build_upload_file(b""),
            original_filename="passport.pdf",
        )


def test_store_upload_s3_uploads_and_returns_checksum(monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "STORAGE_BACKEND", "s3")
    monkeypatch.setattr(config_module.settings, "S3_BUCKET_NAME", "bucket-1")
    monkeypatch.setattr(config_module.settings, "MAX_UPLOAD_SIZE_BYTES", 1024 * 1024)

    uploaded = {}
    service = StorageService()

    class FakeClient:
        def upload_fileobj(self, fileobj, bucket, key, ExtraArgs):
            uploaded["bucket"] = bucket
            uploaded["key"] = key
            uploaded["content_type"] = ExtraArgs["ContentType"]
            uploaded["bytes"] = fileobj.read()

    monkeypatch.setattr(service, "_s3_client", lambda: FakeClient())

    upload = build_upload_file(b"%PDF-1.4 demo", content_type="application/pdf")

    result = service.store_upload(file=upload, original_filename="passport.pdf")

    assert result.storage_bucket == "bucket-1"
    assert result.file_size == len(b"%PDF-1.4 demo")
    assert uploaded["bucket"] == "bucket-1"
    assert uploaded["content_type"] == "application/pdf"
    assert uploaded["bytes"] == b"%PDF-1.4 demo"
    assert upload.file.tell() == 0


def test_build_download_response_streams_s3_object(monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "STORAGE_BACKEND", "s3")
    monkeypatch.setattr(config_module.settings, "S3_BUCKET_NAME", "bucket-1")

    service = StorageService()

    class FakeBody:
        def __init__(self):
            self._chunks = [b"hello", b"world", b""]

        def read(self, _size):
            return self._chunks.pop(0)

    class FakeClient:
        def get_object(self, *, Bucket, Key):
            assert Bucket == "bucket-1"
            assert Key == "doc-key"
            return {"Body": FakeBody()}

    monkeypatch.setattr(service, "_s3_client", lambda: FakeClient())

    document = SimpleNamespace(
        storage_bucket="bucket-1",
        storage_key="doc-key",
        mime_type="application/pdf",
        original_filename="passport.pdf",
    )

    response = service.build_download_response(document=document)

    async def collect_body() -> bytes:
        chunks = []
        async for chunk in response.body_iterator:
            chunks.append(chunk)
        return b"".join(chunks)

    assert isinstance(response, StreamingResponse)
    assert response.headers["content-disposition"].startswith("attachment;")
    assert asyncio.run(collect_body()) == b"helloworld"


def test_build_download_response_maps_s3_errors(monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "STORAGE_BACKEND", "s3")
    monkeypatch.setattr(config_module.settings, "S3_BUCKET_NAME", "bucket-1")

    service = StorageService()

    class FakeClient:
        def get_object(self, *, Bucket, Key):
            raise RuntimeError("temporary storage failure")

    monkeypatch.setattr(service, "_s3_client", lambda: FakeClient())

    document = SimpleNamespace(
        storage_bucket="bucket-1",
        storage_key="doc-key",
        mime_type="application/pdf",
        original_filename="passport.pdf",
    )

    with pytest.raises(
        ExternalServiceAppException,
        match="Document storage is temporarily unavailable",
    ):
        service.build_download_response(document=document)


def test_build_download_response_returns_local_file_response(monkeypatch, tmp_path):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "STORAGE_BACKEND", "local")
    monkeypatch.setattr(config_module.settings, "LOCAL_UPLOAD_DIR", str(tmp_path))

    stored_path = tmp_path / "passport.pdf"
    stored_path.write_bytes(b"demo")
    service = StorageService()
    document = SimpleNamespace(
        storage_bucket=config_module.settings.LOCAL_STORAGE_BUCKET,
        storage_key="passport.pdf",
        mime_type="application/pdf",
        original_filename="passport.pdf",
    )

    response = service.build_download_response(document=document)

    assert isinstance(response, FileResponse)
    assert response.path == stored_path

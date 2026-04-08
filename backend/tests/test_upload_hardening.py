import hashlib
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from app.core.security import get_password_hash
from app.models.document import UploadedDocument
from app.models.enums import UserStatus
from app.models.user import User


def create_user_and_login(
    client, db_session, *, email: str, username: str, password: str = "Password123"
):
    user = User(
        email=email,
        username=username,
        full_name=username,
        password_hash=get_password_hash(password),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    return user, token


def test_upload_rejects_empty_file(client, db_session, monkeypatch, tmp_path):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "LOCAL_UPLOAD_DIR", str(tmp_path))

    _, token = create_user_and_login(
        client,
        db_session,
        email="upload-empty@example.com",
        username="upload_empty",
    )

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("empty.pdf", BytesIO(b""), "application/pdf")},
        data={"document_type": "passport"},
    )

    assert resp.status_code == 400
    body = resp.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert body["message"] == "Uploaded file is empty"


def test_upload_rejects_file_too_large(client, db_session, monkeypatch, tmp_path, sample_pdf_bytes):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "LOCAL_UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(config_module.settings, "MAX_UPLOAD_SIZE_BYTES", 10)

    _, token = create_user_and_login(
        client,
        db_session,
        email="upload-large@example.com",
        username="upload_large",
    )

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("large.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
        data={"document_type": "passport"},
    )

    assert resp.status_code == 400
    body = resp.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert body["message"] == "Uploaded file exceeds maximum allowed size"


def test_upload_rejects_invalid_extension(client, db_session, monkeypatch, tmp_path):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "LOCAL_UPLOAD_DIR", str(tmp_path))

    _, token = create_user_and_login(
        client,
        db_session,
        email="upload-ext@example.com",
        username="upload_ext",
    )

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("malware.exe", BytesIO(b"fake-binary"), "application/pdf")},
        data={"document_type": "passport"},
    )

    assert resp.status_code == 400
    body = resp.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert body["message"] == "File extension is not allowed"


def test_upload_rejects_invalid_mime_type(client, db_session, monkeypatch, tmp_path):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "LOCAL_UPLOAD_DIR", str(tmp_path))

    _, token = create_user_and_login(
        client,
        db_session,
        email="upload-mime@example.com",
        username="upload_mime",
    )

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("file.pdf", BytesIO(b"%PDF-1.4 fake"), "text/plain")},
        data={"document_type": "passport"},
    )

    assert resp.status_code == 400
    body = resp.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert body["message"] == "File MIME type is not allowed"


def test_upload_rejects_mismatched_file_signature(
    client, db_session, monkeypatch, tmp_path
):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "LOCAL_UPLOAD_DIR", str(tmp_path))

    _, token = create_user_and_login(
        client,
        db_session,
        email="upload-signature@example.com",
        username="upload_signature",
    )

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("file.pdf", BytesIO(b"not-a-real-pdf"), "application/pdf")},
        data={"document_type": "passport"},
    )

    assert resp.status_code == 400
    body = resp.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert body["message"] == "File content does not match declared MIME type"


def test_upload_accepts_valid_file(client, db_session, monkeypatch, tmp_path, sample_pdf_bytes):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "LOCAL_UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(config_module.settings, "MAX_UPLOAD_SIZE_BYTES", 1024 * 1024)

    _, token = create_user_and_login(
        client,
        db_session,
        email="upload-ok@example.com",
        username="upload_ok",
    )

    content = sample_pdf_bytes

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("passport.pdf", BytesIO(content), "application/pdf")},
        data={"document_type": "passport"},
    )

    assert resp.status_code == 201
    body = resp.json()

    assert body["document_type"] == "passport"
    assert body["original_filename"] == "passport.pdf"
    assert body["mime_type"] == "application/pdf"
    assert body["file_size"] == len(content)
    assert body["storage_bucket"] == "local"
    assert "storage_key" not in body
    assert "stored_filename" not in body


def test_upload_rejects_malware_signature_when_scan_enabled(
    client, db_session, monkeypatch, tmp_path
):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "LOCAL_UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(config_module.settings, "UPLOAD_MALWARE_SCAN_ENABLED", True)
    monkeypatch.setattr(config_module.settings, "UPLOAD_MALWARE_SCAN_BACKEND", "mock")

    _, token = create_user_and_login(
        client,
        db_session,
        email="upload-malware@example.com",
        username="upload_malware",
    )

    malware_like_pdf = (
        b"%PDF-1.4\n"
        b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE"
    )

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("passport.pdf", BytesIO(malware_like_pdf), "application/pdf")},
        data={"document_type": "passport"},
    )

    assert resp.status_code == 400
    body = resp.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert body["message"] == "Uploaded file failed malware scan"


def test_upload_persists_storage_key_and_checksum(
    client, db_session, monkeypatch, tmp_path, sample_pdf_bytes
):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "LOCAL_UPLOAD_DIR", str(tmp_path))

    user, token = create_user_and_login(
        client,
        db_session,
        email="upload-meta@example.com",
        username="upload_meta",
    )

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("passport.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
        data={"document_type": "passport"},
    )

    assert resp.status_code == 201

    document = (
        db_session.query(UploadedDocument)
        .filter(UploadedDocument.user_id == user.id)
        .order_by(UploadedDocument.uploaded_at.desc())
        .first()
    )
    assert document is not None
    assert not Path(document.storage_key).is_absolute()
    assert (tmp_path.resolve() / document.storage_key).exists()
    assert document.checksum_sha256 == hashlib.sha256(sample_pdf_bytes).hexdigest()


def test_list_documents_excludes_soft_deleted_records(
    client, db_session, monkeypatch, tmp_path, sample_pdf_bytes
):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "LOCAL_UPLOAD_DIR", str(tmp_path))

    user, token = create_user_and_login(
        client,
        db_session,
        email="upload-soft-delete@example.com",
        username="upload_soft_delete",
    )

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("passport.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
        data={"document_type": "passport"},
    )
    assert resp.status_code == 201

    document = (
        db_session.query(UploadedDocument)
        .filter(UploadedDocument.user_id == user.id)
        .order_by(UploadedDocument.uploaded_at.desc())
        .first()
    )
    assert document is not None

    document.deleted_at = datetime.now(timezone.utc)
    db_session.commit()

    list_resp = client.get(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert list_resp.status_code == 200
    assert list_resp.json() == []

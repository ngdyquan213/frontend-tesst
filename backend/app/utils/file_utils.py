from __future__ import annotations

import uuid
from pathlib import Path
from urllib.parse import quote

from fastapi import UploadFile

from app.core.config import settings

FILE_SIGNATURES: dict[str, bytes] = {
    "application/pdf": b"%PDF-",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/jpeg": b"\xff\xd8\xff",
}

EXTENSION_MIME_MAP: dict[str, str] = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def normalize_upload_filename(filename: str) -> str:
    normalized = filename.replace("\\", "/").split("/")[-1].strip()
    normalized = "".join(char for char in normalized if char >= " " and char != "\x7f")
    normalized = normalized.replace('"', "_").replace(";", "_")
    if not normalized:
        raise ValueError("Filename is required")
    return normalized


def validate_file(filename: str, mime_type: str) -> None:
    normalized_filename = normalize_upload_filename(filename)
    ext = Path(normalized_filename).suffix.lower()
    normalized_mime_type = mime_type.lower().strip()

    if ext not in settings.allowed_upload_extensions_list:
        raise ValueError("File extension is not allowed")

    if normalized_mime_type not in settings.allowed_upload_mime_types_list:
        raise ValueError("File MIME type is not allowed")

    expected_mime_type = EXTENSION_MIME_MAP.get(ext)
    if expected_mime_type and expected_mime_type != normalized_mime_type:
        raise ValueError("File extension does not match MIME type")


def validate_file_signature(file: UploadFile, mime_type: str) -> None:
    expected_signature = FILE_SIGNATURES.get(mime_type.lower().strip())
    if expected_signature is None:
        return

    current_position = file.file.tell()
    try:
        header = file.file.read(len(expected_signature))
    finally:
        file.file.seek(current_position)

    if not header:
        return

    if not header.startswith(expected_signature):
        raise ValueError("File content does not match declared MIME type")


def generate_stored_filename(original_filename: str) -> str:
    ext = Path(original_filename).suffix.lower() or ".bin"
    return f"{uuid.uuid4().hex}{ext}"


def build_content_disposition_header(filename: str) -> str:
    normalized = normalize_upload_filename(filename)
    ascii_fallback = normalized.encode("ascii", "ignore").decode("ascii") or "download"
    ascii_fallback = ascii_fallback.replace('"', "_").replace("\\", "_")

    if normalized == ascii_fallback:
        return f'attachment; filename="{ascii_fallback}"'

    quoted_filename = quote(normalized, safe="")
    return (
        f'attachment; filename="{ascii_fallback}"; '
        f"filename*=UTF-8''{quoted_filename}"
    )

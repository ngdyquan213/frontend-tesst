import logging
import re
from typing import Any

from fastapi import APIRouter, Request, status

from app.core.logging import build_log_extra
from app.schemas.client_event import ClientRuntimeErrorRequest, ClientRuntimeErrorResponse
from app.utils.request_context import get_client_ip

logger = logging.getLogger("app.frontend")
router = APIRouter(prefix="/client-events", tags=["client-events"])

MAX_TEXT_LENGTH = 500
MAX_STACK_LINES = 12
MAX_METADATA_ITEMS = 20
MAX_METADATA_DEPTH = 3
REDACTED = "[REDACTED]"
TRUNCATED = "[TRUNCATED]"
SENSITIVE_FIELD_NAMES = {
    "authorization",
    "cookie",
    "password",
    "passwd",
    "secret",
    "token",
    "refresh_token",
    "access_token",
    "api_key",
    "apikey",
}
SENSITIVE_TEXT_PATTERNS = (
    re.compile(r"(?i)\bbearer\s+[A-Za-z0-9._~+/-]+=*"),
    re.compile(
        r"(?i)\b(authorization|cookie|password|passwd|secret|token|refresh[_-]?token|access[_-]?token|api[_-]?key)\b\s*[:=]\s*([^\s,;]+)"
    ),
)


def _truncate_text(value: str, *, limit: int = MAX_TEXT_LENGTH) -> str:
    if len(value) <= limit:
        return value
    return f"{value[: limit - len(TRUNCATED) - 1]} {TRUNCATED}"


def _redact_text(value: str) -> str:
    redacted = value
    for pattern in SENSITIVE_TEXT_PATTERNS:
        redacted = pattern.sub(
            lambda match: (
                f"{match.group(1)}={REDACTED}"
                if match.lastindex and match.lastindex > 0
                else REDACTED
            ),
            redacted,
        )
    return redacted


def _sanitize_text(
    value: str | None,
    *,
    limit: int = MAX_TEXT_LENGTH,
    preserve_newlines: bool = False,
) -> str | None:
    if value is None:
        return None

    sanitized = _redact_text(value.strip())
    if not sanitized:
        return None

    if preserve_newlines:
        lines = sanitized.splitlines()[:MAX_STACK_LINES]
        sanitized = "\n".join(_truncate_text(line, limit=limit) for line in lines if line.strip())

    return _truncate_text(sanitized, limit=limit)


def _sanitize_metadata(value: Any, *, depth: int = 0) -> Any:
    if value is None or isinstance(value, (bool, int, float)):
        return value

    if depth >= MAX_METADATA_DEPTH:
        return TRUNCATED

    if isinstance(value, str):
        return _sanitize_text(value, limit=160)

    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for index, (key, item) in enumerate(value.items()):
            if index >= MAX_METADATA_ITEMS:
                sanitized["truncated"] = True
                break

            normalized_key = _truncate_text(str(key), limit=80)
            if normalized_key.lower() in SENSITIVE_FIELD_NAMES:
                sanitized[normalized_key] = REDACTED
                continue

            sanitized[normalized_key] = _sanitize_metadata(item, depth=depth + 1)
        return sanitized

    if isinstance(value, (list, tuple, set)):
        items = list(value)
        sanitized_items = [
            _sanitize_metadata(item, depth=depth + 1)
            for item in items[:MAX_METADATA_ITEMS]
        ]
        if len(items) > MAX_METADATA_ITEMS:
            sanitized_items.append(TRUNCATED)
        return sanitized_items

    return f"[{type(value).__name__}]"


@router.post(
    "/runtime-errors",
    response_model=ClientRuntimeErrorResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def ingest_client_runtime_error(
    payload: ClientRuntimeErrorRequest,
    request: Request,
) -> ClientRuntimeErrorResponse:
    logger.error(
        "frontend_runtime_error",
        extra=build_log_extra(
            "frontend_runtime_error",
            source=payload.source,
            route=payload.route,
            message=_sanitize_text(payload.message),
            stack=_sanitize_text(payload.stack, limit=1_200, preserve_newlines=True),
            user_agent=payload.userAgent,
            source_ip=get_client_ip(request),
            metadata=_sanitize_metadata(payload.metadata),
        ),
    )
    return ClientRuntimeErrorResponse()

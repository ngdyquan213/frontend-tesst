from fastapi import Request

from app.core.constants import IDEMPOTENCY_KEY_HEADER, REQUEST_ID_HEADER


def get_request_id_from_request(request: Request) -> str | None:
    return getattr(request.state, "request_id", None) or request.headers.get(REQUEST_ID_HEADER)


def get_idempotency_key_from_request(request: Request) -> str | None:
    return request.headers.get(IDEMPOTENCY_KEY_HEADER)

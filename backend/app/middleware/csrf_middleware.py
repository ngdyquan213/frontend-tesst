from __future__ import annotations

from typing import Callable
from urllib.parse import urlparse

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from app.core.config import settings
from app.utils.auth_cookies import ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
CSRF_EXEMPT_PATH_PREFIXES = (
    "/health",
    "/metrics",
    "/api/v1/payments/callback",
)


def _normalize_origin(value: str | None) -> str | None:
    if not value:
        return None

    parsed = urlparse(value)
    if not parsed.scheme or not parsed.netloc:
        return None

    return f"{parsed.scheme}://{parsed.netloc}".lower()


class CSRFMiddleware(BaseHTTPMiddleware):
    @staticmethod
    def _is_exempt_path(path: str) -> bool:
        return any(path.startswith(prefix) for prefix in CSRF_EXEMPT_PATH_PREFIXES)

    @staticmethod
    def _has_auth_cookie(request: Request) -> bool:
        return bool(
            request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)
            or request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)
        )

    @staticmethod
    def _build_error_response(request: Request, detail: str) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error_code": "CSRF_VALIDATION_FAILED",
                "message": detail,
                "detail": detail,
                "path": str(request.url.path),
            },
        )

    def _allowed_origins(self) -> set[str]:
        allowed = {
            normalized
            for normalized in (
                _normalize_origin(origin) for origin in settings.cors_origins_list
            )
            if normalized
        }
        frontend_origin = _normalize_origin(settings.FRONTEND_BASE_URL)
        if frontend_origin:
            allowed.add(frontend_origin)
        return allowed

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method.upper() not in UNSAFE_METHODS or self._is_exempt_path(request.url.path):
            return await call_next(request)

        if not self._has_auth_cookie(request):
            return await call_next(request)

        origin = _normalize_origin(request.headers.get("origin"))
        if origin is None:
            origin = _normalize_origin(request.headers.get("referer"))

        if origin is None:
            if settings.ENVIRONMENT in {"development", "test"}:
                return await call_next(request)
            return self._build_error_response(request, "Missing trusted request origin")

        if origin not in self._allowed_origins():
            return self._build_error_response(request, "Cross-site request was rejected")

        return await call_next(request)

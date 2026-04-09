from __future__ import annotations

import json
import time
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from app.core.config import settings
from app.core.metrics import operational_metrics
from app.core.redis import redis_client
from app.utils.request_context import get_client_ip


class RateLimitMiddleware(BaseHTTPMiddleware):
    FAIL_CLOSED_PATHS = {
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/refresh",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/auth/verify-email",
        "/api/v1/auth/verify-email/resend",
    }

    @staticmethod
    def _is_payment_callback_path(path: str) -> bool:
        return path.startswith("/api/v1/payments/callback")

    def __init__(self, app, max_requests: int | None = None, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    def _resolve_limit(self, path: str) -> int:
        if self.max_requests is not None:
            return self.max_requests
        if path == "/api/v1/auth/login":
            # Preserve the auth lockout contract even when environments set a
            # tighter login rate limit than the failed-attempt threshold.
            return max(
                settings.RATE_LIMIT_LOGIN_PER_MINUTE,
                settings.AUTH_MAX_FAILED_LOGINS + 2,
            )
        if path == "/api/v1/auth/register":
            return settings.RATE_LIMIT_REGISTER_PER_MINUTE
        if path == "/api/v1/auth/refresh":
            return settings.RATE_LIMIT_REFRESH_PER_MINUTE
        if path == "/api/v1/auth/forgot-password":
            return settings.RATE_LIMIT_FORGOT_PASSWORD_PER_MINUTE
        if path == "/api/v1/auth/reset-password":
            return settings.RATE_LIMIT_RESET_PASSWORD_PER_MINUTE
        if path == "/api/v1/auth/verify-email":
            return settings.RATE_LIMIT_RESET_PASSWORD_PER_MINUTE
        if path == "/api/v1/auth/verify-email/resend":
            return settings.RATE_LIMIT_FORGOT_PASSWORD_PER_MINUTE
        if path.startswith("/api/v1/uploads"):
            return settings.RATE_LIMIT_UPLOAD_PER_MINUTE
        if self._is_payment_callback_path(path):
            return settings.RATE_LIMIT_PAYMENT_CALLBACK_PER_MINUTE
        return settings.RATE_LIMIT_DEFAULT_PER_MINUTE

    async def _build_key(self, request: Request) -> str:
        client_ip = get_client_ip(request, default="unknown")
        method = request.method.upper()
        path = request.url.path
        key_segments = [f"rl:{method}:{path}:{client_ip}"]

        if method == "POST" and path == "/api/v1/auth/login":
            login_identifier = await self._extract_login_identifier(request)
            if login_identifier:
                key_segments.append(login_identifier)

        return ":".join(key_segments)

    @staticmethod
    async def _extract_login_identifier(request: Request) -> str | None:
        content_type = request.headers.get("content-type", "")
        if "application/json" not in content_type.lower():
            return None

        try:
            body = await request.body()
        except Exception:
            return None

        if not body:
            return None

        try:
            payload = json.loads(body)
        except (TypeError, ValueError):
            return None

        if not isinstance(payload, dict):
            return None

        email = payload.get("email")
        if not isinstance(email, str):
            return None

        normalized_email = email.strip().lower()
        return normalized_email or None

    def _should_fail_closed(self, path: str) -> bool:
        return (
            path in self.FAIL_CLOSED_PATHS
            or path.startswith("/api/v1/uploads")
            or self._is_payment_callback_path(path)
        )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        key = await self._build_key(request)
        limit = self._resolve_limit(request.url.path)
        window_seconds = self.window_seconds

        try:
            current = redis_client.incr(key)
            if current == 1:
                redis_client.expire(key, window_seconds)

            ttl = redis_client.ttl(key)
        except Exception:
            operational_metrics.record_rate_limit_backend_failure()
            if self._should_fail_closed(request.url.path):
                payload = {
                    "error_code": "RATE_LIMIT_UNAVAILABLE",
                    "message": "Rate limiting is temporarily unavailable",
                    "detail": "Rate limiting is temporarily unavailable",
                    "timestamp": int(time.time()),
                    "path": str(request.url.path),
                }
                return JSONResponse(status_code=503, content=payload)
            return await call_next(request)

        if current > limit:
            payload = {
                "error_code": "RATE_LIMIT_EXCEEDED",
                "message": "Rate limit exceeded",
                "detail": "Rate limit exceeded",
                "timestamp": int(time.time()),
                "path": str(request.url.path),
            }
            return JSONResponse(
                status_code=429,
                content=payload,
                headers={
                    "Retry-After": str(max(ttl, 0)),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + max(ttl, 0)),
                },
            )

        response = await call_next(request)
        remaining = max(limit - current, 0)

        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + max(ttl, 0))
        return response

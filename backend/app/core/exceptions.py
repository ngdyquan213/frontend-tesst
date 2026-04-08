from __future__ import annotations

from typing import Any


class AppException(Exception):
    def __init__(
        self,
        *,
        error_code: str,
        message: str,
        status_code: int = 400,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}


class ValidationAppException(AppException):
    def __init__(
        self, message: str = "Validation failed", detail: dict[str, Any] | None = None
    ) -> None:
        super().__init__(
            error_code="VALIDATION_ERROR",
            message=message,
            status_code=400,
            detail=detail,
        )


class AuthenticationAppException(AppException):
    def __init__(
        self, message: str = "Authentication failed", detail: dict[str, Any] | None = None
    ) -> None:
        super().__init__(
            error_code="AUTHENTICATION_ERROR",
            message=message,
            status_code=401,
            detail=detail,
        )


class AuthorizationAppException(AppException):
    def __init__(
        self, message: str = "Access denied", detail: dict[str, Any] | None = None
    ) -> None:
        super().__init__(
            error_code="AUTHORIZATION_ERROR",
            message=message,
            status_code=403,
            detail=detail,
        )


class NotFoundAppException(AppException):
    def __init__(
        self, message: str = "Resource not found", detail: dict[str, Any] | None = None
    ) -> None:
        super().__init__(
            error_code="NOT_FOUND",
            message=message,
            status_code=404,
            detail=detail,
        )


class ConflictAppException(AppException):
    def __init__(
        self, message: str = "Conflict detected", detail: dict[str, Any] | None = None
    ) -> None:
        super().__init__(
            error_code="CONFLICT",
            message=message,
            status_code=409,
            detail=detail,
        )


class RateLimitAppException(AppException):
    def __init__(
        self, message: str = "Rate limit exceeded", detail: dict[str, Any] | None = None
    ) -> None:
        super().__init__(
            error_code="RATE_LIMIT_EXCEEDED",
            message=message,
            status_code=429,
            detail=detail,
        )


class ExternalServiceAppException(AppException):
    def __init__(
        self, message: str = "External service error", detail: dict[str, Any] | None = None
    ) -> None:
        super().__init__(
            error_code="EXTERNAL_SERVICE_ERROR",
            message=message,
            status_code=502,
            detail=detail,
        )

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppException


def build_error_payload(
    *,
    request: Request,
    error_code: str,
    message: str,
    detail: object | None = None,
) -> dict:
    return {
        "error_code": error_code,
        "message": message,
        "detail": message if detail is None else detail,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "path": str(request.url.path),
    }


async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_payload(
            request=request,
            error_code=exc.error_code,
            message=exc.message,
            detail=exc.detail or None,
        ),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    sanitized_errors = []
    for error in exc.errors():
        sanitized_error = dict(error)
        if "ctx" in sanitized_error and sanitized_error["ctx"]:
            sanitized_error["ctx"] = {
                key: str(value) for key, value in sanitized_error["ctx"].items()
            }
        sanitized_errors.append(sanitized_error)

    return JSONResponse(
        status_code=422,
        content=build_error_payload(
            request=request,
            error_code="REQUEST_VALIDATION_ERROR",
            message="Request validation failed",
            detail={"errors": sanitized_errors},
        ),
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    message = exc.detail if isinstance(exc.detail, str) else "HTTP error"

    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_payload(
            request=request,
            error_code="HTTP_ERROR",
            message=message,
            detail=exc.detail,
        ),
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=build_error_payload(
            request=request,
            error_code="INTERNAL_SERVER_ERROR",
            message="Internal server error",
            detail=None,
        ),
    )

from __future__ import annotations

from fastapi import Request, Response

from app.core.config import settings

ACCESS_TOKEN_COOKIE_NAME = "travelbook_access_token"  # nosec B105
REFRESH_TOKEN_COOKIE_NAME = "travelbook_refresh_token"  # nosec B105
AUTH_COOKIE_SAMESITE = "lax"
REFRESH_COOKIE_PATH = "/api/v1/auth"


def _use_secure_cookies() -> bool:
    return settings.ENVIRONMENT in {"staging", "production"}


def set_auth_cookies(response: Response, *, access_token: str, refresh_token: str) -> None:
    secure = _use_secure_cookies()

    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=secure,
        samesite=AUTH_COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite=AUTH_COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path=REFRESH_COOKIE_PATH,
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        httponly=True,
        secure=_use_secure_cookies(),
        samesite=AUTH_COOKIE_SAMESITE,
        path="/",
    )
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        httponly=True,
        secure=_use_secure_cookies(),
        samesite=AUTH_COOKIE_SAMESITE,
        path=REFRESH_COOKIE_PATH,
    )


def get_access_token_from_request(request: Request) -> str | None:
    return request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)


def get_refresh_token_from_request(request: Request) -> str | None:
    return request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from app.core.config import settings
from app.middleware.csrf_middleware import CSRFMiddleware
from app.utils.auth_cookies import ACCESS_TOKEN_COOKIE_NAME


def _build_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(CSRFMiddleware)

    @app.post("/unsafe")
    def unsafe():
        return JSONResponse({"ok": True})

    return app


def test_csrf_allows_requests_without_auth_cookie():
    app = _build_app()

    with TestClient(app) as client:
        response = client.post("/unsafe")

    assert response.status_code == 200


def test_csrf_rejects_cookie_auth_without_origin_in_staging(monkeypatch):
    app = _build_app()
    original_environment = settings.ENVIRONMENT
    original_cors = settings.CORS_ORIGINS
    original_frontend = settings.FRONTEND_BASE_URL
    monkeypatch.setattr(settings, "ENVIRONMENT", "staging")
    monkeypatch.setattr(settings, "CORS_ORIGINS", "https://app.example.com")
    monkeypatch.setattr(settings, "FRONTEND_BASE_URL", "https://app.example.com")

    try:
        with TestClient(app) as client:
            client.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "cookie-session")
            response = client.post("/unsafe")
    finally:
        monkeypatch.setattr(settings, "ENVIRONMENT", original_environment)
        monkeypatch.setattr(settings, "CORS_ORIGINS", original_cors)
        monkeypatch.setattr(settings, "FRONTEND_BASE_URL", original_frontend)

    assert response.status_code == 403
    assert response.json()["error_code"] == "CSRF_VALIDATION_FAILED"


def test_csrf_allows_trusted_origin_for_cookie_auth(monkeypatch):
    app = _build_app()
    original_environment = settings.ENVIRONMENT
    original_cors = settings.CORS_ORIGINS
    original_frontend = settings.FRONTEND_BASE_URL
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "CORS_ORIGINS", "https://app.example.com")
    monkeypatch.setattr(settings, "FRONTEND_BASE_URL", "https://app.example.com")

    try:
        with TestClient(app) as client:
            client.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "cookie-session")
            response = client.post(
                "/unsafe",
                headers={"Origin": "https://app.example.com"},
            )
    finally:
        monkeypatch.setattr(settings, "ENVIRONMENT", original_environment)
        monkeypatch.setattr(settings, "CORS_ORIGINS", original_cors)
        monkeypatch.setattr(settings, "FRONTEND_BASE_URL", original_frontend)

    assert response.status_code == 200

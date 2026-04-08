from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.metrics import operational_metrics
from app.middleware import rate_limit_middleware
from app.middleware.rate_limit_middleware import RateLimitMiddleware


def raise_redis_down(_key):
    raise RuntimeError("redis down")


def create_test_app(max_requests: int = 2, window_seconds: int = 60) -> FastAPI:
    app = FastAPI()
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=max_requests,
        window_seconds=window_seconds,
    )

    @app.get("/ping")
    def ping():
        return {"status": "ok"}

    return app


def test_rate_limit_allows_requests_within_limit():
    app = create_test_app(max_requests=2, window_seconds=60)

    with TestClient(app) as client:
        resp1 = client.get("/ping")
        resp2 = client.get("/ping")

        assert resp1.status_code == 200
        assert resp2.status_code == 200


def test_rate_limit_blocks_requests_exceeding_limit():
    app = create_test_app(max_requests=2, window_seconds=60)

    with TestClient(app) as client:
        resp1 = client.get("/ping")
        resp2 = client.get("/ping")
        resp3 = client.get("/ping")

        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp3.status_code == 429
        assert resp3.json()["detail"] == "Rate limit exceeded"


def test_rate_limit_cannot_be_bypassed_by_changing_user_agent():
    app = create_test_app(max_requests=1, window_seconds=60)

    with TestClient(app) as client:
        resp1 = client.get("/ping", headers={"user-agent": "ua-1"})
        resp2 = client.get("/ping", headers={"user-agent": "ua-2"})

        assert resp1.status_code == 200
        assert resp2.status_code == 429
        assert resp2.json()["detail"] == "Rate limit exceeded"


def test_rate_limit_fails_closed_for_sensitive_path_when_redis_is_unavailable(monkeypatch):
    app = create_test_app(max_requests=1, window_seconds=60)
    operational_metrics.reset()

    @app.post("/api/v1/auth/login")
    def login():
        return {"status": "ok"}

    monkeypatch.setattr(rate_limit_middleware.redis_client, "incr", raise_redis_down)

    with TestClient(app) as client:
        resp = client.post("/api/v1/auth/login")

    assert resp.status_code == 503
    assert resp.json()["error_code"] == "RATE_LIMIT_UNAVAILABLE"
    assert operational_metrics.snapshot()["rate_limit_backend_failures_total"] == 1


def test_rate_limit_fails_closed_for_stripe_callback_when_redis_is_unavailable(monkeypatch):
    app = create_test_app(max_requests=1, window_seconds=60)
    operational_metrics.reset()

    @app.post("/api/v1/payments/callback/stripe")
    def stripe_callback():
        return {"status": "ok"}

    monkeypatch.setattr(rate_limit_middleware.redis_client, "incr", raise_redis_down)

    with TestClient(app) as client:
        resp = client.post("/api/v1/payments/callback/stripe")

    assert resp.status_code == 503
    assert resp.json()["error_code"] == "RATE_LIMIT_UNAVAILABLE"
    assert operational_metrics.snapshot()["rate_limit_backend_failures_total"] == 1


def test_rate_limit_fails_open_for_non_sensitive_path_when_redis_is_unavailable(monkeypatch):
    app = create_test_app(max_requests=1, window_seconds=60)
    operational_metrics.reset()

    monkeypatch.setattr(rate_limit_middleware.redis_client, "incr", raise_redis_down)

    with TestClient(app) as client:
        resp = client.get("/ping")

    assert resp.status_code == 200
    assert operational_metrics.snapshot()["rate_limit_backend_failures_total"] == 1

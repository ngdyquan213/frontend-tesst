from fastapi.testclient import TestClient


def test_health_ready_returns_200_when_dependencies_are_ready(monkeypatch):
    from app import main as main_module
    from app.core.metrics import operational_metrics
    from app.core.runtime_state import runtime_task_state

    class HealthyDB:
        def execute(self, _query):
            return 1

        def close(self):
            pass

    class HealthyRedis:
        def ping(self):
            return True

    operational_metrics.reset()
    runtime_task_state.reset()
    monkeypatch.setattr(main_module, "start_runtime_maintenance_loop", lambda: (None, None))
    monkeypatch.setattr(main_module, "run_startup_checks", lambda: None)
    monkeypatch.setattr(main_module, "run_noncritical_maintenance", lambda: None)
    monkeypatch.setattr(main_module, "SessionLocal", lambda: HealthyDB())
    monkeypatch.setattr(main_module, "redis_client", HealthyRedis())
    monkeypatch.setattr(main_module, "is_storage_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_email_worker_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_notification_backend_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_malware_scan_connection_ready", lambda: True)

    class FakeOutboxService:
        def __init__(self, db):
            self.db = db

        def get_backlog_count(self):
            return 3

    monkeypatch.setattr(main_module, "OutboxService", FakeOutboxService)

    with TestClient(main_module.app) as client:
        response = client.get("/health/ready")

    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    assert response.json()["checks"] == {
        "database": True,
        "redis": True,
        "storage": True,
        "email_worker": True,
        "notification_backend": True,
        "malware_scan": True,
        "outbox": True,
        "rate_limit_backend": True,
    }
    assert response.json()["readiness_policy"]["outbox_mode"] == "best_effort"
    assert response.json()["outbox"]["backlog"] == 3
    assert response.json()["degraded_checks"] == []


def test_health_ready_returns_503_when_dependencies_are_not_ready(monkeypatch):
    from app import main as main_module
    from app.core.metrics import operational_metrics
    from app.core.runtime_state import runtime_task_state

    class BrokenDB:
        def execute(self, _query):
            raise RuntimeError("db down")

        def close(self):
            pass

    class BrokenRedis:
        def ping(self):
            raise RuntimeError("redis down")

    operational_metrics.reset()
    runtime_task_state.reset()
    monkeypatch.setattr(main_module, "start_runtime_maintenance_loop", lambda: (None, None))
    monkeypatch.setattr(main_module, "run_startup_checks", lambda: None)
    monkeypatch.setattr(main_module, "run_noncritical_maintenance", lambda: None)
    monkeypatch.setattr(main_module, "SessionLocal", lambda: BrokenDB())
    monkeypatch.setattr(main_module, "redis_client", BrokenRedis())
    monkeypatch.setattr(main_module, "is_storage_connection_ready", lambda: False)
    monkeypatch.setattr(main_module, "is_email_worker_connection_ready", lambda: False)
    monkeypatch.setattr(main_module, "is_notification_backend_connection_ready", lambda: False)
    monkeypatch.setattr(main_module, "is_malware_scan_connection_ready", lambda: False)
    monkeypatch.setattr(main_module, "OutboxService", lambda db: None)

    with TestClient(main_module.app) as client:
        response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json()["status"] == "not_ready"
    assert response.json()["checks"] == {
        "database": False,
        "redis": False,
        "storage": False,
        "email_worker": False,
        "notification_backend": False,
        "malware_scan": False,
        "outbox": False,
        "rate_limit_backend": False,
    }


def test_health_ready_degrades_when_outbox_is_best_effort(monkeypatch):
    from app import main as main_module
    from app.core.metrics import operational_metrics
    from app.core.runtime_state import runtime_task_state

    class HealthyDB:
        def execute(self, _query):
            return 1

        def close(self):
            pass

    class HealthyRedis:
        def ping(self):
            return True

    operational_metrics.reset()
    runtime_task_state.reset()
    operational_metrics.record_outbox_dispatch_result(status="skipped", reason="missing_table")

    monkeypatch.setattr(main_module, "start_runtime_maintenance_loop", lambda: (None, None))
    monkeypatch.setattr(main_module, "run_startup_checks", lambda: None)
    monkeypatch.setattr(main_module, "run_noncritical_maintenance", lambda: None)
    monkeypatch.setattr(main_module, "SessionLocal", lambda: HealthyDB())
    monkeypatch.setattr(main_module, "redis_client", HealthyRedis())
    monkeypatch.setattr(main_module, "is_storage_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_email_worker_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_notification_backend_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_malware_scan_connection_ready", lambda: True)

    class FakeOutboxService:
        def __init__(self, db):
            self.db = db

        def get_backlog_count(self):
            return 0

    monkeypatch.setattr(main_module, "OutboxService", FakeOutboxService)
    monkeypatch.setattr(main_module.settings, "OUTBOX_HEALTH_MODE", "best_effort")

    with TestClient(main_module.app) as client:
        response = client.get("/health/ready")

    assert response.status_code == 200
    assert response.json()["checks"]["outbox"] is False
    assert response.json()["degraded_checks"] == ["outbox"]


def test_health_ready_requires_outbox_when_policy_is_required(monkeypatch):
    from app import main as main_module
    from app.core.metrics import operational_metrics
    from app.core.runtime_state import runtime_task_state

    class HealthyDB:
        def execute(self, _query):
            return 1

        def close(self):
            pass

    class HealthyRedis:
        def ping(self):
            return True

    operational_metrics.reset()
    runtime_task_state.reset()
    operational_metrics.record_outbox_dispatch_result(status="failure", reason="dispatch_error")

    monkeypatch.setattr(main_module, "start_runtime_maintenance_loop", lambda: (None, None))
    monkeypatch.setattr(main_module, "run_startup_checks", lambda: None)
    monkeypatch.setattr(main_module, "run_noncritical_maintenance", lambda: None)
    monkeypatch.setattr(main_module, "SessionLocal", lambda: HealthyDB())
    monkeypatch.setattr(main_module, "redis_client", HealthyRedis())
    monkeypatch.setattr(main_module, "is_storage_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_email_worker_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_notification_backend_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_malware_scan_connection_ready", lambda: True)

    class FakeOutboxService:
        def __init__(self, db):
            self.db = db

        def get_backlog_count(self):
            return 5

    monkeypatch.setattr(main_module, "OutboxService", FakeOutboxService)
    monkeypatch.setattr(main_module.settings, "OUTBOX_HEALTH_MODE", "required")

    with TestClient(main_module.app) as client:
        response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json()["checks"]["outbox"] is False
    assert response.json()["readiness_policy"]["outbox_mode"] == "required"


def test_metrics_endpoint_returns_operational_snapshot(monkeypatch):
    from app import main as main_module
    from app.core.metrics import operational_metrics

    class FakeDB:
        def close(self):
            pass

    operational_metrics.reset()
    operational_metrics.record_request(status_code=200)
    operational_metrics.record_request(status_code=500)
    operational_metrics.record_payment_callback_failure(reason="invalid_signature")
    operational_metrics.record_outbox_dispatch_result(status="failure", reason="dispatch_error")
    operational_metrics.record_rate_limit_backend_failure()

    monkeypatch.setattr(main_module, "start_runtime_maintenance_loop", lambda: (None, None))
    monkeypatch.setattr(main_module, "run_startup_checks", lambda: None)
    monkeypatch.setattr(main_module, "run_noncritical_maintenance", lambda: None)
    monkeypatch.setattr(main_module, "SessionLocal", lambda: FakeDB())
    monkeypatch.setattr(main_module, "is_email_worker_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_notification_backend_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_malware_scan_connection_ready", lambda: True)

    class FakeOutboxService:
        def __init__(self, db):
            self.db = db

        def get_backlog_count(self):
            return 7

    monkeypatch.setattr(main_module, "OutboxService", FakeOutboxService)

    with TestClient(main_module.app) as client:
        response = client.get("/metrics")

    assert response.status_code == 200
    assert response.json()["http_requests_total"] == 2
    assert response.json()["http_error_responses_total"] == 1
    assert response.json()["payment_callback_failures_total"] == 1
    assert response.json()["payment_callback_failures_by_reason"] == {
        "invalid_signature": 1
    }
    assert response.json()["outbox_backlog"] == 7
    assert response.json()["outbox_dispatch_failures_total"] == 1
    assert response.json()["outbox_dispatch_failures_by_reason"] == {"dispatch_error": 1}
    assert response.json()["outbox_last_dispatch_status"] == "failure"
    assert response.json()["rate_limit_backend_failures_total"] == 1


def test_prometheus_metrics_endpoint_returns_text_snapshot(monkeypatch):
    from app import main as main_module
    from app.core.metrics import operational_metrics
    from app.core.runtime_state import runtime_task_state

    class FakeDB:
        def execute(self, _query):
            return 1

        def close(self):
            pass

    class HealthyRedis:
        def ping(self):
            return True

    operational_metrics.reset()
    runtime_task_state.reset()
    operational_metrics.record_request(status_code=200)
    operational_metrics.record_payment_callback_failure(reason="invalid_signature")
    operational_metrics.record_outbox_dispatch_result(status="success")
    runtime_task_state.mark_started("process_outbox_events")
    runtime_task_state.mark_success("process_outbox_events")

    monkeypatch.setattr(main_module, "start_runtime_maintenance_loop", lambda: (None, None))
    monkeypatch.setattr(main_module, "run_startup_checks", lambda: None)
    monkeypatch.setattr(main_module, "run_noncritical_maintenance", lambda: None)
    monkeypatch.setattr(main_module, "SessionLocal", lambda: FakeDB())
    monkeypatch.setattr(main_module, "redis_client", HealthyRedis())
    monkeypatch.setattr(main_module, "is_storage_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_email_worker_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_notification_backend_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_malware_scan_connection_ready", lambda: True)

    class FakeOutboxService:
        def __init__(self, db):
            self.db = db

        def get_backlog_count(self):
            return 4

    monkeypatch.setattr(main_module, "OutboxService", FakeOutboxService)

    with TestClient(main_module.app) as client:
        response = client.get("/metrics/prometheus")

    body = response.text
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert (
        'secure_travel_app_info{environment="development",service="Secure Travel Booking '
        'Platform"} 1' in body
    )
    assert "secure_travel_dependency_ready" in body
    assert 'dependency="redis"' in body
    assert "secure_travel_outbox_backlog" in body
    assert (
        'secure_travel_runtime_task_healthy{environment="development",service="Secure '
        'Travel Booking Platform",task="process_outbox_events"} 1' in body
    )
    assert (
        'secure_travel_payment_callback_failures_by_reason_total{environment="development",'
        'reason="invalid_signature",service="Secure Travel Booking Platform"} 1' in body
    )


def test_health_ready_returns_503_when_email_worker_is_not_ready(monkeypatch):
    from app import main as main_module
    from app.core.metrics import operational_metrics
    from app.core.runtime_state import runtime_task_state

    class HealthyDB:
        def execute(self, _query):
            return 1

        def close(self):
            pass

    class HealthyRedis:
        def ping(self):
            return True

    operational_metrics.reset()
    runtime_task_state.reset()
    monkeypatch.setattr(main_module, "start_runtime_maintenance_loop", lambda: (None, None))
    monkeypatch.setattr(main_module, "run_startup_checks", lambda: None)
    monkeypatch.setattr(main_module, "run_noncritical_maintenance", lambda: None)
    monkeypatch.setattr(main_module, "SessionLocal", lambda: HealthyDB())
    monkeypatch.setattr(main_module, "redis_client", HealthyRedis())
    monkeypatch.setattr(main_module, "is_storage_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_email_worker_connection_ready", lambda: False)
    monkeypatch.setattr(main_module, "is_notification_backend_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_malware_scan_connection_ready", lambda: True)

    class FakeOutboxService:
        def __init__(self, db):
            self.db = db

        def get_backlog_count(self):
            return 0

    monkeypatch.setattr(main_module, "OutboxService", FakeOutboxService)

    with TestClient(main_module.app) as client:
        response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json()["checks"]["email_worker"] is False


def test_health_ready_denies_unallowlisted_observability_request(monkeypatch):
    from app import main as main_module
    from app.core.metrics import operational_metrics
    from app.core.runtime_state import runtime_task_state

    class HealthyDB:
        def execute(self, _query):
            return 1

        def close(self):
            pass

    class HealthyRedis:
        def ping(self):
            return True

    operational_metrics.reset()
    runtime_task_state.reset()
    monkeypatch.setattr(main_module, "start_runtime_maintenance_loop", lambda: (None, None))
    monkeypatch.setattr(main_module, "run_startup_checks", lambda: None)
    monkeypatch.setattr(main_module, "run_noncritical_maintenance", lambda: None)
    monkeypatch.setattr(main_module, "SessionLocal", lambda: HealthyDB())
    monkeypatch.setattr(main_module, "redis_client", HealthyRedis())
    monkeypatch.setattr(main_module, "is_storage_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_email_worker_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_notification_backend_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_malware_scan_connection_ready", lambda: True)
    monkeypatch.setattr(main_module.settings, "OBSERVABILITY_PROTECTION_MODE", "allowlist")
    monkeypatch.setattr(main_module.settings, "OBSERVABILITY_ALLOWLIST", "203.0.113.10/32")

    class FakeOutboxService:
        def __init__(self, db):
            self.db = db

        def get_backlog_count(self):
            return 1

    monkeypatch.setattr(main_module, "OutboxService", FakeOutboxService)

    with TestClient(main_module.app, client=("198.51.100.20", 50000)) as client:
        response = client.get("/health/ready")

    assert response.status_code == 403
    assert response.json()["detail"] == "Access denied"


def test_prometheus_metrics_allow_proxy_forwarded_ip_in_observability_allowlist(monkeypatch):
    from app import main as main_module
    from app.core.metrics import operational_metrics
    from app.core.runtime_state import runtime_task_state

    class FakeDB:
        def execute(self, _query):
            return 1

        def close(self):
            pass

    class HealthyRedis:
        def ping(self):
            return True

    operational_metrics.reset()
    runtime_task_state.reset()
    operational_metrics.record_request(status_code=200)
    monkeypatch.setattr(main_module, "start_runtime_maintenance_loop", lambda: (None, None))
    monkeypatch.setattr(main_module, "run_startup_checks", lambda: None)
    monkeypatch.setattr(main_module, "run_noncritical_maintenance", lambda: None)
    monkeypatch.setattr(main_module, "SessionLocal", lambda: FakeDB())
    monkeypatch.setattr(main_module, "redis_client", HealthyRedis())
    monkeypatch.setattr(main_module, "is_storage_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_email_worker_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_notification_backend_connection_ready", lambda: True)
    monkeypatch.setattr(main_module, "is_malware_scan_connection_ready", lambda: True)
    monkeypatch.setattr(main_module.settings, "OBSERVABILITY_PROTECTION_MODE", "allowlist")
    monkeypatch.setattr(main_module.settings, "OBSERVABILITY_ALLOWLIST", "203.0.113.10/32")

    class FakeOutboxService:
        def __init__(self, db):
            self.db = db

        def get_backlog_count(self):
            return 2

    monkeypatch.setattr(main_module, "OutboxService", FakeOutboxService)

    with TestClient(main_module.app, client=("127.0.0.1", 50000)) as client:
        response = client.get(
            "/metrics/prometheus",
            headers={"x-forwarded-for": "203.0.113.10"},
        )

    assert response.status_code == 200
    assert "secure_travel_app_info" in response.text

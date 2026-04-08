import logging

from app.core.logging import configure_logging


def test_log_startup_summary_redacts_connection_credentials(monkeypatch):
    from app.core import startup as startup_module

    monkeypatch.setattr(
        startup_module.settings,
        "DATABASE_URL",
        "postgresql+psycopg2://stage_user:super-secret-db-password@postgres:5432/app_db",
    )
    monkeypatch.setattr(
        startup_module.settings,
        "REDIS_URL",
        "redis://:super-secret-redis-password@redis:6379/0",
    )

    events: list[tuple[str, dict | None]] = []

    def capture_info(message, *args, **kwargs):
        events.append((message % args if args else message, kwargs.get("extra")))

    monkeypatch.setattr(startup_module.logger, "info", capture_info)

    startup_module.log_startup_summary()

    assert events
    message, extra = events[-1]
    assert message == "startup_summary"
    assert extra is not None
    structured_data = extra["structured_data"]
    log_output = " ".join(
        str(value) for value in structured_data.values() if value is not None
    )
    assert "super-secret-db-password" not in log_output
    assert "super-secret-redis-password" not in log_output
    assert structured_data["database_url"] == "postgresql+psycopg2://stage_user:***@postgres:5432/app_db"
    assert structured_data["redis_url"] == "redis://:***@redis:6379/0"


def test_configure_logging_disables_uvicorn_log_propagation():
    configure_logging(debug=False)

    assert logging.getLogger("uvicorn").propagate is False
    assert logging.getLogger("uvicorn.access").propagate is False
    assert logging.getLogger("uvicorn.error").propagate is False

from app.api.dependencies.service_registry import ServiceRegistry
from app.services import outbox_service as outbox_module
from app.workers.email_worker import MockEmailWorker, SMTPEmailWorker
from app.workers.notification_worker import MockNotificationWorker, RedisNotificationWorker


def test_service_registry_uses_mock_workers_by_default(db_session):
    registry = ServiceRegistry(db_session)

    assert isinstance(registry.email_worker, MockEmailWorker)
    assert isinstance(registry.notification_worker, MockNotificationWorker)


def test_service_registry_uses_real_workers_when_backends_are_configured(db_session, monkeypatch):
    from app.api.dependencies import service_registry as registry_module

    monkeypatch.setattr(registry_module.settings, "EMAIL_WORKER_BACKEND", "smtp")
    monkeypatch.setattr(registry_module.settings, "SMTP_HOST", "smtp.internal")
    monkeypatch.setattr(registry_module.settings, "SMTP_PORT", 587)
    monkeypatch.setattr(registry_module.settings, "SMTP_USERNAME", "mailer")
    monkeypatch.setattr(registry_module.settings, "SMTP_PASSWORD", "secret")
    monkeypatch.setattr(registry_module.settings, "SMTP_FROM_EMAIL", "no-reply@example.com")
    monkeypatch.setattr(registry_module.settings, "SMTP_USE_TLS", True)
    monkeypatch.setattr(registry_module.settings, "SMTP_TIMEOUT_SECONDS", 10)
    monkeypatch.setattr(registry_module.settings, "NOTIFICATION_WORKER_BACKEND", "redis")
    monkeypatch.setattr(
        registry_module.settings,
        "NOTIFICATION_REDIS_CHANNEL",
        "secure_travel.notifications",
    )

    registry = ServiceRegistry(db_session)

    assert isinstance(registry.email_worker, SMTPEmailWorker)
    assert isinstance(registry.notification_worker, RedisNotificationWorker)


def test_process_outbox_events_uses_worker_factories(monkeypatch):
    created = {"email": None, "notification": None}

    class FakeEmailWorker:
        pass

    class FakeNotificationWorker:
        pass

    class FakeOutboxService:
        def __init__(self, *, db, email_worker, notification_worker):
            created["email"] = email_worker
            created["notification"] = notification_worker

        def dispatch_due_events_best_effort(self, *, limit=None):
            return 7

    monkeypatch.setattr(outbox_module, "create_email_worker", lambda: FakeEmailWorker())
    monkeypatch.setattr(
        outbox_module,
        "create_notification_worker",
        lambda: FakeNotificationWorker(),
    )
    monkeypatch.setattr(outbox_module, "OutboxService", FakeOutboxService)

    processed = outbox_module.process_outbox_events(object(), limit=3)

    assert processed == 7
    assert isinstance(created["email"], FakeEmailWorker)
    assert isinstance(created["notification"], FakeNotificationWorker)

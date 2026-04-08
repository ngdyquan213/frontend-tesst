from __future__ import annotations

from app.core.config import settings
from app.core.redis import redis_client
from app.workers.email_worker import EmailWorker, MockEmailWorker, SMTPEmailWorker
from app.workers.notification_worker import (
    MockNotificationWorker,
    NotificationWorker,
    RedisNotificationWorker,
)


def create_email_worker() -> EmailWorker:
    if settings.EMAIL_WORKER_BACKEND == "smtp":
        return SMTPEmailWorker(
            host=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            from_email=settings.SMTP_FROM_EMAIL,
            use_tls=settings.SMTP_USE_TLS,
            timeout_seconds=settings.SMTP_TIMEOUT_SECONDS,
        )

    return MockEmailWorker()


def create_notification_worker() -> NotificationWorker:
    if settings.NOTIFICATION_WORKER_BACKEND == "redis":
        return RedisNotificationWorker(
            redis_client=redis_client,
            channel=settings.NOTIFICATION_REDIS_CHANNEL,
        )

    return MockNotificationWorker()

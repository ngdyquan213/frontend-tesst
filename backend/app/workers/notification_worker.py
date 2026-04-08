import json
import logging
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger("app.worker.notification")


@dataclass
class NotificationEvent:
    event_type: str
    channel: str
    payload: dict[str, Any]


class NotificationWorker:
    def dispatch(self, event: NotificationEvent) -> None:
        logger.info(
            "notification_dispatch_mock | event_type=%s channel=%s payload=%s",
            event.event_type,
            event.channel,
            event.payload,
        )

    def notify_booking_created(
        self,
        *,
        user_id: str,
        booking_id: str,
        booking_code: str,
    ) -> None:
        self.dispatch(
            NotificationEvent(
                event_type="booking_created",
                channel="internal_log",
                payload={
                    "user_id": user_id,
                    "booking_id": booking_id,
                    "booking_code": booking_code,
                },
            )
        )


class MockNotificationWorker(NotificationWorker):
    pass


class RedisNotificationWorker(NotificationWorker):
    def __init__(self, *, redis_client, channel: str) -> None:
        self.redis_client = redis_client
        self.channel = channel

    def dispatch(self, event: NotificationEvent) -> None:
        payload = {
            "event_type": event.event_type,
            "channel": event.channel,
            "payload": event.payload,
        }
        published = self.redis_client.publish(self.channel, json.dumps(payload, default=str))
        logger.info(
            "notification_dispatch_real | backend=redis pubsub_channel=%s event_type=%s "
            "published=%s",
            self.channel,
            event.event_type,
            published,
        )

    def notify_payment_success(
        self,
        *,
        user_id: str | None,
        payment_id: str,
        booking_id: str,
    ) -> None:
        self.dispatch(
            NotificationEvent(
                event_type="payment_success",
                channel="internal_log",
                payload={
                    "user_id": user_id,
                    "payment_id": payment_id,
                    "booking_id": booking_id,
                },
            )
        )

    def notify_security_alert(
        self,
        *,
        severity: str,
        title: str,
        details: dict[str, Any],
    ) -> None:
        self.dispatch(
            NotificationEvent(
                event_type="security_alert",
                channel="internal_log",
                payload={
                    "severity": severity,
                    "title": title,
                    "details": details,
                },
            )
        )

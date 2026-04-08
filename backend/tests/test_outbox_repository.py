from datetime import datetime, timedelta, timezone

from app.models.system import OutboxEvent
from app.repositories.outbox_repository import OutboxRepository


def test_claim_due_events_uses_skip_locked_and_sets_lease():
    class FakeQuery:
        def __init__(self, events):
            self.events = events
            self.skip_locked = None
            self.limit_value = None

        def filter(self, *args):
            return self

        def order_by(self, *args):
            return self

        def with_for_update(self, *, skip_locked=False):
            self.skip_locked = skip_locked
            return self

        def limit(self, value):
            self.limit_value = value
            return self

        def all(self):
            return self.events

    class FakeSession:
        def __init__(self, events):
            self.query_obj = FakeQuery(events)
            self.flushed = False

        def query(self, _model):
            return self.query_obj

        def flush(self):
            self.flushed = True

    event = OutboxEvent(
        target="email",
        handler="send_welcome_email",
        payload={"to_email": "test@example.com"},
        status="pending",
        attempt_count=0,
        available_at=datetime.now(timezone.utc),
    )
    session = FakeSession([event])
    repo = OutboxRepository(session)
    now = datetime.now(timezone.utc)
    lease_until = now + timedelta(seconds=30)

    claimed = repo.claim_due_events(
        now=now,
        limit=5,
        lease_expires_at=lease_until,
        claimed_by="processor-1",
    )

    assert len(claimed) == 1
    assert claimed[0].claim_token == event.claim_token
    assert event.status == "processing"
    assert event.claimed_by == "processor-1"
    assert event.processing_started_at == now
    assert event.lease_expires_at == lease_until
    assert session.query_obj.skip_locked is True
    assert session.query_obj.limit_value == 5
    assert session.flushed is True

from types import SimpleNamespace

from app.services.user_service import UserService


def test_get_my_profile_logs_audit_and_commits():
    class FakeDB:
        def __init__(self):
            self.committed = False
            self.rolled_back = False

        def commit(self):
            self.committed = True

        def rollback(self):
            self.rolled_back = True

    class FakeAuditService:
        def __init__(self):
            self.calls = []

        def log_action(self, **kwargs):
            self.calls.append(kwargs)

    db = FakeDB()
    audit_service = FakeAuditService()
    service = UserService(db=db, audit_service=audit_service)
    current_user = SimpleNamespace(id="user-1")

    result = service.get_my_profile(
        current_user=current_user,
        ip_address="203.0.113.1",
        user_agent="pytest",
    )

    assert result is current_user
    assert db.committed is True
    assert db.rolled_back is False
    assert audit_service.calls[0]["action"] == "user_profile_viewed"
    assert audit_service.calls[0]["metadata"] == {"endpoint": "/users/me"}


def test_get_my_profile_rolls_back_when_audit_fails():
    class FakeDB:
        def __init__(self):
            self.committed = False
            self.rolled_back = False

        def commit(self):
            self.committed = True

        def rollback(self):
            self.rolled_back = True

    class FakeAuditService:
        def log_action(self, **kwargs):
            raise RuntimeError("audit failed")

    db = FakeDB()
    service = UserService(db=db, audit_service=FakeAuditService())

    try:
        service.get_my_profile(current_user=SimpleNamespace(id="user-1"))
    except RuntimeError as exc:
        assert str(exc) == "audit failed"
    else:
        raise AssertionError("expected RuntimeError")

    assert db.committed is False
    assert db.rolled_back is True

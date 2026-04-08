import pytest


def test_ensure_local_directories_creates_upload_dir(monkeypatch, tmp_path):
    from app.core import startup as startup_module

    target_dir = tmp_path / "uploads_guard_test"
    monkeypatch.setattr(startup_module.settings, "LOCAL_UPLOAD_DIR", str(target_dir))

    assert not target_dir.exists()

    startup_module.ensure_local_directories()

    assert target_dir.exists()
    assert target_dir.is_dir()


def test_check_database_connection_ok(monkeypatch):
    from app.core import startup as startup_module

    class FakeDB:
        def execute(self, _query):
            return 1

        def close(self):
            pass

    monkeypatch.setattr(startup_module, "SessionLocal", lambda: FakeDB())

    startup_module.check_database_connection()


def test_check_database_connection_fail(monkeypatch):
    from app.core import startup as startup_module

    class FakeDB:
        def execute(self, _query):
            raise RuntimeError("db down")

        def close(self):
            pass

    monkeypatch.setattr(startup_module, "SessionLocal", lambda: FakeDB())

    with pytest.raises(RuntimeError, match="Database connection check failed"):
        startup_module.check_database_connection()


def test_check_redis_connection_ok(monkeypatch):
    from app.core import startup as startup_module

    class FakeRedis:
        def ping(self):
            return True

    monkeypatch.setattr(startup_module, "redis_client", FakeRedis())

    startup_module.check_redis_connection()


def test_check_redis_connection_fail(monkeypatch):
    from app.core import startup as startup_module

    class FakeRedis:
        def ping(self):
            raise RuntimeError("redis down")

    monkeypatch.setattr(startup_module, "redis_client", FakeRedis())

    with pytest.raises(RuntimeError, match="Redis connection check failed"):
        startup_module.check_redis_connection()


def test_check_storage_connection_ok(monkeypatch):
    from app.core import startup as startup_module

    monkeypatch.setattr(startup_module, "is_storage_connection_ready", lambda: True)

    startup_module.check_storage_connection()


def test_check_storage_connection_fail(monkeypatch):
    from app.core import startup as startup_module

    monkeypatch.setattr(startup_module, "is_storage_connection_ready", lambda: False)

    with pytest.raises(RuntimeError, match="Storage connection check failed"):
        startup_module.check_storage_connection()


def test_run_startup_checks_runs_all(monkeypatch):
    from app.core import startup as startup_module

    called = {
        "summary": False,
        "dirs": False,
        "storage": False,
        "db": False,
        "redis": False,
        "email": False,
        "notification": False,
        "malware": False,
    }

    monkeypatch.setattr(
        startup_module, "log_startup_summary", lambda: called.__setitem__("summary", True)
    )
    monkeypatch.setattr(
        startup_module, "ensure_local_directories", lambda: called.__setitem__("dirs", True)
    )
    monkeypatch.setattr(
        startup_module, "check_storage_connection", lambda: called.__setitem__("storage", True)
    )
    monkeypatch.setattr(
        startup_module, "check_database_connection", lambda: called.__setitem__("db", True)
    )
    monkeypatch.setattr(
        startup_module, "check_redis_connection", lambda: called.__setitem__("redis", True)
    )
    monkeypatch.setattr(
        startup_module,
        "check_email_worker_connection",
        lambda: called.__setitem__("email", True),
    )
    monkeypatch.setattr(
        startup_module,
        "check_notification_backend_connection",
        lambda: called.__setitem__("notification", True),
    )
    monkeypatch.setattr(
        startup_module,
        "check_malware_scan_connection",
        lambda: called.__setitem__("malware", True),
    )

    startup_module.run_startup_checks()

    assert called == {
        "summary": True,
        "dirs": True,
        "storage": True,
        "db": True,
        "redis": True,
        "email": True,
        "notification": True,
        "malware": True,
    }

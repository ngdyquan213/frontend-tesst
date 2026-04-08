import asyncio

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

    startup_module.run_startup_checks()

    assert called == {
        "summary": True,
        "dirs": True,
        "storage": True,
        "db": True,
        "redis": True,
    }


def test_run_noncritical_maintenance_continues_on_failure(monkeypatch):
    from app.core import runtime_tasks as runtime_module
    from app.core.runtime_state import runtime_task_state

    called = {
        "cleanup": False,
        "outbox": False,
    }
    runtime_task_state.reset()

    def fail_cleanup():
        called["cleanup"] = True
        raise RuntimeError("cleanup failed")

    def process_outbox():
        called["outbox"] = True

    monkeypatch.setattr(runtime_module, "cleanup_refresh_tokens", fail_cleanup)
    monkeypatch.setattr(runtime_module, "_process_outbox_events", process_outbox)

    runtime_module.run_noncritical_maintenance()

    assert called == {
        "cleanup": True,
        "outbox": True,
    }
    snapshot = runtime_task_state.snapshot()
    assert snapshot["cleanup_refresh_tokens"]["status"] == "failed"
    assert snapshot["process_outbox_events"]["status"] == "ok"


def test_run_noncritical_maintenance_loop_retries_until_stopped():
    from app.core import runtime_tasks as runtime_module

    calls = {"count": 0}

    async def exercise_loop():
        stop_event = asyncio.Event()

        def fake_run():
            calls["count"] += 1
            if calls["count"] >= 2:
                stop_event.set()

        await runtime_module.run_noncritical_maintenance_loop(
            stop_event=stop_event,
            interval_seconds=0.01,
            run_maintenance=fake_run,
        )

    asyncio.run(exercise_loop())

    assert calls["count"] == 2


def test_run_noncritical_maintenance_loop_can_skip_immediate_run():
    from app.core import runtime_tasks as runtime_module

    calls = {"count": 0}

    async def exercise_loop():
        stop_event = asyncio.Event()

        def fake_run():
            calls["count"] += 1
        task = asyncio.create_task(
            runtime_module.run_noncritical_maintenance_loop(
                stop_event=stop_event,
                interval_seconds=10,
                run_immediately=False,
                run_maintenance=fake_run,
            )
        )
        await asyncio.sleep(0.01)
        stop_event.set()
        await task

    asyncio.run(exercise_loop())

    assert calls["count"] == 0

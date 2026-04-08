def test_run_startup_checks_warns_for_env_secret_source_in_staging(monkeypatch):
    from app.core import startup as startup_module

    warnings: list[tuple[str, dict | None]] = []

    monkeypatch.setattr(startup_module.settings, "ENVIRONMENT", "staging")
    monkeypatch.setattr(startup_module.settings, "SECRET_SOURCE", "env")
    monkeypatch.setattr(
        startup_module.logger,
        "warning",
        lambda message, *args, **kwargs: warnings.append(
            (message % args if args else message, kwargs.get("extra"))
        ),
    )
    monkeypatch.setattr(startup_module, "log_startup_summary", lambda: None)
    monkeypatch.setattr(startup_module, "ensure_local_directories", lambda: None)
    monkeypatch.setattr(startup_module, "check_storage_connection", lambda: None)
    monkeypatch.setattr(startup_module, "check_database_connection", lambda: None)
    monkeypatch.setattr(startup_module, "check_redis_connection", lambda: None)
    monkeypatch.setattr(startup_module, "check_email_worker_connection", lambda: None)
    monkeypatch.setattr(startup_module, "check_notification_backend_connection", lambda: None)
    monkeypatch.setattr(startup_module, "check_malware_scan_connection", lambda: None)

    startup_module.run_startup_checks()

    assert warnings
    assert warnings[-1][0] == "startup_secret_source_env_warning"
    assert warnings[-1][1]["structured_data"]["environment"] == "staging"


def test_is_storage_connection_ready_local_creates_directory(monkeypatch, tmp_path):
    from app.core import startup as startup_module

    target = tmp_path / "storage-ready"
    monkeypatch.setattr(startup_module.settings, "STORAGE_BACKEND", "local")
    monkeypatch.setattr(startup_module.settings, "LOCAL_UPLOAD_DIR", str(target))

    assert startup_module.is_storage_connection_ready() is True
    assert target.exists()
    assert target.is_dir()


def test_is_storage_connection_ready_s3_checks_bucket(monkeypatch):
    from app.core import startup as startup_module

    class FakeStorageService:
        backend = "s3"

        def _s3_client(self):
            class FakeClient:
                def head_bucket(self, *, Bucket):
                    assert Bucket == "bucket-1"

            return FakeClient()

    monkeypatch.setattr(startup_module.settings, "S3_BUCKET_NAME", "bucket-1")
    monkeypatch.setattr(startup_module, "StorageService", FakeStorageService)

    assert startup_module.is_storage_connection_ready() is True

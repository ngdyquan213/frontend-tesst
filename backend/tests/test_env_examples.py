from pathlib import Path

from scripts.release_preflight import parse_env_file


def test_staging_env_example_exists_and_exposes_expected_profile():
    env = parse_env_file(Path(__file__).resolve().parents[1] / ".env.staging.example")

    assert env["ENVIRONMENT"] == "staging"
    assert env["DEBUG"] == "false"
    assert env["EMAIL_WORKER_BACKEND"] == "smtp"
    assert env["NOTIFICATION_WORKER_BACKEND"] == "redis"
    assert env["OBSERVABILITY_PROTECTION_MODE"] == "allowlist"
    assert env["OUTBOX_HEALTH_MODE"] == "required"


def test_production_env_example_exists_and_exposes_expected_profile():
    env = parse_env_file(Path(__file__).resolve().parents[1] / ".env.production.example")

    assert env["ENVIRONMENT"] == "production"
    assert env["DEBUG"] == "false"
    assert env["SECRET_SOURCE"] == "secret_manager"
    assert env["STORAGE_BACKEND"] == "s3"
    assert env["EMAIL_WORKER_BACKEND"] == "smtp"
    assert env["NOTIFICATION_WORKER_BACKEND"] == "redis"
    assert env["OBSERVABILITY_PROTECTION_MODE"] == "allowlist"
    assert env["OUTBOX_HEALTH_MODE"] == "required"

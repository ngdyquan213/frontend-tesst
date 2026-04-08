from pathlib import Path

from scripts.release_preflight import evaluate_release_preflight, parse_env_file


def test_parse_env_file_reads_key_values(tmp_path: Path):
    env_file = tmp_path / ".env.production"
    env_file.write_text(
        "\n".join(
            [
                "ENVIRONMENT=production",
                "DEBUG=false",
                "SECRET_SOURCE=secret_manager",
            ]
        ),
        encoding="utf-8",
    )

    values = parse_env_file(env_file)

    assert values["ENVIRONMENT"] == "production"
    assert values["DEBUG"] == "false"
    assert values["SECRET_SOURCE"] == "secret_manager"


def test_release_preflight_accepts_valid_production_config(tmp_path: Path):
    certs_dir = tmp_path / "infra" / "nginx" / "certs"
    certs_dir.mkdir(parents=True)
    env = {
        "ENVIRONMENT": "production",
        "DEBUG": "false",
        "SECRET_SOURCE": "secret_manager",
        "SECRET_MANAGER_PROVIDER": "aws-secrets-manager",
        "SECRET_MANAGER_SECRET_ID": "secure-travel-booking/production/app",
        "SECRET_MANAGER_AWS_REGION": "ap-southeast-1",
        "DATABASE_URL": "postgresql+psycopg2://user:very-secret@db.internal:5432/app",
        "REDIS_URL": "redis://redis.internal:6379/0",
        "SECRET_KEY": "prod-real-secret-key-abcdefghijklmnopqrstuvwxyz",
        "PAYMENT_CALLBACK_SECRET": "prod-payment-secret-abcdefghijklmnopqrstuvwxyz",
        "TRUSTED_HOSTS": "api.internal.example,app,app:8000",
        "OBSERVABILITY_PROTECTION_MODE": "allowlist",
        "OBSERVABILITY_ALLOWLIST": "10.40.0.0/16",
        "PAYMENT_CALLBACK_SOURCE_ALLOWLIST": "10.30.0.0/16",
        "FORWARDED_ALLOW_IPS": "10.20.0.0/16",
        "EMAIL_WORKER_BACKEND": "smtp",
        "SMTP_HOST": "smtp.internal",
        "SMTP_FROM_EMAIL": "no-reply@internal.example",
        "NOTIFICATION_WORKER_BACKEND": "redis",
        "NOTIFICATION_REDIS_CHANNEL": "secure_travel.notifications.production",
        "STORAGE_BACKEND": "s3",
        "S3_BUCKET_NAME": "secure-travel-prod",
        "S3_REGION": "ap-southeast-1",
        "S3_ACCESS_KEY_ID": "AKIAREALSECRET",
        "S3_SECRET_ACCESS_KEY": "this-is-a-real-looking-secret-value",
        "ALLOW_PAYMENT_SIMULATION": "false",
        "OUTBOX_HEALTH_MODE": "required",
        "NGINX_TLS_ENABLED": "true",
        "NGINX_CERTS_DIR": "infra/nginx/certs",
        "NGINX_SERVER_NAME": "api.internal.example",
    }

    errors = evaluate_release_preflight(
        env,
        repo_root=tmp_path,
        check_local_files=True,
    )

    assert errors == []


def test_release_preflight_rejects_placeholder_and_local_values(tmp_path: Path):
    env = {
        "ENVIRONMENT": "production",
        "DEBUG": "true",
        "SECRET_SOURCE": "env",
        "DATABASE_URL": "postgresql+psycopg2://postgres:postgres@localhost:5432/app",
        "REDIS_URL": "redis://127.0.0.1:6379/0",
        "SECRET_KEY": "production-secret-key-12345678901234567890",
        "PAYMENT_CALLBACK_SECRET": "production-payment-secret-123456",
        "TRUSTED_HOSTS": "",
        "OBSERVABILITY_PROTECTION_MODE": "disabled",
        "OBSERVABILITY_ALLOWLIST": "",
        "PAYMENT_CALLBACK_SOURCE_ALLOWLIST": "",
        "FORWARDED_ALLOW_IPS": "*",
        "EMAIL_WORKER_BACKEND": "mock",
        "NOTIFICATION_WORKER_BACKEND": "mock",
        "STORAGE_BACKEND": "local",
        "ALLOW_PAYMENT_SIMULATION": "true",
        "OUTBOX_HEALTH_MODE": "best_effort",
    }

    errors = evaluate_release_preflight(env, repo_root=tmp_path)

    assert "DEBUG must be false for production rollout" in errors
    assert "SECRET_SOURCE must be secret_manager for production rollout" in errors
    assert "DATABASE_URL must not point to localhost/127.0.0.1" in errors
    assert "REDIS_URL must not point to localhost/127.0.0.1" in errors
    assert "FORWARDED_ALLOW_IPS must not contain '*'" in errors
    assert "EMAIL_WORKER_BACKEND must be smtp" in errors
    assert "NOTIFICATION_WORKER_BACKEND must be redis" in errors
    assert "STORAGE_BACKEND must be s3 for production" in errors
    assert "ALLOW_PAYMENT_SIMULATION must be false" in errors


def test_release_preflight_requires_complete_stripe_configuration(tmp_path: Path):
    env = {
        "ENVIRONMENT": "production",
        "DEBUG": "false",
        "SECRET_SOURCE": "secret_manager",
        "SECRET_MANAGER_PROVIDER": "aws-secrets-manager",
        "SECRET_MANAGER_SECRET_ID": "secure-travel-booking/production/app",
        "SECRET_MANAGER_AWS_REGION": "ap-southeast-1",
        "DATABASE_URL": "postgresql+psycopg2://user:secret@db.internal:5432/app",
        "REDIS_URL": "redis://redis.internal:6379/0",
        "SECRET_KEY": "prod-real-secret-key-abcdefghijklmnopqrstuvwxyz",
        "PAYMENT_CALLBACK_SECRET": "prod-payment-secret-abcdefghijklmnopqrstuvwxyz",
        "TRUSTED_HOSTS": "api.internal.example",
        "OBSERVABILITY_PROTECTION_MODE": "allowlist",
        "OBSERVABILITY_ALLOWLIST": "10.40.0.0/16",
        "PAYMENT_CALLBACK_SOURCE_ALLOWLIST": "10.30.0.0/16",
        "FORWARDED_ALLOW_IPS": "10.20.0.0/16",
        "EMAIL_WORKER_BACKEND": "smtp",
        "SMTP_HOST": "smtp.internal",
        "SMTP_FROM_EMAIL": "no-reply@internal.example",
        "NOTIFICATION_WORKER_BACKEND": "redis",
        "NOTIFICATION_REDIS_CHANNEL": "secure_travel.notifications.production",
        "STORAGE_BACKEND": "s3",
        "S3_BUCKET_NAME": "secure-travel-prod",
        "S3_REGION": "ap-southeast-1",
        "S3_ACCESS_KEY_ID": "AKIAREALSECRET",
        "S3_SECRET_ACCESS_KEY": "this-is-a-real-looking-secret-value",
        "ALLOW_PAYMENT_SIMULATION": "false",
        "OUTBOX_HEALTH_MODE": "required",
        "STRIPE_SECRET_KEY": "sk_live_actual_secret",
    }

    errors = evaluate_release_preflight(env, repo_root=tmp_path)

    assert (
        "Stripe production rollout must configure STRIPE_SECRET_KEY, "
        "STRIPE_PUBLISHABLE_KEY, and STRIPE_WEBHOOK_SECRET together"
    ) in errors

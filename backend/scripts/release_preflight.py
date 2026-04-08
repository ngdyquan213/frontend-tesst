from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

PLACEHOLDER_SNIPPETS = (
    "replace_me",
    "change-me",
    "changeme",
    "example.com",
    "prod-access-key",
    "prod-secret-access-key",
    "production-secret-key-12345678901234567890",
    "production-payment-secret-123456",
    "prod-db-password-123456",
)


def parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        raise FileNotFoundError(f"Env file not found: {path}")

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("'").strip('"')
    return values


def _is_truthy(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def _contains_placeholder(value: str) -> bool:
    normalized = value.strip().lower()
    return any(snippet in normalized for snippet in PLACEHOLDER_SNIPPETS)


def _split_csv(value: str | None) -> list[str]:
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def evaluate_release_preflight(
    env: dict[str, str],
    *,
    repo_root: Path,
    check_local_files: bool = False,
) -> list[str]:
    errors: list[str] = []

    def require(key: str) -> str:
        value = env.get(key, "").strip()
        if not value:
            errors.append(f"{key} is required")
        return value

    environment = require("ENVIRONMENT")
    if environment != "production":
        errors.append("ENVIRONMENT must be production")

    if _is_truthy(env.get("DEBUG")):
        errors.append("DEBUG must be false for production rollout")

    if env.get("SECRET_SOURCE", "").strip() != "secret_manager":
        errors.append("SECRET_SOURCE must be secret_manager for production rollout")

    for key in (
        "SECRET_MANAGER_PROVIDER",
        "SECRET_MANAGER_SECRET_ID",
        "SECRET_MANAGER_AWS_REGION",
        "DATABASE_URL",
        "REDIS_URL",
        "SECRET_KEY",
        "PAYMENT_CALLBACK_SECRET",
        "TRUSTED_HOSTS",
        "OBSERVABILITY_ALLOWLIST",
        "PAYMENT_CALLBACK_SOURCE_ALLOWLIST",
        "FORWARDED_ALLOW_IPS",
        "SMTP_HOST",
        "SMTP_FROM_EMAIL",
        "NOTIFICATION_REDIS_CHANNEL",
        "S3_BUCKET_NAME",
        "S3_REGION",
        "S3_ACCESS_KEY_ID",
        "S3_SECRET_ACCESS_KEY",
    ):
        require(key)

    if env.get("EMAIL_WORKER_BACKEND", "").strip() != "smtp":
        errors.append("EMAIL_WORKER_BACKEND must be smtp")

    if env.get("NOTIFICATION_WORKER_BACKEND", "").strip() != "redis":
        errors.append("NOTIFICATION_WORKER_BACKEND must be redis")

    if env.get("STORAGE_BACKEND", "").strip() != "s3":
        errors.append("STORAGE_BACKEND must be s3 for production")

    if env.get("OBSERVABILITY_PROTECTION_MODE", "").strip() != "allowlist":
        errors.append("OBSERVABILITY_PROTECTION_MODE must be allowlist")

    if env.get("OUTBOX_HEALTH_MODE", "").strip() != "required":
        errors.append("OUTBOX_HEALTH_MODE should be required for release")

    if _is_truthy(env.get("ALLOW_PAYMENT_SIMULATION")):
        errors.append("ALLOW_PAYMENT_SIMULATION must be false")

    database_url = env.get("DATABASE_URL", "")
    if "localhost" in database_url or "127.0.0.1" in database_url:
        errors.append("DATABASE_URL must not point to localhost/127.0.0.1")

    redis_url = env.get("REDIS_URL", "")
    if "localhost" in redis_url or "127.0.0.1" in redis_url:
        errors.append("REDIS_URL must not point to localhost/127.0.0.1")

    if "*" in _split_csv(env.get("FORWARDED_ALLOW_IPS")):
        errors.append("FORWARDED_ALLOW_IPS must not contain '*'")

    if not _split_csv(env.get("TRUSTED_HOSTS")):
        errors.append("TRUSTED_HOSTS must contain at least one host")

    if not _split_csv(env.get("OBSERVABILITY_ALLOWLIST")):
        errors.append("OBSERVABILITY_ALLOWLIST must contain at least one CIDR")

    if not _split_csv(env.get("PAYMENT_CALLBACK_SOURCE_ALLOWLIST")):
        errors.append("PAYMENT_CALLBACK_SOURCE_ALLOWLIST must contain at least one CIDR")

    critical_keys = (
        "SECRET_KEY",
        "PAYMENT_CALLBACK_SECRET",
        "DATABASE_URL",
        "REDIS_URL",
        "SMTP_HOST",
        "SMTP_FROM_EMAIL",
        "S3_BUCKET_NAME",
        "S3_ACCESS_KEY_ID",
        "S3_SECRET_ACCESS_KEY",
        "SECRET_MANAGER_SECRET_ID",
        "NGINX_SERVER_NAME",
    )
    for key in critical_keys:
        value = env.get(key, "").strip()
        if value and _contains_placeholder(value):
            errors.append(f"{key} still contains a placeholder/demo value")

    stripe_secret = env.get("STRIPE_SECRET_KEY", "").strip()
    stripe_publishable = env.get("STRIPE_PUBLISHABLE_KEY", "").strip()
    stripe_webhook = env.get("STRIPE_WEBHOOK_SECRET", "").strip()
    stripe_values = [bool(stripe_secret), bool(stripe_publishable), bool(stripe_webhook)]
    if any(stripe_values) and not all(stripe_values):
        errors.append(
            "Stripe production rollout must configure STRIPE_SECRET_KEY, "
            "STRIPE_PUBLISHABLE_KEY, and STRIPE_WEBHOOK_SECRET together"
        )
    for key in ("STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"):
        value = env.get(key, "").strip()
        if value and _contains_placeholder(value):
            errors.append(f"{key} still contains a placeholder/demo value")

    if check_local_files and _is_truthy(env.get("NGINX_TLS_ENABLED")):
        certs_dir = env.get("NGINX_CERTS_DIR", "").strip()
        if certs_dir:
            certs_path = (repo_root / certs_dir).resolve()
            if not certs_path.exists():
                errors.append(f"NGINX_CERTS_DIR does not exist locally: {certs_path}")

    return errors


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run production release preflight checks.")
    parser.add_argument(
        "--env-file",
        default=os.getenv("APP_ENV_FILE", ".env.production"),
        help="Path to the production env file. Defaults to APP_ENV_FILE or .env.production.",
    )
    parser.add_argument(
        "--check-local-files",
        action="store_true",
        help="Also verify locally mounted TLS/cert paths when NGINX_TLS_ENABLED=true.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit machine-readable JSON output.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    env_file = Path(args.env_file)
    repo_root = Path(__file__).resolve().parents[1]
    try:
        env = parse_env_file(env_file)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    errors = evaluate_release_preflight(
        env,
        repo_root=repo_root,
        check_local_files=args.check_local_files,
    )

    report = {
        "env_file": str(env_file),
        "passed": not errors,
        "errors": errors,
    }
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        if errors:
            print("release_preflight: FAIL")
            for error in errors:
                print(f"- {error}")
        else:
            print("release_preflight: PASS")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())

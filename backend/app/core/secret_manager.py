from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from typing import Any

SECRET_MANAGER_BOOTSTRAP_FLAG = "SECRET_MANAGER_BOOTSTRAPPED"  # nosec B105
SUPPORTED_SECRET_MANAGER_PROVIDERS = {"aws-secrets-manager", "aws_secrets_manager"}


def _parse_env_file(path: Path) -> dict[str, str]:
    if not path.exists() or not path.is_file():
        return {}

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key:
            values[key] = value
    return values


def _coerce_secret_value(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    return str(value)


def _load_aws_secret_payload(*, secret_id: str, region_name: str | None) -> dict[str, str]:
    try:
        import boto3
    except ImportError as exc:  # pragma: no cover - boto3 is installed in this repo
        raise RuntimeError("boto3 is required when SECRET_SOURCE=secret_manager") from exc

    session = boto3.session.Session(region_name=region_name or None)
    client = session.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_id)

    if "SecretString" in response:
        secret_text = response["SecretString"]
    else:
        secret_text = base64.b64decode(response["SecretBinary"]).decode("utf-8")

    payload = json.loads(secret_text)
    if not isinstance(payload, dict):
        raise RuntimeError("Secret manager payload must be a JSON object")

    return {str(key): _coerce_secret_value(value) for key, value in payload.items()}


def load_secret_manager_environment() -> None:
    if os.environ.get(SECRET_MANAGER_BOOTSTRAP_FLAG) == "1":
        return

    env_file_path = Path(os.getenv("APP_ENV_FILE", ".env"))
    env_file_values = _parse_env_file(env_file_path)

    secret_source = os.getenv("SECRET_SOURCE") or env_file_values.get("SECRET_SOURCE", "env")
    if secret_source != "secret_manager":  # nosec B105
        os.environ[SECRET_MANAGER_BOOTSTRAP_FLAG] = "1"
        return

    provider = os.getenv("SECRET_MANAGER_PROVIDER") or env_file_values.get(
        "SECRET_MANAGER_PROVIDER",
        "",
    )
    if provider not in SUPPORTED_SECRET_MANAGER_PROVIDERS:
        raise RuntimeError(
            "Unsupported SECRET_MANAGER_PROVIDER. Supported providers: aws-secrets-manager"
        )

    secret_id = os.getenv("SECRET_MANAGER_SECRET_ID") or env_file_values.get(
        "SECRET_MANAGER_SECRET_ID",
        "",
    )
    if not secret_id:
        raise RuntimeError(
            "SECRET_MANAGER_SECRET_ID is required when SECRET_SOURCE=secret_manager"
        )

    region_name = (
        os.getenv("SECRET_MANAGER_AWS_REGION")
        or env_file_values.get("SECRET_MANAGER_AWS_REGION")
        or os.getenv("AWS_REGION")
        or os.getenv("AWS_DEFAULT_REGION")
        or env_file_values.get("AWS_REGION")
        or env_file_values.get("AWS_DEFAULT_REGION")
    )

    secrets = _load_aws_secret_payload(secret_id=secret_id, region_name=region_name)
    for key, value in secrets.items():
        os.environ[key] = value

    os.environ[SECRET_MANAGER_BOOTSTRAP_FLAG] = "1"

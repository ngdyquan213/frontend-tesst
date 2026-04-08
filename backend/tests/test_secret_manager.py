import os

import pytest

from app.core import secret_manager as secret_manager_module


def test_load_secret_manager_environment_from_env_file(monkeypatch, tmp_path):
    env_file = tmp_path / ".env.secret-manager"
    env_file.write_text(
        "\n".join(
            [
                "SECRET_SOURCE=secret_manager",
                "SECRET_MANAGER_PROVIDER=aws-secrets-manager",
                "SECRET_MANAGER_SECRET_ID=secure-travel/prod",
                "SECRET_MANAGER_AWS_REGION=ap-southeast-1",
            ]
        ),
        encoding="utf-8",
    )

    captured = {}

    def fake_load(secret_id: str, region_name: str | None):
        captured["secret_id"] = secret_id
        captured["region_name"] = region_name
        return {
            "DATABASE_URL": "postgresql+psycopg2://prod:secret@db.internal:5432/app",
            "SECRET_KEY": "this-is-a-super-strong-secret-key-123456",
        }

    monkeypatch.setenv("APP_ENV_FILE", str(env_file))
    monkeypatch.delenv(secret_manager_module.SECRET_MANAGER_BOOTSTRAP_FLAG, raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("SECRET_KEY", raising=False)
    monkeypatch.setattr(secret_manager_module, "_load_aws_secret_payload", fake_load)

    secret_manager_module.load_secret_manager_environment()

    assert captured == {
        "secret_id": "secure-travel/prod",
        "region_name": "ap-southeast-1",
    }
    assert os.environ["DATABASE_URL"] == "postgresql+psycopg2://prod:secret@db.internal:5432/app"
    assert os.environ["SECRET_KEY"] == "this-is-a-super-strong-secret-key-123456"


def test_load_secret_manager_environment_rejects_unsupported_provider(monkeypatch, tmp_path):
    env_file = tmp_path / ".env.secret-manager"
    env_file.write_text(
        "\n".join(
            [
                "SECRET_SOURCE=secret_manager",
                "SECRET_MANAGER_PROVIDER=vault",
                "SECRET_MANAGER_SECRET_ID=secure-travel/prod",
            ]
        ),
        encoding="utf-8",
    )

    monkeypatch.setenv("APP_ENV_FILE", str(env_file))
    monkeypatch.delenv(secret_manager_module.SECRET_MANAGER_BOOTSTRAP_FLAG, raising=False)

    with pytest.raises(RuntimeError, match="Unsupported SECRET_MANAGER_PROVIDER"):
        secret_manager_module.load_secret_manager_environment()

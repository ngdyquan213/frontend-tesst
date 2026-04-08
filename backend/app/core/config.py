from __future__ import annotations

from ipaddress import ip_network
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.secret_manager import load_secret_manager_environment

load_secret_manager_environment()


class Settings(BaseSettings):
    APP_NAME: str = "Secure Travel Booking Platform"
    ENVIRONMENT: Literal["development", "test", "staging", "production"] = "development"
    DEBUG: bool = True

    SECRET_KEY: str = "change-me-super-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/secure_travel_booking"
    )
    PAYMENT_CALLBACK_SECRET: str = "change-me-payment-secret"

    REDIS_URL: str = "redis://localhost:6379/0"

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    RATE_LIMIT_REGISTER_PER_MINUTE: int = 5
    RATE_LIMIT_REFRESH_PER_MINUTE: int = 20
    RATE_LIMIT_UPLOAD_PER_MINUTE: int = 20
    RATE_LIMIT_PAYMENT_CALLBACK_PER_MINUTE: int = 50
    RATE_LIMIT_DEFAULT_PER_MINUTE: int = 120
    AUTH_MAX_FAILED_LOGINS: int = 5
    AUTH_LOCKOUT_MINUTES: int = 15

    CORS_ORIGINS: str = "http://localhost,http://127.0.0.1"
    TRUSTED_HOSTS: str = "localhost,127.0.0.1,testserver"
    OBSERVABILITY_PROTECTION_MODE: Literal["disabled", "allowlist"] = "disabled"
    OBSERVABILITY_ALLOWLIST: str = ""

    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    LOCAL_UPLOAD_DIR: str = "uploads"
    LOCAL_STORAGE_BUCKET: str = "local"
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024
    S3_BUCKET_NAME: str = ""
    S3_REGION: str = ""
    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    OUTBOX_PROCESSING_BATCH_SIZE: int = 20
    OUTBOX_LEASE_SECONDS: int = 30
    OUTBOX_HEALTH_MODE: Literal["best_effort", "required"] = "best_effort"
    RUNTIME_MAINTENANCE_INTERVAL_SECONDS: int = 60
    EMAIL_WORKER_BACKEND: Literal["mock", "smtp"] = "mock"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_TIMEOUT_SECONDS: int = 10
    NOTIFICATION_WORKER_BACKEND: Literal["mock", "redis"] = "mock"
    NOTIFICATION_REDIS_CHANNEL: str = "secure_travel.notifications"
    FORWARDED_ALLOW_IPS: str = "127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
    PAYMENT_CALLBACK_SOURCE_ALLOWLIST: str = ""
    ALLOW_PAYMENT_SIMULATION: bool = False
    UPLOAD_MALWARE_SCAN_ENABLED: bool = False
    UPLOAD_MALWARE_SCAN_BACKEND: Literal["mock", "clamav"] = "mock"
    CLAMAV_HOST: str = "localhost"
    CLAMAV_PORT: int = 3310
    CLAMAV_TIMEOUT_SECONDS: int = 10
    SECRET_SOURCE: Literal["env", "secret_manager"] = "env"
    SECRET_MANAGER_PROVIDER: str = ""
    SECRET_MANAGER_SECRET_ID: str = ""
    SECRET_MANAGER_AWS_REGION: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_API_BASE_URL: str = "https://api.stripe.com/v1"
    STRIPE_REQUEST_TIMEOUT_SECONDS: int = 10
    STRIPE_WEBHOOK_TOLERANCE_SECONDS: int = 300

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "secure_travel_booking"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    @model_validator(mode="after")
    def apply_derived_defaults(self) -> Settings:
        if "DATABASE_URL" not in self.model_fields_set:
            self.DATABASE_URL = (
                f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )

        return self

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return self.DATABASE_URL

    ALLOWED_UPLOAD_EXTENSIONS: str = ".pdf,.png,.jpg,.jpeg"
    ALLOWED_UPLOAD_MIME_TYPES: str = "application/pdf,image/png,image/jpeg"

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        weak_secret_values = {
            "change-me-super-secret-key",
            "change-me-payment-secret",
            "secret",
            "changeme",
        }
        if len(value.strip()) < 32 and value not in weak_secret_values:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return value

    @field_validator("PAYMENT_CALLBACK_SECRET")
    @classmethod
    def validate_payment_callback_secret(cls, value: str) -> str:
        if len(value.strip()) < 16:
            raise ValueError("PAYMENT_CALLBACK_SECRET must be at least 16 characters")
        return value

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        allowed_prefixes = (
            "postgresql://",
            "postgresql+psycopg2://",
            "sqlite:///",
        )
        if not value.startswith(allowed_prefixes):
            raise ValueError("DATABASE_URL must be a valid SQLAlchemy database URL")
        return value

    @field_validator("REDIS_URL")
    @classmethod
    def validate_redis_url(cls, value: str) -> str:
        if not value.startswith(("redis://", "rediss://")):
            raise ValueError("REDIS_URL must start with redis:// or rediss://")
        return value

    @field_validator("TRUSTED_HOSTS")
    @classmethod
    def validate_trusted_hosts(cls, value: str) -> str:
        if not any(item.strip() for item in value.split(",")):
            raise ValueError("TRUSTED_HOSTS must not be empty")
        return value

    @field_validator("ACCESS_TOKEN_EXPIRE_MINUTES")
    @classmethod
    def validate_access_token_expire_minutes(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be > 0")
        return value

    @field_validator("REFRESH_TOKEN_EXPIRE_DAYS")
    @classmethod
    def validate_refresh_token_expire_days(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("REFRESH_TOKEN_EXPIRE_DAYS must be > 0")
        return value

    @field_validator("MAX_UPLOAD_SIZE_BYTES")
    @classmethod
    def validate_upload_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("MAX_UPLOAD_SIZE_BYTES must be > 0")
        return value

    @field_validator("OUTBOX_PROCESSING_BATCH_SIZE")
    @classmethod
    def validate_outbox_processing_batch_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("OUTBOX_PROCESSING_BATCH_SIZE must be > 0")
        return value

    @field_validator("OUTBOX_LEASE_SECONDS")
    @classmethod
    def validate_outbox_lease_seconds(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("OUTBOX_LEASE_SECONDS must be > 0")
        return value

    @field_validator("RUNTIME_MAINTENANCE_INTERVAL_SECONDS")
    @classmethod
    def validate_runtime_maintenance_interval_seconds(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("RUNTIME_MAINTENANCE_INTERVAL_SECONDS must be > 0")
        return value

    @field_validator("CLAMAV_PORT")
    @classmethod
    def validate_clamav_port(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("CLAMAV_PORT must be > 0")
        return value

    @field_validator("CLAMAV_TIMEOUT_SECONDS")
    @classmethod
    def validate_clamav_timeout_seconds(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("CLAMAV_TIMEOUT_SECONDS must be > 0")
        return value

    @field_validator("SMTP_PORT")
    @classmethod
    def validate_smtp_port(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("SMTP_PORT must be > 0")
        return value

    @field_validator("SMTP_TIMEOUT_SECONDS")
    @classmethod
    def validate_smtp_timeout_seconds(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("SMTP_TIMEOUT_SECONDS must be > 0")
        return value

    @field_validator("AUTH_MAX_FAILED_LOGINS")
    @classmethod
    def validate_auth_max_failed_logins(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("AUTH_MAX_FAILED_LOGINS must be > 0")
        return value

    @field_validator("AUTH_LOCKOUT_MINUTES")
    @classmethod
    def validate_auth_lockout_minutes(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("AUTH_LOCKOUT_MINUTES must be > 0")
        return value

    @model_validator(mode="after")
    def validate_environment_rules(self) -> Settings:
        if self.STORAGE_BACKEND == "s3":
            required_fields = (
                ("S3_BUCKET_NAME", self.S3_BUCKET_NAME),
                ("S3_REGION", self.S3_REGION),
                ("S3_ACCESS_KEY_ID", self.S3_ACCESS_KEY_ID),
                ("S3_SECRET_ACCESS_KEY", self.S3_SECRET_ACCESS_KEY),
            )
            missing = [field_name for field_name, value in required_fields if not value.strip()]
            if missing:
                raise ValueError(
                    f"Missing required S3 settings for STORAGE_BACKEND=s3: {', '.join(missing)}"
                )

        if self.EMAIL_WORKER_BACKEND == "smtp":
            required_fields = (
                ("SMTP_HOST", self.SMTP_HOST),
                ("SMTP_FROM_EMAIL", self.SMTP_FROM_EMAIL),
            )
            missing = [field_name for field_name, value in required_fields if not value.strip()]
            if missing:
                raise ValueError(
                    "Missing required SMTP settings for EMAIL_WORKER_BACKEND=smtp: "
                    + ", ".join(missing)
                )

        if not self.NOTIFICATION_REDIS_CHANNEL.strip():
            raise ValueError("NOTIFICATION_REDIS_CHANNEL must not be empty")

        for value in self.forwarded_allow_ips_list:
            if value == "*":
                continue
            ip_network(value, strict=False)

        for value in self.payment_callback_source_allowlist_list:
            ip_network(value, strict=False)

        for value in self.observability_allowlist_list:
            ip_network(value, strict=False)

        if (
            self.OBSERVABILITY_PROTECTION_MODE == "allowlist"
            and not self.observability_allowlist_list
        ):
            raise ValueError(
                "OBSERVABILITY_ALLOWLIST must not be empty when "
                "OBSERVABILITY_PROTECTION_MODE=allowlist"
            )

        if self.UPLOAD_MALWARE_SCAN_ENABLED and self.UPLOAD_MALWARE_SCAN_BACKEND == "clamav":
            if not self.CLAMAV_HOST.strip():
                raise ValueError("CLAMAV_HOST is required when malware scan backend is clamav")

        if self.SECRET_SOURCE == "secret_manager" and not self.SECRET_MANAGER_PROVIDER.strip():  # nosec B105
            raise ValueError(
                "SECRET_MANAGER_PROVIDER is required when SECRET_SOURCE=secret_manager"
            )

        if self.SECRET_SOURCE == "secret_manager" and not self.SECRET_MANAGER_SECRET_ID.strip():  # nosec B105
            raise ValueError(
                "SECRET_MANAGER_SECRET_ID is required when SECRET_SOURCE=secret_manager"
            )

        if self.STRIPE_SECRET_KEY and not self.STRIPE_WEBHOOK_SECRET.strip():
            raise ValueError(
                "STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is configured"
            )

        if self.STRIPE_REQUEST_TIMEOUT_SECONDS <= 0:
            raise ValueError("STRIPE_REQUEST_TIMEOUT_SECONDS must be > 0")

        if self.STRIPE_WEBHOOK_TOLERANCE_SECONDS <= 0:
            raise ValueError("STRIPE_WEBHOOK_TOLERANCE_SECONDS must be > 0")

        if self.ENVIRONMENT in {"staging", "production"}:
            weak_secret_values = {
                "change-me-super-secret-key",
                "change-me-payment-secret",
                "secret",
                "changeme",
            }

            if self.DEBUG:
                raise ValueError("DEBUG must be false in staging/production")

            if self.SECRET_KEY in weak_secret_values:
                raise ValueError(
                    "SECRET_KEY must not use a default/weak value in staging/production"
                )

            if self.PAYMENT_CALLBACK_SECRET in weak_secret_values:
                raise ValueError(
                    "PAYMENT_CALLBACK_SECRET must not use a default/weak value "
                    "in staging/production"
                )

            if "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL:
                raise ValueError("DATABASE_URL should not point to localhost in staging/production")

            if "localhost" in self.REDIS_URL or "127.0.0.1" in self.REDIS_URL:
                raise ValueError("REDIS_URL should not point to localhost in staging/production")

            if "*" in self.forwarded_allow_ips_list:
                raise ValueError("FORWARDED_ALLOW_IPS must not contain '*' in staging/production")

            if self.ALLOW_PAYMENT_SIMULATION:
                raise ValueError("ALLOW_PAYMENT_SIMULATION must be false in staging/production")

            if self.EMAIL_WORKER_BACKEND == "mock":
                raise ValueError(
                    "EMAIL_WORKER_BACKEND must not use 'mock' in staging/production"
                )

            if self.NOTIFICATION_WORKER_BACKEND == "mock":
                raise ValueError(
                    "NOTIFICATION_WORKER_BACKEND must not use 'mock' in staging/production"
                )

            if not self.payment_callback_source_allowlist_list:
                raise ValueError(
                    "PAYMENT_CALLBACK_SOURCE_ALLOWLIST must not be empty in staging/production"
                )

            if self.OBSERVABILITY_PROTECTION_MODE != "allowlist":
                raise ValueError(
                    "OBSERVABILITY_PROTECTION_MODE must be 'allowlist' in "
                    "staging/production"
                )

        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [item.strip() for item in self.CORS_ORIGINS.split(",") if item.strip()]

    @property
    def trusted_hosts_list(self) -> list[str]:
        return [item.strip() for item in self.TRUSTED_HOSTS.split(",") if item.strip()]

    @property
    def allowed_upload_extensions_list(self) -> list[str]:
        return [
            item.strip().lower()
            for item in self.ALLOWED_UPLOAD_EXTENSIONS.split(",")
            if item.strip()
        ]

    @property
    def allowed_upload_mime_types_list(self) -> list[str]:
        return [
            item.strip().lower()
            for item in self.ALLOWED_UPLOAD_MIME_TYPES.split(",")
            if item.strip()
        ]

    @property
    def forwarded_allow_ips_list(self) -> list[str]:
        return [item.strip() for item in self.FORWARDED_ALLOW_IPS.split(",") if item.strip()]

    @property
    def payment_callback_source_allowlist_list(self) -> list[str]:
        return [
            item.strip()
            for item in self.PAYMENT_CALLBACK_SOURCE_ALLOWLIST.split(",")
            if item.strip()
        ]

    @property
    def observability_allowlist_list(self) -> list[str]:
        return [item.strip() for item in self.OBSERVABILITY_ALLOWLIST.split(",") if item.strip()]


settings = Settings()

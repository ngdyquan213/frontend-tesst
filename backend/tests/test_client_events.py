from app.api.v1.client_events import (
    REDACTED,
    TRUNCATED,
    _sanitize_metadata,
    _sanitize_text,
)


def test_sanitize_text_redacts_bearer_tokens_and_secrets():
    value = (
        "Authorization: Bearer super-secret-token "
        "password=hunter2 cookie=session=abc123 refresh_token=refresh-456"
    )

    sanitized = _sanitize_text(value)

    assert sanitized is not None
    assert "super-secret-token" not in sanitized
    assert "hunter2" not in sanitized
    assert "abc123" not in sanitized
    assert "refresh-456" not in sanitized
    assert REDACTED in sanitized


def test_sanitize_metadata_redacts_sensitive_keys_and_truncates_nested_values():
    metadata = {
        "authorization": "Bearer top-secret",
        "details": {
            "password": "hunter2",
            "token": "abc123",
            "stack": "x" * 300,
        },
        "items": list(range(25)),
    }

    sanitized = _sanitize_metadata(metadata)

    assert sanitized["authorization"] == REDACTED
    assert sanitized["details"]["password"] == REDACTED
    assert sanitized["details"]["token"] == REDACTED
    assert sanitized["details"]["stack"].endswith(TRUNCATED)
    assert sanitized["items"][-1] == TRUNCATED

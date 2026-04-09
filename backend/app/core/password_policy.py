from __future__ import annotations

import re

PASSWORD_MIN_LENGTH = 10


def get_password_policy_error(password: str) -> str | None:
    if len(password) < PASSWORD_MIN_LENGTH:
        return f"Password must be at least {PASSWORD_MIN_LENGTH} characters long"

    if not re.search(r"[A-Z]", password):
        return "Password must include at least one uppercase letter"

    if not re.search(r"[a-z]", password):
        return "Password must include at least one lowercase letter"

    if not re.search(r"\d", password):
        return "Password must include at least one number"

    return None


def validate_password_for_schema(password: str) -> str:
    error = get_password_policy_error(password)
    if error:
        raise ValueError(error)
    return password

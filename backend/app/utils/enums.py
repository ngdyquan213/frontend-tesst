from __future__ import annotations


def enum_to_str(value):
    if value is None:
        return None
    return value.value if hasattr(value, "value") else str(value)

from __future__ import annotations

from ipaddress import ip_address as parse_ip
from ipaddress import ip_network


def normalize_ip(ip_value: str | None) -> str | None:
    if not ip_value:
        return None

    try:
        return str(parse_ip(ip_value))
    except ValueError:
        return None


def ip_in_allowlist(ip_value: str | None, allowlist: list[str]) -> bool:
    normalized_ip = normalize_ip(ip_value)
    if normalized_ip is None:
        return False

    parsed_ip = parse_ip(normalized_ip)

    for entry in allowlist:
        try:
            if parsed_ip in ip_network(entry, strict=False):
                return True
        except ValueError:
            continue

    return False

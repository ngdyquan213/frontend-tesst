from __future__ import annotations

from fastapi import Request

from app.core.config import settings
from app.utils.ip_utils import ip_in_allowlist, normalize_ip


def _parse_forwarded_header(forwarded_value: str) -> list[str]:
    candidates: list[str] = []

    for part in forwarded_value.split(","):
        for token in part.split(";"):
            key, separator, value = token.strip().partition("=")
            if separator != "=" or key.lower() != "for":
                continue

            cleaned = value.strip().strip('"')
            if cleaned.startswith("[") and "]" in cleaned:
                cleaned = cleaned[1 : cleaned.index("]")]
            elif ":" in cleaned and cleaned.count(":") == 1:
                host, _, port = cleaned.partition(":")
                if port.isdigit():
                    cleaned = host

            normalized = normalize_ip(cleaned)
            if normalized:
                candidates.append(normalized)

    return candidates


def _parse_x_forwarded_for(header_value: str) -> list[str]:
    candidates: list[str] = []
    for part in header_value.split(","):
        normalized = normalize_ip(part.strip())
        if normalized:
            candidates.append(normalized)
    return candidates


def _resolve_forwarded_client_ip(candidates: list[str]) -> str | None:
    # Walk the proxy chain from the app-facing side and stop at the first
    # hop that is not one of our trusted proxies.
    for candidate in reversed(candidates):
        if not ip_in_allowlist(candidate, settings.forwarded_allow_ips_list):
            return candidate
    return None


def _trusted_proxy_forwarded_ip(request: Request) -> str | None:
    peer_ip = normalize_ip(request.client.host) if request.client and request.client.host else None
    if not peer_ip:
        return None

    if not ip_in_allowlist(peer_ip, settings.forwarded_allow_ips_list):
        return None

    forwarded = request.headers.get("forwarded")
    if forwarded:
        candidates = _parse_forwarded_header(forwarded)
        if candidates:
            resolved = _resolve_forwarded_client_ip(candidates)
            if resolved:
                return resolved

    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        candidates = _parse_x_forwarded_for(x_forwarded_for)
        if candidates:
            resolved = _resolve_forwarded_client_ip(candidates)
            if resolved:
                return resolved

    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return normalize_ip(x_real_ip)

    return None


def get_client_ip(request: Request, *, default: str | None = None) -> str | None:
    forwarded_ip = _trusted_proxy_forwarded_ip(request)
    if forwarded_ip:
        return forwarded_ip

    if request.client and request.client.host:
        normalized = normalize_ip(request.client.host)
        if normalized:
            return normalized
        return request.client.host
    return default


def get_user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")

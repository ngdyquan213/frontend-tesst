from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt import InvalidTokenError
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))

    payload: dict[str, Any] = {
        "sub": subject,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except InvalidTokenError as exc:
        raise ValueError("Invalid token") from exc

    if payload.get("type") != "access":
        raise ValueError("Invalid token type")

    return payload


def create_refresh_token_value() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


def build_payment_callback_signature(
    *,
    gateway_name: str,
    gateway_order_ref: str,
    gateway_transaction_ref: str,
    amount: str,
    currency: str,
    status: str,
) -> str:
    message = "|".join(
        [
            gateway_name,
            gateway_order_ref,
            gateway_transaction_ref,
            amount,
            currency,
            status,
        ]
    )
    return hmac.new(
        settings.PAYMENT_CALLBACK_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_payment_callback_signature(
    *,
    gateway_name: str,
    gateway_order_ref: str,
    gateway_transaction_ref: str,
    amount: str,
    currency: str,
    status: str,
    signature: str,
) -> bool:
    expected = build_payment_callback_signature(
        gateway_name=gateway_name,
        gateway_order_ref=gateway_order_ref,
        gateway_transaction_ref=gateway_transaction_ref,
        amount=amount,
        currency=currency,
        status=status,
    )
    return hmac.compare_digest(expected, signature)

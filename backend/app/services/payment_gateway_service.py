from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import (
    ExternalServiceAppException,
    ValidationAppException,
)
from app.models.enums import PaymentMethod

ZERO_DECIMAL_CURRENCIES = {
    "BIF",
    "CLP",
    "DJF",
    "GNF",
    "JPY",
    "KMF",
    "KRW",
    "MGA",
    "PYG",
    "RWF",
    "UGX",
    "VND",
    "VUV",
    "XAF",
    "XOF",
    "XPF",
}
SUPPORTED_STRIPE_EVENT_TYPES = {
    "payment_intent.succeeded": "paid",
    "payment_intent.payment_failed": "failed",
    "payment_intent.canceled": "cancelled",
}


@dataclass(slots=True)
class PaymentGatewayInitiationResult:
    gateway_payload: dict[str, Any]
    external_reference: str | None = None


class PaymentGatewayService:
    def assert_gateway_is_configured(self, *, payment_method: PaymentMethod) -> None:
        if payment_method != PaymentMethod.stripe:
            return

        if not settings.STRIPE_SECRET_KEY.strip():
            raise ExternalServiceAppException("Stripe payment gateway is not configured")

    def create_payment_session(self, *, payment) -> PaymentGatewayInitiationResult | None:
        if payment.payment_method != PaymentMethod.stripe:
            return None

        self.assert_gateway_is_configured(payment_method=payment.payment_method)

        amount_minor = self._to_minor_units(
            amount=Decimal(payment.amount),
            currency=payment.currency,
        )
        payload = self._stripe_request(
            method="POST",
            path="/payment_intents",
            idempotency_key=payment.idempotency_key,
            data={
                "amount": str(amount_minor),
                "currency": payment.currency.lower(),
                "automatic_payment_methods[enabled]": "true",
                "metadata[gateway_order_ref]": payment.gateway_order_ref or "",
                "metadata[payment_id]": str(payment.id),
                "metadata[booking_id]": str(payment.booking_id) if payment.booking_id else "",
            },
        )
        payment_intent_id = payload.get("id")
        client_secret = payload.get("client_secret")
        if not payment_intent_id or not client_secret:
            raise ExternalServiceAppException("Stripe payment gateway returned an invalid response")

        return PaymentGatewayInitiationResult(
            external_reference=payment_intent_id,
            gateway_payload={
                "provider": "stripe",
                "payment_intent_id": payment_intent_id,
                "client_secret": client_secret,
                "publishable_key": settings.STRIPE_PUBLISHABLE_KEY or None,
                "status": payload.get("status"),
            },
        )

    def build_existing_gateway_payload(self, *, payment) -> dict[str, Any] | None:
        if payment.payment_method != PaymentMethod.stripe or not payment.gateway_transaction_ref:
            return None

        payload = self._stripe_request(
            method="GET",
            path=f"/payment_intents/{payment.gateway_transaction_ref}",
        )
        client_secret = payload.get("client_secret")
        payment_intent_id = payload.get("id")
        if not payment_intent_id or not client_secret:
            raise ExternalServiceAppException("Stripe payment gateway returned an invalid response")

        return {
            "provider": "stripe",
            "payment_intent_id": payment_intent_id,
            "client_secret": client_secret,
            "publishable_key": settings.STRIPE_PUBLISHABLE_KEY or None,
            "status": payload.get("status"),
        }

    def parse_stripe_webhook(
        self,
        *,
        raw_body: bytes,
        signature_header: str,
    ) -> dict[str, str]:
        if not settings.STRIPE_WEBHOOK_SECRET.strip():
            raise ExternalServiceAppException("Stripe webhook verification is not configured")

        event = self._decode_json_payload(raw_body)
        timestamp, signatures = self._parse_stripe_signature_header(signature_header)
        self._verify_stripe_signature(
            raw_body=raw_body,
            timestamp=timestamp,
            signatures=signatures,
        )

        event_type = event.get("type", "")
        normalized_status = SUPPORTED_STRIPE_EVENT_TYPES.get(event_type)
        if normalized_status is None:
            raise ValidationAppException("Unsupported payment callback event")

        data_object = event.get("data", {}).get("object", {})
        metadata = data_object.get("metadata") or {}
        gateway_order_ref = metadata.get("gateway_order_ref", "").strip()
        if not gateway_order_ref:
            raise ValidationAppException("Payment callback is missing gateway_order_ref")

        currency = str(data_object.get("currency", "")).upper()
        if not currency:
            raise ValidationAppException("Payment callback is missing currency")

        amount_minor = self._extract_stripe_amount_minor(
            event_type=event_type,
            data_object=data_object,
        )
        if amount_minor in (None, ""):
            raise ValidationAppException("Payment callback is missing amount")

        gateway_transaction_ref = (
            str(data_object.get("latest_charge") or data_object.get("id") or "").strip()
        )
        if not gateway_transaction_ref:
            raise ValidationAppException("Payment callback is missing transaction reference")

        amount = self._from_minor_units(
            minor_amount=amount_minor,
            currency=currency,
        )

        return {
            "gateway_name": "stripe",
            "gateway_order_ref": gateway_order_ref,
            "gateway_transaction_ref": gateway_transaction_ref,
            "amount": self._format_decimal(amount),
            "currency": currency,
            "status": normalized_status,
        }

    @staticmethod
    def _extract_stripe_amount_minor(
        *,
        event_type: str,
        data_object: dict[str, Any],
    ) -> Any:
        if event_type == "payment_intent.succeeded":
            preferred_keys = ("amount_received", "amount")
        else:
            preferred_keys = ("amount", "amount_received")

        for key in preferred_keys:
            value = data_object.get(key)
            if value not in (None, ""):
                return value
        return None

    def _stripe_request(
        self,
        *,
        method: str,
        path: str,
        data: dict[str, str] | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        headers = {"Authorization": f"Bearer {settings.STRIPE_SECRET_KEY}"}
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        url = f"{settings.STRIPE_API_BASE_URL.rstrip('/')}{path}"
        try:
            response = httpx.request(
                method=method,
                url=url,
                headers=headers,
                data=data,
                timeout=settings.STRIPE_REQUEST_TIMEOUT_SECONDS,
            )
        except httpx.HTTPError as exc:
            raise ExternalServiceAppException(
                "Stripe payment gateway is temporarily unavailable"
            ) from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise ExternalServiceAppException(
                "Stripe payment gateway returned invalid JSON"
            ) from exc

        if response.status_code >= 400:
            message = (
                payload.get("error", {}).get("message")
                if isinstance(payload, dict)
                else None
            )
            raise ExternalServiceAppException(
                message or "Stripe payment gateway rejected the request"
            )

        if not isinstance(payload, dict):
            raise ExternalServiceAppException("Stripe payment gateway returned an invalid response")
        return payload

    @staticmethod
    def _decode_json_payload(raw_body: bytes) -> dict[str, Any]:
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValidationAppException("Payment callback payload is invalid JSON") from exc

        if not isinstance(payload, dict):
            raise ValidationAppException("Payment callback payload must be a JSON object")
        return payload

    @staticmethod
    def _parse_stripe_signature_header(signature_header: str) -> tuple[int, list[str]]:
        timestamp: int | None = None
        signatures: list[str] = []

        for part in signature_header.split(","):
            key, _, value = part.strip().partition("=")
            if key == "t" and value.isdigit():
                timestamp = int(value)
            if key == "v1" and value:
                signatures.append(value)

        if timestamp is None or not signatures:
            raise ValidationAppException("Invalid callback signature")
        return timestamp, signatures

    def _verify_stripe_signature(
        self,
        *,
        raw_body: bytes,
        timestamp: int,
        signatures: list[str],
    ) -> None:
        current_timestamp = self._current_unix_timestamp()
        if abs(current_timestamp - timestamp) > settings.STRIPE_WEBHOOK_TOLERANCE_SECONDS:
            raise ValidationAppException("Expired callback timestamp")

        signed_payload = f"{timestamp}.{raw_body.decode('utf-8')}"
        expected_signature = hmac.new(
            settings.STRIPE_WEBHOOK_SECRET.encode("utf-8"),
            signed_payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if not any(hmac.compare_digest(expected_signature, signature) for signature in signatures):
            raise ValidationAppException("Invalid callback signature")

    @staticmethod
    def _current_unix_timestamp() -> int:
        import time

        return int(time.time())

    @staticmethod
    def _to_minor_units(*, amount: Decimal, currency: str) -> int:
        normalized_currency = currency.upper()
        quantized_amount = amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if normalized_currency in ZERO_DECIMAL_CURRENCIES:
            return int(quantized_amount)
        return int((quantized_amount * 100).to_integral_value(rounding=ROUND_HALF_UP))

    @staticmethod
    def _from_minor_units(*, minor_amount: int | str, currency: str) -> Decimal:
        normalized_currency = currency.upper()
        decimal_amount = Decimal(str(minor_amount))
        if normalized_currency in ZERO_DECIMAL_CURRENCIES:
            return decimal_amount.quantize(Decimal("0.01"))
        return (decimal_amount / Decimal("100")).quantize(Decimal("0.01"))

    @staticmethod
    def _format_decimal(value: Decimal) -> str:
        return format(value.quantize(Decimal("0.01")), "f")

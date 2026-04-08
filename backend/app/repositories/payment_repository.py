from sqlalchemy.orm import Session

from app.models.payment import Payment, PaymentCallback
from app.models.refund import Refund


class PaymentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add_payment(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.flush()
        return payment

    def get_by_id(self, payment_id: str) -> Payment | None:
        return self.db.query(Payment).filter(Payment.id == payment_id).first()

    def get_by_id_for_update(self, payment_id: str) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(Payment.id == payment_id)
            .with_for_update()
            .first()
        )

    def get_latest_by_booking_id(self, booking_id: str) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(Payment.booking_id == booking_id)
            .order_by(Payment.created_at.desc())
            .first()
        )

    def get_latest_by_booking_id_for_update(self, booking_id: str) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(Payment.booking_id == booking_id)
            .order_by(Payment.created_at.desc())
            .with_for_update()
            .first()
        )

    def get_by_booking_and_idempotency_key(
        self,
        booking_id: str,
        idempotency_key: str,
    ) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(
                Payment.booking_id == booking_id,
                Payment.idempotency_key == idempotency_key,
            )
            .first()
        )

    def get_by_gateway_order_ref(self, gateway_order_ref: str) -> Payment | None:
        return self.db.query(Payment).filter(Payment.gateway_order_ref == gateway_order_ref).first()

    def get_by_gateway_order_ref_for_update(self, gateway_order_ref: str) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(Payment.gateway_order_ref == gateway_order_ref)
            .with_for_update()
            .first()
        )

    def save(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.flush()
        return payment

    def add_callback(self, callback: PaymentCallback) -> PaymentCallback:
        self.db.add(callback)
        self.db.flush()
        return callback

    def get_callback_by_gateway_txn_ref(
        self,
        *,
        gateway_name: str,
        gateway_transaction_ref: str,
    ) -> PaymentCallback | None:
        return (
            self.db.query(PaymentCallback)
            .filter(
                PaymentCallback.gateway_name == gateway_name,
                PaymentCallback.gateway_transaction_ref == gateway_transaction_ref,
            )
            .first()
        )

    def add_refund(self, refund: Refund) -> Refund:
        self.db.add(refund)
        self.db.flush()
        return refund

    def get_refund_by_id(self, refund_id: str) -> Refund | None:
        return self.db.query(Refund).filter(Refund.id == refund_id).first()

    def save_refund(self, refund: Refund) -> Refund:
        self.db.add(refund)
        self.db.flush()
        return refund

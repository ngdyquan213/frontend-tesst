from __future__ import annotations

import argparse
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.constants import (
    ALL_ADMIN_PERMISSIONS,
    PERM_ADMIN_AUDIT_LOGS_READ,
    PERM_ADMIN_BOOKINGS_READ,
    PERM_ADMIN_DASHBOARD_READ,
    PERM_ADMIN_DOCUMENTS_READ,
    PERM_ADMIN_DOCUMENTS_WRITE,
    PERM_ADMIN_EXPORTS_READ,
    PERM_ADMIN_PAYMENTS_READ,
    PERM_ADMIN_REFUNDS_READ,
    PERM_ADMIN_SUPPORT_READ,
    PERM_ADMIN_SUPPORT_WRITE,
    PERM_ADMIN_USERS_READ,
)
from app.core.database import SessionLocal
from app.core.rbac import ensure_role_has_permissions
from app.core.security import get_password_hash
from app.models.audit import AuditLog, SecurityEvent
from app.models.booking import Booking, BookingItem, Traveler
from app.models.coupon import Coupon, CouponUsage
from app.models.document import UploadedDocument
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    DocumentType,
    LogActorType,
    PaymentMethod,
    PaymentStatus,
    RefundStatus,
    SecurityEventType,
    TourScheduleStatus,
    TravelerType,
    UserStatus,
)
from app.models.flight import Flight
from app.models.hotel import HotelRoom, HotelRoomInventory
from app.models.payment import Payment, PaymentCallback, PaymentTransaction
from app.models.refund import Refund
from app.models.role import Role, UserRole
from app.models.support import SupportTicket
from app.models.support_reply import SupportTicketReply
from app.models.system import AppSetting, NotificationReadState, OutboxEvent
from app.models.tour import TourSchedule
from app.models.user import (
    EmailVerificationToken,
    LoginAttempt,
    PasswordResetToken,
    RefreshToken,
    User,
)
from scripts.create_admin import create_or_update_admin
from scripts.seed_coupons import seed_default_coupons
from scripts.seed_data import seed_catalog

DEMO_ANCHOR_DATETIME = datetime(2026, 4, 1, 8, 0, tzinfo=timezone.utc)
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin12345"
CUSTOMER_EMAIL = "qa.customer@example.com"
CUSTOMER_PASSWORD = "Traveler12345"
DEMO_BOOKING_CODE = "BK-DEMO-FLIGHT-001"
SUPPORT_AGENT_EMAIL = "support.agent@example.com"
SUPPORT_AGENT_PASSWORD = "Support12345"
DOC_REVIEWER_EMAIL = "reviewer.docs@example.com"
DOC_REVIEWER_PASSWORD = "Review12345"
OPS_ANALYST_EMAIL = "ops.analyst@example.com"
OPS_ANALYST_PASSWORD = "Ops12345"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed a rich deterministic demo profile across backend tables."
    )
    parser.add_argument(
        "--anchor-datetime",
        help="Optional ISO-8601 datetime used to make generated dates deterministic.",
    )
    return parser.parse_args()


def resolve_anchor_datetime(value: str | None) -> datetime:
    if value:
        return datetime.fromisoformat(value)
    return DEMO_ANCHOR_DATETIME


def create_or_update_user(
    db: Session,
    *,
    email: str,
    password: str,
    username: str,
    full_name: str,
    phone: str | None = None,
    status: UserStatus = UserStatus.active,
    email_verified: bool = True,
    phone_verified: bool = False,
    last_login_at: datetime | None = None,
    last_login_ip: str | None = None,
    failed_login_count: int = 0,
    locked_until: datetime | None = None,
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            password_hash=get_password_hash(password),
            phone=phone,
            status=status,
            email_verified=email_verified,
            phone_verified=phone_verified,
            last_login_at=last_login_at,
            last_login_ip=last_login_ip,
            failed_login_count=failed_login_count,
            locked_until=locked_until,
        )
        db.add(user)
        db.flush()
        return user

    user.username = username
    user.full_name = full_name
    user.password_hash = get_password_hash(password)
    user.phone = phone
    user.status = status
    user.email_verified = email_verified
    user.phone_verified = phone_verified
    user.last_login_at = last_login_at
    user.last_login_ip = last_login_ip
    user.failed_login_count = failed_login_count
    user.locked_until = locked_until
    db.flush()
    return user


def ensure_role(
    db: Session,
    *,
    role_name: str,
    description: str,
    permission_names: tuple[str, ...] | list[str],
) -> Role:
    role = db.query(Role).filter(Role.name == role_name).first()
    if role is None:
        role = Role(name=role_name, description=description)
        db.add(role)
        db.flush()
    else:
        role.description = description

    ensure_role_has_permissions(db, role=role, permission_names=permission_names)
    return role


def ensure_user_role(db: Session, *, user: User, role: Role, assigned_by: User | None = None) -> None:
    existing = (
        db.query(UserRole)
        .filter(UserRole.user_id == user.id, UserRole.role_id == role.id)
        .first()
    )
    if existing is None:
        db.add(
            UserRole(
                user_id=user.id,
                role_id=role.id,
                assigned_by=assigned_by.id if assigned_by else None,
            )
        )
        db.flush()


def upsert_refresh_token(
    db: Session,
    *,
    user: User,
    token_hash: str,
    created_at: datetime,
    expires_at: datetime,
    user_agent: str,
    ip_address: str,
    revoked_at: datetime | None = None,
) -> None:
    token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if token is None:
        token = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            created_at=created_at,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
            revoked_at=revoked_at,
        )
        db.add(token)
    else:
        token.user_id = user.id
        token.created_at = created_at
        token.expires_at = expires_at
        token.user_agent = user_agent
        token.ip_address = ip_address
        token.revoked_at = revoked_at
    db.flush()


def upsert_password_reset_token(
    db: Session,
    *,
    user: User,
    token_hash: str,
    created_at: datetime,
    expires_at: datetime,
    used_at: datetime | None = None,
) -> None:
    token = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()
    if token is None:
        token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            created_at=created_at,
            expires_at=expires_at,
            used_at=used_at,
        )
        db.add(token)
    else:
        token.user_id = user.id
        token.created_at = created_at
        token.expires_at = expires_at
        token.used_at = used_at
    db.flush()


def upsert_email_verification_token(
    db: Session,
    *,
    user: User,
    token_hash: str,
    created_at: datetime,
    expires_at: datetime,
    used_at: datetime | None = None,
) -> None:
    token = (
        db.query(EmailVerificationToken)
        .filter(EmailVerificationToken.token_hash == token_hash)
        .first()
    )
    if token is None:
        token = EmailVerificationToken(
            user_id=user.id,
            token_hash=token_hash,
            created_at=created_at,
            expires_at=expires_at,
            used_at=used_at,
        )
        db.add(token)
    else:
        token.user_id = user.id
        token.created_at = created_at
        token.expires_at = expires_at
        token.used_at = used_at
    db.flush()


def upsert_login_attempt(
    db: Session,
    *,
    email: str,
    attempted_at: datetime,
    success: bool,
    ip_address: str,
    user_agent: str,
) -> None:
    attempt = (
        db.query(LoginAttempt)
        .filter(LoginAttempt.email == email, LoginAttempt.attempted_at == attempted_at)
        .first()
    )
    if attempt is None:
        attempt = LoginAttempt(
            email=email,
            attempted_at=attempted_at,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(attempt)
    else:
        attempt.success = success
        attempt.ip_address = ip_address
        attempt.user_agent = user_agent
    db.flush()


def sync_hotel_room_inventory(
    db: Session,
    *,
    room: HotelRoom,
    start_date: date,
    days: int,
    reserved_counts: dict[date, int] | None = None,
) -> None:
    reserved_counts = reserved_counts or {}
    for offset in range(days):
        inventory_date = start_date + timedelta(days=offset)
        available_rooms = max(room.total_rooms - reserved_counts.get(inventory_date, 0), 0)
        inventory = (
            db.query(HotelRoomInventory)
            .filter(
                HotelRoomInventory.room_id == room.id,
                HotelRoomInventory.inventory_date == inventory_date,
            )
            .first()
        )
        if inventory is None:
            inventory = HotelRoomInventory(
                room_id=room.id,
                inventory_date=inventory_date,
                available_rooms=available_rooms,
            )
            db.add(inventory)
        else:
            inventory.available_rooms = available_rooms
    db.flush()


def get_tour_price(schedule: TourSchedule, traveler_type: TravelerType) -> Decimal:
    for rule in schedule.price_rules:
        if rule.traveler_type == traveler_type:
            return Decimal(str(rule.price))
    raise ValueError(f"Missing price rule for traveler type {traveler_type.value}")


def upsert_booking(
    db: Session,
    *,
    booking_code: str,
    user: User,
    status: BookingStatus,
    payment_status: PaymentStatus,
    total_base_amount: Decimal,
    total_discount_amount: Decimal,
    total_final_amount: Decimal,
    booked_at: datetime,
    coupon: Coupon | None = None,
    expires_at: datetime | None = None,
    cancelled_at: datetime | None = None,
    cancellation_reason: str | None = None,
    notes: str | None = None,
) -> Booking:
    booking = db.query(Booking).filter(Booking.booking_code == booking_code).first()
    if booking is None:
        booking = Booking(
            booking_code=booking_code,
            user_id=user.id,
            status=status,
            total_base_amount=total_base_amount,
            total_discount_amount=total_discount_amount,
            total_final_amount=total_final_amount,
            currency="VND",
            coupon_id=coupon.id if coupon else None,
            payment_status=payment_status,
            booked_at=booked_at,
            expires_at=expires_at,
            cancelled_at=cancelled_at,
            cancellation_reason=cancellation_reason,
            notes=notes,
        )
        db.add(booking)
    else:
        booking.user_id = user.id
        booking.status = status
        booking.total_base_amount = total_base_amount
        booking.total_discount_amount = total_discount_amount
        booking.total_final_amount = total_final_amount
        booking.currency = "VND"
        booking.coupon_id = coupon.id if coupon else None
        booking.payment_status = payment_status
        booking.booked_at = booked_at
        booking.expires_at = expires_at
        booking.cancelled_at = cancelled_at
        booking.cancellation_reason = cancellation_reason
        booking.notes = notes
    db.flush()
    return booking


def upsert_booking_item(
    db: Session,
    *,
    booking: Booking,
    item_type: BookingItemType,
    quantity: int,
    unit_price: Decimal,
    total_price: Decimal,
    metadata_json: dict,
    flight: Flight | None = None,
    room: HotelRoom | None = None,
    schedule: TourSchedule | None = None,
    check_in_date: date | None = None,
    check_out_date: date | None = None,
) -> BookingItem:
    item = (
        db.query(BookingItem)
        .filter(BookingItem.booking_id == booking.id, BookingItem.item_type == item_type)
        .first()
    )
    if item is None:
        item = BookingItem(
            booking_id=booking.id,
            item_type=item_type,
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price,
            metadata_json=metadata_json,
        )
        db.add(item)

    item.flight_id = flight.id if flight else None
    item.hotel_room_id = room.id if room else None
    item.tour_schedule_id = schedule.id if schedule else None
    item.check_in_date = check_in_date
    item.check_out_date = check_out_date
    item.quantity = quantity
    item.unit_price = unit_price
    item.total_price = total_price
    item.metadata_json = metadata_json
    db.flush()
    return item


def upsert_traveler(
    db: Session,
    *,
    booking: Booking,
    full_name: str,
    traveler_type: TravelerType,
    date_of_birth: date,
    passport_number: str,
    nationality: str,
    document_type: DocumentType,
) -> Traveler:
    traveler = (
        db.query(Traveler)
        .filter(Traveler.booking_id == booking.id, Traveler.full_name == full_name)
        .first()
    )
    if traveler is None:
        traveler = Traveler(
            booking_id=booking.id,
            full_name=full_name,
            traveler_type=traveler_type,
            date_of_birth=date_of_birth,
            passport_number=passport_number,
            nationality=nationality,
            document_type=document_type,
        )
        db.add(traveler)
    else:
        traveler.traveler_type = traveler_type
        traveler.date_of_birth = date_of_birth
        traveler.passport_number = passport_number
        traveler.nationality = nationality
        traveler.document_type = document_type
    db.flush()
    return traveler


def upsert_payment(
    db: Session,
    *,
    booking: Booking,
    gateway_order_ref: str,
    initiated_by: User,
    payment_method: PaymentMethod,
    status: PaymentStatus,
    amount: Decimal,
    idempotency_key: str,
    gateway_transaction_ref: str | None = None,
    paid_at: datetime | None = None,
    failed_at: datetime | None = None,
    failure_reason: str | None = None,
) -> Payment:
    payment = db.query(Payment).filter(Payment.gateway_order_ref == gateway_order_ref).first()
    if payment is None:
        payment = (
            db.query(Payment)
            .filter(
                Payment.booking_id == booking.id,
                Payment.idempotency_key == idempotency_key,
            )
            .first()
        )
    if payment is None:
        payment = Payment(
            booking_id=booking.id,
            initiated_by=initiated_by.id,
            payment_method=payment_method,
            status=status,
            amount=amount,
            currency="VND",
            gateway_order_ref=gateway_order_ref,
            gateway_transaction_ref=gateway_transaction_ref,
            idempotency_key=idempotency_key,
            paid_at=paid_at,
            failed_at=failed_at,
            failure_reason=failure_reason,
        )
        db.add(payment)
    else:
        payment.booking_id = booking.id
        payment.initiated_by = initiated_by.id
        payment.payment_method = payment_method
        payment.status = status
        payment.amount = amount
        payment.currency = "VND"
        payment.gateway_transaction_ref = gateway_transaction_ref
        payment.idempotency_key = idempotency_key
        payment.paid_at = paid_at
        payment.failed_at = failed_at
        payment.failure_reason = failure_reason
    db.flush()
    return payment


def upsert_payment_transaction(
    db: Session,
    *,
    payment: Payment,
    transaction_ref: str,
    event_type: str,
    status: PaymentStatus,
    amount: Decimal,
    created_at: datetime,
    raw_response: dict | None = None,
) -> None:
    transaction = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.payment_id == payment.id,
            PaymentTransaction.transaction_ref == transaction_ref,
            PaymentTransaction.event_type == event_type,
        )
        .first()
    )
    if transaction is None:
        transaction = PaymentTransaction(
            payment_id=payment.id,
            transaction_ref=transaction_ref,
            event_type=event_type,
            amount=amount,
            currency="VND",
            status=status,
            created_at=created_at,
            raw_response=raw_response,
        )
        db.add(transaction)
    else:
        transaction.amount = amount
        transaction.currency = "VND"
        transaction.status = status
        transaction.created_at = created_at
        transaction.raw_response = raw_response
    db.flush()


def upsert_payment_callback(
    db: Session,
    *,
    payment: Payment,
    gateway_name: str,
    gateway_transaction_ref: str,
    callback_payload: dict,
    signature_valid: bool,
    processed: bool,
    received_at: datetime,
    source_ip: str,
) -> None:
    callback = (
        db.query(PaymentCallback)
        .filter(
            PaymentCallback.gateway_name == gateway_name,
            PaymentCallback.gateway_transaction_ref == gateway_transaction_ref,
        )
        .first()
    )
    if callback is None:
        callback = PaymentCallback(
            payment_id=payment.id,
            gateway_name=gateway_name,
            gateway_transaction_ref=gateway_transaction_ref,
            callback_payload=callback_payload,
            signature_valid=signature_valid,
            processed=processed,
            received_at=received_at,
            source_ip=source_ip,
        )
        db.add(callback)
    else:
        callback.payment_id = payment.id
        callback.callback_payload = callback_payload
        callback.signature_valid = signature_valid
        callback.processed = processed
        callback.received_at = received_at
        callback.source_ip = source_ip
    db.flush()


def upsert_refund(
    db: Session,
    *,
    payment: Payment,
    amount: Decimal,
    status: RefundStatus,
    reason: str,
    created_at: datetime,
    processed_at: datetime | None = None,
) -> Refund:
    refund = db.query(Refund).filter(Refund.payment_id == payment.id).first()
    if refund is None:
        refund = Refund(
            payment_id=payment.id,
            amount=amount,
            currency="VND",
            status=status,
            reason=reason,
            created_at=created_at,
            processed_at=processed_at,
        )
        db.add(refund)
    else:
        refund.amount = amount
        refund.currency = "VND"
        refund.status = status
        refund.reason = reason
        refund.created_at = created_at
        refund.processed_at = processed_at
    db.flush()
    return refund


def upsert_coupon_usage(
    db: Session,
    *,
    coupon: Coupon,
    user: User,
    booking: Booking,
    used_at: datetime,
) -> None:
    usage = (
        db.query(CouponUsage)
        .filter(CouponUsage.coupon_id == coupon.id, CouponUsage.booking_id == booking.id)
        .first()
    )
    if usage is None:
        usage = CouponUsage(
            coupon_id=coupon.id,
            user_id=user.id,
            booking_id=booking.id,
            used_at=used_at,
        )
        db.add(usage)
    else:
        usage.user_id = user.id
        usage.used_at = used_at
    db.flush()


def sync_coupon_counts(db: Session, *, coupons: list[Coupon]) -> None:
    for coupon in coupons:
        coupon.used_count = (
            db.query(CouponUsage).filter(CouponUsage.coupon_id == coupon.id).count()
        )
    db.flush()


def upsert_document(
    db: Session,
    *,
    user: User,
    storage_key: str,
    original_filename: str,
    stored_filename: str,
    document_type: DocumentType,
    status: str,
    uploaded_at: datetime,
    reviewer: User | None = None,
    reviewed_at: datetime | None = None,
    booking: Booking | None = None,
    traveler: Traveler | None = None,
    file_size: int = 245760,
    mime_type: str = "application/pdf",
    is_private: bool = True,
) -> UploadedDocument:
    document = db.query(UploadedDocument).filter(UploadedDocument.storage_key == storage_key).first()
    checksum = uuid.uuid5(uuid.NAMESPACE_URL, storage_key).hex
    if document is None:
        document = UploadedDocument(
            user_id=user.id,
            booking_id=booking.id if booking else None,
            traveler_id=traveler.id if traveler else None,
            document_type=document_type,
            original_filename=original_filename,
            stored_filename=stored_filename,
            mime_type=mime_type,
            file_size=file_size,
            storage_bucket="travelbook-demo",
            storage_key=storage_key,
            checksum_sha256=checksum,
            status=status,
            reviewed_at=reviewed_at,
            reviewed_by_user_id=reviewer.id if reviewer else None,
            is_private=is_private,
            uploaded_at=uploaded_at,
        )
        db.add(document)
    else:
        document.user_id = user.id
        document.booking_id = booking.id if booking else None
        document.traveler_id = traveler.id if traveler else None
        document.document_type = document_type
        document.original_filename = original_filename
        document.stored_filename = stored_filename
        document.mime_type = mime_type
        document.file_size = file_size
        document.storage_bucket = "travelbook-demo"
        document.checksum_sha256 = checksum
        document.status = status
        document.reviewed_at = reviewed_at
        document.reviewed_by_user_id = reviewer.id if reviewer else None
        document.is_private = is_private
        document.uploaded_at = uploaded_at
        document.deleted_at = None
    db.flush()
    return document


def upsert_support_ticket(
    db: Session,
    *,
    reference: str,
    user: User,
    requester_name: str,
    requester_email: str,
    topic_id: str,
    subject: str,
    message: str,
    status: str,
    created_at: datetime,
    updated_at: datetime,
    booking: Booking | None = None,
) -> SupportTicket:
    ticket = db.query(SupportTicket).filter(SupportTicket.reference == reference).first()
    if ticket is None:
        ticket = SupportTicket(
            reference=reference,
            user_id=user.id,
            booking_id=booking.id if booking else None,
            requester_name=requester_name,
            requester_email=requester_email,
            topic_id=topic_id,
            subject=subject,
            message=message,
            status=status,
            created_at=created_at,
            updated_at=updated_at,
        )
        db.add(ticket)
    else:
        ticket.user_id = user.id
        ticket.booking_id = booking.id if booking else None
        ticket.requester_name = requester_name
        ticket.requester_email = requester_email
        ticket.topic_id = topic_id
        ticket.subject = subject
        ticket.message = message
        ticket.status = status
        ticket.created_at = created_at
        ticket.updated_at = updated_at
    db.flush()
    return ticket


def upsert_support_reply(
    db: Session,
    *,
    ticket: SupportTicket,
    author_name: str,
    author_role: str,
    message: str,
    created_at: datetime,
    author_user: User | None = None,
) -> None:
    reply = (
        db.query(SupportTicketReply)
        .filter(
            SupportTicketReply.ticket_id == ticket.id,
            SupportTicketReply.author_role == author_role,
            SupportTicketReply.message == message,
        )
        .first()
    )
    if reply is None:
        reply = SupportTicketReply(
            ticket_id=ticket.id,
            author_user_id=author_user.id if author_user else None,
            author_name=author_name,
            author_role=author_role,
            message=message,
            created_at=created_at,
        )
        db.add(reply)
    else:
        reply.author_user_id = author_user.id if author_user else None
        reply.author_name = author_name
        reply.created_at = created_at
    db.flush()


def upsert_app_setting(
    db: Session,
    *,
    key: str,
    value: dict,
    updated_at: datetime,
    updated_by: User | None = None,
) -> None:
    setting = db.query(AppSetting).filter(AppSetting.key == key).first()
    if setting is None:
        setting = AppSetting(
            key=key,
            value=value,
            updated_at=updated_at,
            updated_by=updated_by.id if updated_by else None,
        )
        db.add(setting)
    else:
        setting.value = value
        setting.updated_at = updated_at
        setting.updated_by = updated_by.id if updated_by else None
    db.flush()


def upsert_audit_log(
    db: Session,
    *,
    action: str,
    resource_type: str,
    created_at: datetime,
    actor_type: LogActorType,
    actor_user: User | None = None,
    resource_id=None,
    metadata_json: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    audit_log = (
        db.query(AuditLog)
        .filter(
            AuditLog.action == action,
            AuditLog.resource_type == resource_type,
            AuditLog.resource_id == resource_id,
        )
        .first()
    )
    request_id = uuid.uuid5(
        uuid.NAMESPACE_URL,
        f"audit:{action}:{resource_type}:{resource_id}:{created_at.isoformat()}",
    )
    if audit_log is None:
        audit_log = AuditLog(
            actor_type=actor_type,
            actor_user_id=actor_user.id if actor_user else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            metadata_json=metadata_json,
            created_at=created_at,
        )
        db.add(audit_log)
    else:
        audit_log.actor_type = actor_type
        audit_log.actor_user_id = actor_user.id if actor_user else None
        audit_log.ip_address = ip_address
        audit_log.user_agent = user_agent
        audit_log.request_id = request_id
        audit_log.metadata_json = metadata_json
        audit_log.created_at = created_at
    db.flush()


def upsert_security_event(
    db: Session,
    *,
    title: str,
    event_type: SecurityEventType,
    severity: str,
    detected_at: datetime,
    related_user: User | None = None,
    description: str | None = None,
    event_data: dict | None = None,
    ip_address: str | None = None,
) -> None:
    event = db.query(SecurityEvent).filter(SecurityEvent.title == title).first()
    if event is None:
        event = SecurityEvent(
            event_type=event_type,
            severity=severity,
            related_user_id=related_user.id if related_user else None,
            ip_address=ip_address,
            title=title,
            description=description,
            event_data=event_data,
            detected_at=detected_at,
        )
        db.add(event)
    else:
        event.event_type = event_type
        event.severity = severity
        event.related_user_id = related_user.id if related_user else None
        event.ip_address = ip_address
        event.description = description
        event.event_data = event_data
        event.detected_at = detected_at
    db.flush()


def upsert_notification_read_state(
    db: Session,
    *,
    user: User,
    notification_id: str,
    read_at: datetime,
) -> None:
    state = (
        db.query(NotificationReadState)
        .filter(
            NotificationReadState.user_id == user.id,
            NotificationReadState.notification_id == notification_id,
        )
        .first()
    )
    if state is None:
        state = NotificationReadState(
            user_id=user.id,
            notification_id=notification_id,
            read_at=read_at,
        )
        db.add(state)
    else:
        state.read_at = read_at
    db.flush()


def upsert_outbox_event(
    db: Session,
    *,
    seed_key: str,
    target: str,
    handler: str,
    status: str,
    payload: dict,
    available_at: datetime,
    processed_at: datetime | None = None,
    attempt_count: int = 0,
    last_error: str | None = None,
    claimed_by: str | None = None,
    claim_token: str | None = None,
    processing_started_at: datetime | None = None,
    lease_expires_at: datetime | None = None,
) -> None:
    matching_event = None
    for event in db.query(OutboxEvent).filter(
        OutboxEvent.target == target,
        OutboxEvent.handler == handler,
    ):
        if (event.payload or {}).get("seed_key") == seed_key:
            matching_event = event
            break

    payload_with_seed = {"seed_key": seed_key, **payload}
    if matching_event is None:
        matching_event = OutboxEvent(
            target=target,
            handler=handler,
            payload=payload_with_seed,
            status=status,
            attempt_count=attempt_count,
            claim_token=claim_token,
            claimed_by=claimed_by,
            processing_started_at=processing_started_at,
            lease_expires_at=lease_expires_at,
            available_at=available_at,
            processed_at=processed_at,
            last_error=last_error,
        )
        db.add(matching_event)
    else:
        matching_event.payload = payload_with_seed
        matching_event.status = status
        matching_event.attempt_count = attempt_count
        matching_event.claim_token = claim_token
        matching_event.claimed_by = claimed_by
        matching_event.processing_started_at = processing_started_at
        matching_event.lease_expires_at = lease_expires_at
        matching_event.available_at = available_at
        matching_event.processed_at = processed_at
        matching_event.last_error = last_error
    db.flush()


def seed_roles_and_users(db: Session, *, anchor_datetime: datetime) -> dict[str, User]:
    admin = create_or_update_admin(
        db,
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD,
        username="admin",
        full_name="System Admin",
    )

    support_role = ensure_role(
        db,
        role_name="support_agent",
        description="Customer support specialist",
        permission_names=(
            PERM_ADMIN_SUPPORT_READ,
            PERM_ADMIN_SUPPORT_WRITE,
            PERM_ADMIN_BOOKINGS_READ,
            PERM_ADMIN_USERS_READ,
        ),
    )
    document_role = ensure_role(
        db,
        role_name="document_reviewer",
        description="Document verification team",
        permission_names=(
            PERM_ADMIN_DOCUMENTS_READ,
            PERM_ADMIN_DOCUMENTS_WRITE,
        ),
    )
    operations_role = ensure_role(
        db,
        role_name="operations_analyst",
        description="Operations and reporting access",
        permission_names=(
            PERM_ADMIN_DASHBOARD_READ,
            PERM_ADMIN_AUDIT_LOGS_READ,
            PERM_ADMIN_EXPORTS_READ,
            PERM_ADMIN_PAYMENTS_READ,
            PERM_ADMIN_REFUNDS_READ,
            PERM_ADMIN_BOOKINGS_READ,
        ),
    )
    ensure_role(
        db,
        role_name="admin",
        description="Administrator",
        permission_names=ALL_ADMIN_PERMISSIONS,
    )

    qa_customer = create_or_update_user(
        db,
        email=CUSTOMER_EMAIL,
        password=CUSTOMER_PASSWORD,
        username="qa_customer",
        full_name="QA Customer",
        phone="+84901234567",
        email_verified=True,
        last_login_at=anchor_datetime + timedelta(hours=2),
        last_login_ip="203.0.113.11",
    )
    family_customer = create_or_update_user(
        db,
        email="family.customer@example.com",
        password=CUSTOMER_PASSWORD,
        username="family_customer",
        full_name="Family Traveler",
        phone="+84907654321",
        email_verified=True,
        last_login_at=anchor_datetime + timedelta(days=1, hours=4),
        last_login_ip="203.0.113.21",
    )
    luxury_customer = create_or_update_user(
        db,
        email="luxury.customer@example.com",
        password=CUSTOMER_PASSWORD,
        username="luxury_customer",
        full_name="Luxury Guest",
        phone="+84908889999",
        email_verified=True,
        phone_verified=True,
        last_login_at=anchor_datetime + timedelta(days=2, hours=6),
        last_login_ip="203.0.113.31",
    )
    locked_customer = create_or_update_user(
        db,
        email="locked.customer@example.com",
        password=CUSTOMER_PASSWORD,
        username="locked_customer",
        full_name="Locked Traveler",
        status=UserStatus.suspended,
        email_verified=False,
        failed_login_count=5,
        locked_until=anchor_datetime + timedelta(days=30),
        last_login_ip="198.51.100.77",
    )
    support_agent = create_or_update_user(
        db,
        email=SUPPORT_AGENT_EMAIL,
        password=SUPPORT_AGENT_PASSWORD,
        username="support_agent",
        full_name="Support Agent",
        phone="+84905556666",
        email_verified=True,
        last_login_at=anchor_datetime + timedelta(days=3, hours=2),
        last_login_ip="198.51.100.15",
    )
    doc_reviewer = create_or_update_user(
        db,
        email=DOC_REVIEWER_EMAIL,
        password=DOC_REVIEWER_PASSWORD,
        username="doc_reviewer",
        full_name="Document Reviewer",
        phone="+84906667777",
        email_verified=True,
        last_login_at=anchor_datetime + timedelta(days=3, hours=1),
        last_login_ip="198.51.100.16",
    )
    ops_analyst = create_or_update_user(
        db,
        email=OPS_ANALYST_EMAIL,
        password=OPS_ANALYST_PASSWORD,
        username="ops_analyst",
        full_name="Operations Analyst",
        phone="+84907778888",
        email_verified=True,
        last_login_at=anchor_datetime + timedelta(days=3),
        last_login_ip="198.51.100.17",
    )

    ensure_user_role(db, user=support_agent, role=support_role, assigned_by=admin)
    ensure_user_role(db, user=doc_reviewer, role=document_role, assigned_by=admin)
    ensure_user_role(db, user=ops_analyst, role=operations_role, assigned_by=admin)

    upsert_refresh_token(
        db,
        user=qa_customer,
        token_hash="seed-refresh-qa-customer",
        created_at=anchor_datetime + timedelta(hours=2),
        expires_at=anchor_datetime + timedelta(days=14),
        user_agent="TravelBookWeb/1.5 (Macintosh)",
        ip_address="203.0.113.11",
    )
    upsert_refresh_token(
        db,
        user=family_customer,
        token_hash="seed-refresh-family-customer",
        created_at=anchor_datetime + timedelta(days=1, hours=4),
        expires_at=anchor_datetime + timedelta(days=15),
        user_agent="TravelBookWeb/1.5 (iPhone)",
        ip_address="203.0.113.21",
    )
    upsert_refresh_token(
        db,
        user=support_agent,
        token_hash="seed-refresh-support-agent",
        created_at=anchor_datetime + timedelta(days=3, hours=2),
        expires_at=anchor_datetime + timedelta(days=17),
        user_agent="TravelBookAdmin/1.5 (Windows)",
        ip_address="198.51.100.15",
    )

    upsert_password_reset_token(
        db,
        user=qa_customer,
        token_hash="seed-password-reset-qa",
        created_at=anchor_datetime - timedelta(days=3),
        expires_at=anchor_datetime - timedelta(days=2, hours=23),
        used_at=anchor_datetime - timedelta(days=3) + timedelta(minutes=12),
    )
    upsert_password_reset_token(
        db,
        user=locked_customer,
        token_hash="seed-password-reset-locked",
        created_at=anchor_datetime + timedelta(days=1),
        expires_at=anchor_datetime + timedelta(days=1, hours=1),
        used_at=None,
    )

    upsert_email_verification_token(
        db,
        user=family_customer,
        token_hash="seed-email-verify-family",
        created_at=anchor_datetime - timedelta(days=10),
        expires_at=anchor_datetime - timedelta(days=9),
        used_at=anchor_datetime - timedelta(days=10) + timedelta(minutes=8),
    )
    upsert_email_verification_token(
        db,
        user=locked_customer,
        token_hash="seed-email-verify-locked",
        created_at=anchor_datetime + timedelta(hours=3),
        expires_at=anchor_datetime + timedelta(days=2),
        used_at=None,
    )

    upsert_login_attempt(
        db,
        email=qa_customer.email,
        attempted_at=anchor_datetime + timedelta(hours=2),
        success=True,
        ip_address="203.0.113.11",
        user_agent="TravelBookWeb/1.5 (Macintosh)",
    )
    upsert_login_attempt(
        db,
        email=locked_customer.email,
        attempted_at=anchor_datetime + timedelta(hours=5),
        success=False,
        ip_address="198.51.100.77",
        user_agent="TravelBookWeb/1.5 (Android)",
    )
    upsert_login_attempt(
        db,
        email=locked_customer.email,
        attempted_at=anchor_datetime + timedelta(hours=5, minutes=3),
        success=False,
        ip_address="198.51.100.77",
        user_agent="TravelBookWeb/1.5 (Android)",
    )

    return {
        "admin": admin,
        "qa_customer": qa_customer,
        "family_customer": family_customer,
        "luxury_customer": luxury_customer,
        "locked_customer": locked_customer,
        "support_agent": support_agent,
        "doc_reviewer": doc_reviewer,
        "ops_analyst": ops_analyst,
    }


def seed_hotel_inventory(
    db: Session,
    *,
    anchor_datetime: datetime,
    room_by_type: dict[str, HotelRoom],
) -> None:
    liberty_reserved: dict[date, int] = {}
    for offset in range(12, 15):
        liberty_reserved[anchor_datetime.date() + timedelta(days=offset)] = 1

    sync_hotel_room_inventory(
        db,
        room=room_by_type["Liberty Central Saigon:Deluxe"],
        start_date=anchor_datetime.date(),
        days=45,
        reserved_counts=liberty_reserved,
    )
    sync_hotel_room_inventory(
        db,
        room=room_by_type["Melia Hanoi:Premium"],
        start_date=anchor_datetime.date(),
        days=45,
    )


def seed_bookings_and_related_data(
    db: Session,
    *,
    anchor_datetime: datetime,
    users: dict[str, User],
) -> dict[str, object]:
    flights = {flight.flight_number: flight for flight in db.query(Flight).all()}
    rooms = {
        f"{room.hotel.name}:{room.room_type}": room
        for room in db.query(HotelRoom).all()
    }
    coupons = {coupon.code: coupon for coupon in db.query(Coupon).all()}

    seed_hotel_inventory(db, anchor_datetime=anchor_datetime, room_by_type=rooms)

    qa_customer = users["qa_customer"]
    family_customer = users["family_customer"]
    luxury_customer = users["luxury_customer"]
    admin = users["admin"]
    doc_reviewer = users["doc_reviewer"]
    support_agent = users["support_agent"]
    ops_analyst = users["ops_analyst"]

    vn220 = flights["VN220"]
    vj123 = flights["VJ123"]
    liberty_room = rooms["Liberty Central Saigon:Deluxe"]
    melia_room = rooms["Melia Hanoi:Premium"]
    pq_schedule = next(schedule for schedule in db.query(TourSchedule).all() if schedule.tour.code == "PQ-3N2D")
    dl_schedule = next(schedule for schedule in db.query(TourSchedule).all() if schedule.tour.code == "DL-4N3D")

    welcome_coupon = coupons["WELCOME10"]
    hotel_coupon = coupons["HOTEL15"]
    tour_coupon = coupons["TOUR300K"]
    flight_coupon = coupons["FLIGHT200K"]

    # Booking 1: confirmed flight booking for QA.
    booking_a_base = Decimal(str(vn220.base_price))
    booking_a_discount = Decimal("185000.00")
    booking_a = upsert_booking(
        db,
        booking_code=DEMO_BOOKING_CODE,
        user=qa_customer,
        status=BookingStatus.confirmed,
        payment_status=PaymentStatus.paid,
        total_base_amount=booking_a_base,
        total_discount_amount=booking_a_discount,
        total_final_amount=booking_a_base - booking_a_discount,
        booked_at=anchor_datetime + timedelta(hours=1),
        coupon=welcome_coupon,
        notes="Primary demo flight booking for QA and release verification.",
    )
    upsert_booking_item(
        db,
        booking=booking_a,
        item_type=BookingItemType.flight,
        quantity=1,
        unit_price=booking_a_base,
        total_price=booking_a_base,
        flight=vn220,
        metadata_json={
            "seed_profile": "rich_demo",
            "segment": "flight",
            "anchor_datetime": anchor_datetime.isoformat(),
        },
    )
    traveler_a = upsert_traveler(
        db,
        booking=booking_a,
        full_name="QA Traveler",
        traveler_type=TravelerType.adult,
        date_of_birth=date(1993, 6, 15),
        passport_number="P1234567",
        nationality="Vietnam",
        document_type=DocumentType.passport,
    )
    payment_a = upsert_payment(
        db,
        booking=booking_a,
        gateway_order_ref="DEMO-ORDER-FLIGHT-001",
        initiated_by=qa_customer,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.paid,
        amount=booking_a.total_final_amount,
        idempotency_key="demo-flight-booking-001",
        gateway_transaction_ref="DEMO-TXN-FLIGHT-001",
        paid_at=anchor_datetime + timedelta(hours=1, minutes=5),
    )
    upsert_payment_transaction(
        db,
        payment=payment_a,
        transaction_ref="DEMO-TXN-FLIGHT-001",
        event_type="capture",
        status=PaymentStatus.paid,
        amount=booking_a.total_final_amount,
        created_at=anchor_datetime + timedelta(hours=1, minutes=5),
        raw_response={"gateway": "vnpay", "status": "paid"},
    )
    upsert_payment_callback(
        db,
        payment=payment_a,
        gateway_name="vnpay",
        gateway_transaction_ref="DEMO-TXN-FLIGHT-001",
        callback_payload={"status": "paid", "booking_code": booking_a.booking_code},
        signature_valid=True,
        processed=True,
        received_at=anchor_datetime + timedelta(hours=1, minutes=6),
        source_ip="203.0.113.51",
    )
    upsert_coupon_usage(
        db,
        coupon=welcome_coupon,
        user=qa_customer,
        booking=booking_a,
        used_at=anchor_datetime + timedelta(hours=1),
    )

    # Booking 2: pending hotel booking.
    hotel_nights = Decimal("3")
    booking_b_base = Decimal(str(liberty_room.base_price_per_night)) * hotel_nights
    booking_b_discount = Decimal("400000.00")
    booking_b = upsert_booking(
        db,
        booking_code="BK-DEMO-HOTEL-001",
        user=family_customer,
        status=BookingStatus.pending,
        payment_status=PaymentStatus.pending,
        total_base_amount=booking_b_base,
        total_discount_amount=booking_b_discount,
        total_final_amount=booking_b_base - booking_b_discount,
        booked_at=anchor_datetime + timedelta(days=1, hours=2),
        coupon=hotel_coupon,
        expires_at=anchor_datetime + timedelta(days=1, hours=8),
        notes="Pending hotel booking waiting for payment completion.",
    )
    upsert_booking_item(
        db,
        booking=booking_b,
        item_type=BookingItemType.hotel,
        quantity=1,
        unit_price=Decimal(str(liberty_room.base_price_per_night)),
        total_price=booking_b_base,
        room=liberty_room,
        check_in_date=anchor_datetime.date() + timedelta(days=12),
        check_out_date=anchor_datetime.date() + timedelta(days=15),
        metadata_json={
            "seed_profile": "rich_demo",
            "guests": 2,
            "hotel_name": "Liberty Central Saigon",
            "anchor_datetime": anchor_datetime.isoformat(),
        },
    )
    traveler_b1 = upsert_traveler(
        db,
        booking=booking_b,
        full_name="Family Lead Traveler",
        traveler_type=TravelerType.adult,
        date_of_birth=date(1989, 3, 18),
        passport_number="FAM100001",
        nationality="Vietnam",
        document_type=DocumentType.national_id,
    )
    traveler_b2 = upsert_traveler(
        db,
        booking=booking_b,
        full_name="Family Companion",
        traveler_type=TravelerType.adult,
        date_of_birth=date(1991, 9, 2),
        passport_number="FAM100002",
        nationality="Vietnam",
        document_type=DocumentType.national_id,
    )
    payment_b = upsert_payment(
        db,
        booking=booking_b,
        gateway_order_ref="DEMO-ORDER-HOTEL-001",
        initiated_by=family_customer,
        payment_method=PaymentMethod.stripe,
        status=PaymentStatus.pending,
        amount=booking_b.total_final_amount,
        idempotency_key="demo-hotel-booking-001",
    )
    upsert_payment_transaction(
        db,
        payment=payment_b,
        transaction_ref="DEMO-TXN-HOTEL-001",
        event_type="intent_created",
        status=PaymentStatus.pending,
        amount=booking_b.total_final_amount,
        created_at=anchor_datetime + timedelta(days=1, hours=2, minutes=2),
        raw_response={"gateway": "stripe", "status": "requires_payment_method"},
    )
    upsert_coupon_usage(
        db,
        coupon=hotel_coupon,
        user=family_customer,
        booking=booking_b,
        used_at=anchor_datetime + timedelta(days=1, hours=2),
    )

    # Booking 3: paid tour booking.
    booking_c_base = (
        get_tour_price(pq_schedule, TravelerType.adult)
        + get_tour_price(pq_schedule, TravelerType.child)
        + get_tour_price(pq_schedule, TravelerType.infant)
    )
    booking_c_discount = Decimal("300000.00")
    booking_c = upsert_booking(
        db,
        booking_code="BK-DEMO-TOUR-001",
        user=family_customer,
        status=BookingStatus.confirmed,
        payment_status=PaymentStatus.paid,
        total_base_amount=booking_c_base,
        total_discount_amount=booking_c_discount,
        total_final_amount=booking_c_base - booking_c_discount,
        booked_at=anchor_datetime + timedelta(days=2, hours=3),
        coupon=tour_coupon,
        notes="Family tour booking used for traveler and voucher flows.",
    )
    upsert_booking_item(
        db,
        booking=booking_c,
        item_type=BookingItemType.tour,
        quantity=3,
        unit_price=booking_c_base,
        total_price=booking_c_base,
        schedule=pq_schedule,
        metadata_json={
            "seed_profile": "rich_demo",
            "tour_id": str(pq_schedule.tour_id),
            "departure_date": pq_schedule.departure_date.isoformat(),
            "anchor_datetime": anchor_datetime.isoformat(),
        },
    )
    traveler_c1 = upsert_traveler(
        db,
        booking=booking_c,
        full_name="Family Parent",
        traveler_type=TravelerType.adult,
        date_of_birth=date(1987, 11, 5),
        passport_number="TOUR200001",
        nationality="Vietnam",
        document_type=DocumentType.passport,
    )
    traveler_c2 = upsert_traveler(
        db,
        booking=booking_c,
        full_name="Family Child",
        traveler_type=TravelerType.child,
        date_of_birth=date(2016, 7, 20),
        passport_number="TOUR200002",
        nationality="Vietnam",
        document_type=DocumentType.passport,
    )
    traveler_c3 = upsert_traveler(
        db,
        booking=booking_c,
        full_name="Family Infant",
        traveler_type=TravelerType.infant,
        date_of_birth=date(2024, 1, 12),
        passport_number="TOUR200003",
        nationality="Vietnam",
        document_type=DocumentType.passport,
    )
    payment_c = upsert_payment(
        db,
        booking=booking_c,
        gateway_order_ref="DEMO-ORDER-TOUR-001",
        initiated_by=family_customer,
        payment_method=PaymentMethod.stripe,
        status=PaymentStatus.paid,
        amount=booking_c.total_final_amount,
        idempotency_key="demo-tour-booking-001",
        gateway_transaction_ref="DEMO-TXN-TOUR-001",
        paid_at=anchor_datetime + timedelta(days=2, hours=3, minutes=10),
    )
    upsert_payment_transaction(
        db,
        payment=payment_c,
        transaction_ref="DEMO-TXN-TOUR-001",
        event_type="capture",
        status=PaymentStatus.paid,
        amount=booking_c.total_final_amount,
        created_at=anchor_datetime + timedelta(days=2, hours=3, minutes=10),
        raw_response={"gateway": "stripe", "status": "succeeded"},
    )
    upsert_coupon_usage(
        db,
        coupon=tour_coupon,
        user=family_customer,
        booking=booking_c,
        used_at=anchor_datetime + timedelta(days=2, hours=3),
    )

    # Booking 4: refunded flight booking.
    booking_d_base = Decimal(str(vj123.base_price)) * Decimal("2")
    booking_d_discount = Decimal("200000.00")
    booking_d = upsert_booking(
        db,
        booking_code="BK-DEMO-FLIGHT-REFUND-001",
        user=luxury_customer,
        status=BookingStatus.cancelled,
        payment_status=PaymentStatus.refunded,
        total_base_amount=booking_d_base,
        total_discount_amount=booking_d_discount,
        total_final_amount=booking_d_base - booking_d_discount,
        booked_at=anchor_datetime + timedelta(days=3, hours=1),
        coupon=flight_coupon,
        cancelled_at=anchor_datetime + timedelta(days=4, hours=9),
        cancellation_reason="Customer changed travel plan after payment.",
        notes="Cancelled after successful capture to exercise refund flows.",
    )
    upsert_booking_item(
        db,
        booking=booking_d,
        item_type=BookingItemType.flight,
        quantity=2,
        unit_price=Decimal(str(vj123.base_price)),
        total_price=booking_d_base,
        flight=vj123,
        metadata_json={
            "seed_profile": "rich_demo",
            "segment": "flight",
            "passengers": 2,
        },
    )
    traveler_d1 = upsert_traveler(
        db,
        booking=booking_d,
        full_name="Luxury Guest One",
        traveler_type=TravelerType.adult,
        date_of_birth=date(1985, 2, 9),
        passport_number="LUX300001",
        nationality="Vietnam",
        document_type=DocumentType.passport,
    )
    traveler_d2 = upsert_traveler(
        db,
        booking=booking_d,
        full_name="Luxury Guest Two",
        traveler_type=TravelerType.adult,
        date_of_birth=date(1986, 4, 17),
        passport_number="LUX300002",
        nationality="Vietnam",
        document_type=DocumentType.passport,
    )
    payment_d = upsert_payment(
        db,
        booking=booking_d,
        gateway_order_ref="DEMO-ORDER-FLIGHT-REFUND-001",
        initiated_by=luxury_customer,
        payment_method=PaymentMethod.momo,
        status=PaymentStatus.refunded,
        amount=booking_d.total_final_amount,
        idempotency_key="demo-flight-refund-booking-001",
        gateway_transaction_ref="DEMO-TXN-FLIGHT-REFUND-001",
        paid_at=anchor_datetime + timedelta(days=3, hours=1, minutes=7),
    )
    upsert_payment_transaction(
        db,
        payment=payment_d,
        transaction_ref="DEMO-TXN-FLIGHT-REFUND-001",
        event_type="capture",
        status=PaymentStatus.paid,
        amount=booking_d.total_final_amount,
        created_at=anchor_datetime + timedelta(days=3, hours=1, minutes=7),
        raw_response={"gateway": "momo", "status": "paid"},
    )
    upsert_refund(
        db,
        payment=payment_d,
        amount=booking_d.total_final_amount,
        status=RefundStatus.processed,
        reason="Full refund issued after traveler cancellation request.",
        created_at=anchor_datetime + timedelta(days=4, hours=9, minutes=30),
        processed_at=anchor_datetime + timedelta(days=4, hours=10),
    )
    upsert_coupon_usage(
        db,
        coupon=flight_coupon,
        user=luxury_customer,
        booking=booking_d,
        used_at=anchor_datetime + timedelta(days=3, hours=1),
    )

    # Booking 5: failed hotel payment.
    booking_e_base = Decimal(str(melia_room.base_price_per_night)) * Decimal("2")
    booking_e = upsert_booking(
        db,
        booking_code="BK-DEMO-HOTEL-FAILED-001",
        user=luxury_customer,
        status=BookingStatus.failed,
        payment_status=PaymentStatus.failed,
        total_base_amount=booking_e_base,
        total_discount_amount=Decimal("0.00"),
        total_final_amount=booking_e_base,
        booked_at=anchor_datetime + timedelta(days=5, hours=4),
        notes="Payment authorization failed after 3DS timeout.",
    )
    upsert_booking_item(
        db,
        booking=booking_e,
        item_type=BookingItemType.hotel,
        quantity=1,
        unit_price=Decimal(str(melia_room.base_price_per_night)),
        total_price=booking_e_base,
        room=melia_room,
        check_in_date=anchor_datetime.date() + timedelta(days=18),
        check_out_date=anchor_datetime.date() + timedelta(days=20),
        metadata_json={"seed_profile": "rich_demo", "guests": 1},
    )
    traveler_e = upsert_traveler(
        db,
        booking=booking_e,
        full_name="Luxury Solo Traveler",
        traveler_type=TravelerType.adult,
        date_of_birth=date(1990, 12, 1),
        passport_number="LUX400001",
        nationality="Vietnam",
        document_type=DocumentType.passport,
    )
    payment_e = upsert_payment(
        db,
        booking=booking_e,
        gateway_order_ref="DEMO-ORDER-HOTEL-FAILED-001",
        initiated_by=luxury_customer,
        payment_method=PaymentMethod.stripe,
        status=PaymentStatus.failed,
        amount=booking_e.total_final_amount,
        idempotency_key="demo-hotel-failed-booking-001",
        failed_at=anchor_datetime + timedelta(days=5, hours=4, minutes=11),
        failure_reason="3DS authentication timed out",
    )
    upsert_payment_transaction(
        db,
        payment=payment_e,
        transaction_ref="DEMO-TXN-HOTEL-FAILED-001",
        event_type="authorization_failed",
        status=PaymentStatus.failed,
        amount=booking_e.total_final_amount,
        created_at=anchor_datetime + timedelta(days=5, hours=4, minutes=11),
        raw_response={"gateway": "stripe", "status": "failed", "reason": "3ds_timeout"},
    )

    # Booking 6: expired tour hold.
    booking_f_base = get_tour_price(dl_schedule, TravelerType.adult) * Decimal("2")
    booking_f = upsert_booking(
        db,
        booking_code="BK-DEMO-TOUR-EXPIRED-001",
        user=qa_customer,
        status=BookingStatus.expired,
        payment_status=PaymentStatus.pending,
        total_base_amount=booking_f_base,
        total_discount_amount=Decimal("0.00"),
        total_final_amount=booking_f_base,
        booked_at=anchor_datetime + timedelta(days=6, hours=1),
        expires_at=anchor_datetime + timedelta(days=6, hours=2),
        notes="Expired booking hold retained for admin filters and lifecycle checks.",
    )
    upsert_booking_item(
        db,
        booking=booking_f,
        item_type=BookingItemType.tour,
        quantity=2,
        unit_price=booking_f_base,
        total_price=booking_f_base,
        schedule=dl_schedule,
        metadata_json={
            "seed_profile": "rich_demo",
            "tour_id": str(dl_schedule.tour_id),
            "departure_date": dl_schedule.departure_date.isoformat(),
            "hold_expired": True,
        },
    )
    upsert_traveler(
        db,
        booking=booking_f,
        full_name="QA Traveler Companion",
        traveler_type=TravelerType.adult,
        date_of_birth=date(1994, 8, 8),
        passport_number="QA500001",
        nationality="Vietnam",
        document_type=DocumentType.passport,
    )
    upsert_traveler(
        db,
        booking=booking_f,
        full_name="QA Traveler Parent",
        traveler_type=TravelerType.adult,
        date_of_birth=date(1971, 5, 6),
        passport_number="QA500002",
        nationality="Vietnam",
        document_type=DocumentType.passport,
    )
    upsert_payment(
        db,
        booking=booking_f,
        gateway_order_ref="DEMO-ORDER-TOUR-EXPIRED-001",
        initiated_by=qa_customer,
        payment_method=PaymentMethod.manual,
        status=PaymentStatus.pending,
        amount=booking_f.total_final_amount,
        idempotency_key="demo-tour-expired-booking-001",
    )

    # Related documents.
    doc_a_passport = upsert_document(
        db,
        user=qa_customer,
        booking=booking_a,
        traveler=traveler_a,
        storage_key="demo/booking-a/passport.pdf",
        original_filename="qa-traveler-passport.pdf",
        stored_filename="qa-traveler-passport-seeded.pdf",
        document_type=DocumentType.passport,
        status="approved",
        uploaded_at=anchor_datetime + timedelta(hours=1, minutes=20),
        reviewer=doc_reviewer,
        reviewed_at=anchor_datetime + timedelta(hours=2),
    )
    doc_a_voucher = upsert_document(
        db,
        user=qa_customer,
        booking=booking_a,
        storage_key="demo/booking-a/voucher.pdf",
        original_filename="BK-DEMO-FLIGHT-001.pdf",
        stored_filename="bk-demo-flight-001-voucher.pdf",
        document_type=DocumentType.voucher,
        status="approved",
        uploaded_at=anchor_datetime + timedelta(hours=1, minutes=30),
        reviewer=admin,
        reviewed_at=anchor_datetime + timedelta(hours=2, minutes=5),
    )
    upsert_document(
        db,
        user=family_customer,
        booking=booking_b,
        traveler=traveler_b1,
        storage_key="demo/booking-b/national-id.pdf",
        original_filename="family-id.pdf",
        stored_filename="family-id-seeded.pdf",
        document_type=DocumentType.national_id,
        status="pending",
        uploaded_at=anchor_datetime + timedelta(days=1, hours=2, minutes=15),
    )
    upsert_document(
        db,
        user=family_customer,
        booking=booking_c,
        traveler=traveler_c1,
        storage_key="demo/booking-c/passport-parent.pdf",
        original_filename="tour-parent-passport.pdf",
        stored_filename="tour-parent-passport-seeded.pdf",
        document_type=DocumentType.passport,
        status="approved",
        uploaded_at=anchor_datetime + timedelta(days=2, hours=3, minutes=20),
        reviewer=doc_reviewer,
        reviewed_at=anchor_datetime + timedelta(days=2, hours=5),
    )
    doc_c_voucher = upsert_document(
        db,
        user=family_customer,
        booking=booking_c,
        storage_key="demo/booking-c/voucher.pdf",
        original_filename="BK-DEMO-TOUR-001.pdf",
        stored_filename="bk-demo-tour-001-voucher.pdf",
        document_type=DocumentType.voucher,
        status="approved",
        uploaded_at=anchor_datetime + timedelta(days=2, hours=4),
        reviewer=admin,
        reviewed_at=anchor_datetime + timedelta(days=2, hours=4, minutes=30),
    )
    upsert_document(
        db,
        user=luxury_customer,
        booking=booking_d,
        traveler=traveler_d1,
        storage_key="demo/booking-d/passport.pdf",
        original_filename="luxury-passport.pdf",
        stored_filename="luxury-passport-seeded.pdf",
        document_type=DocumentType.passport,
        status="approved",
        uploaded_at=anchor_datetime + timedelta(days=3, hours=1, minutes=30),
        reviewer=doc_reviewer,
        reviewed_at=anchor_datetime + timedelta(days=3, hours=2),
    )
    upsert_document(
        db,
        user=luxury_customer,
        booking=booking_e,
        traveler=traveler_e,
        storage_key="demo/booking-e/visa.pdf",
        original_filename="luxury-visa.pdf",
        stored_filename="luxury-visa-seeded.pdf",
        document_type=DocumentType.visa,
        status="rejected",
        uploaded_at=anchor_datetime + timedelta(days=5, hours=4, minutes=30),
        reviewer=doc_reviewer,
        reviewed_at=anchor_datetime + timedelta(days=5, hours=6),
    )

    # Support tickets.
    ticket_a = upsert_support_ticket(
        db,
        reference="SR-DEMO-001",
        user=qa_customer,
        requester_name=qa_customer.full_name,
        requester_email=qa_customer.email,
        topic_id="booking_change",
        subject="Need to confirm baggage allowance",
        message="Can your team confirm the baggage allowance for BK-DEMO-FLIGHT-001 before departure?",
        status="resolved",
        created_at=anchor_datetime + timedelta(hours=2, minutes=10),
        updated_at=anchor_datetime + timedelta(hours=3),
        booking=booking_a,
    )
    upsert_support_reply(
        db,
        ticket=ticket_a,
        author_name=qa_customer.full_name,
        author_role="traveler",
        author_user=qa_customer,
        message="Please help double check baggage and boarding time for my ticket.",
        created_at=anchor_datetime + timedelta(hours=2, minutes=12),
    )
    upsert_support_reply(
        db,
        ticket=ticket_a,
        author_name=support_agent.full_name,
        author_role="support",
        author_user=support_agent,
        message="We confirmed the booking includes 20kg checked baggage and standard cabin allowance.",
        created_at=anchor_datetime + timedelta(hours=2, minutes=45),
    )

    ticket_c = upsert_support_ticket(
        db,
        reference="SR-DEMO-002",
        user=family_customer,
        requester_name=family_customer.full_name,
        requester_email=family_customer.email,
        topic_id="document_review",
        subject="Need help with traveler documents for tour",
        message="One child passport was uploaded late. Can we still keep the tour schedule as planned?",
        status="waiting_for_traveler",
        created_at=anchor_datetime + timedelta(days=2, hours=6),
        updated_at=anchor_datetime + timedelta(days=2, hours=8),
        booking=booking_c,
    )
    upsert_support_reply(
        db,
        ticket=ticket_c,
        author_name=support_agent.full_name,
        author_role="support",
        author_user=support_agent,
        message="Please upload the missing passport scan before 17:00 UTC and we will finalize review.",
        created_at=anchor_datetime + timedelta(days=2, hours=7),
    )

    ticket_d = upsert_support_ticket(
        db,
        reference="SR-DEMO-003",
        user=luxury_customer,
        requester_name=luxury_customer.full_name,
        requester_email=luxury_customer.email,
        topic_id="refund",
        subject="Refund timeline after cancelled flight",
        message="Please confirm when the refunded amount will be visible in my wallet after the cancellation.",
        status="in_review",
        created_at=anchor_datetime + timedelta(days=4, hours=10, minutes=30),
        updated_at=anchor_datetime + timedelta(days=4, hours=11),
        booking=booking_d,
    )
    upsert_support_reply(
        db,
        ticket=ticket_d,
        author_name=luxury_customer.full_name,
        author_role="traveler",
        author_user=luxury_customer,
        message="Refund processed on your side, but I still need the expected settlement timeline.",
        created_at=anchor_datetime + timedelta(days=4, hours=10, minutes=35),
    )
    upsert_support_reply(
        db,
        ticket=ticket_d,
        author_name=support_agent.full_name,
        author_role="support",
        author_user=support_agent,
        message="The refund was processed successfully and should settle within 3 to 5 business days.",
        created_at=anchor_datetime + timedelta(days=4, hours=10, minutes=55),
    )

    # Supporting tables.
    upsert_app_setting(
        db,
        key="checkout.settings",
        value={
            "enabled_payment_methods": ["vnpay", "stripe", "manual"],
            "voucher_auto_generation": True,
            "demo_mode": True,
        },
        updated_at=anchor_datetime + timedelta(days=6),
        updated_by=ops_analyst,
    )
    upsert_app_setting(
        db,
        key="support.sla",
        value={"first_response_minutes": 45, "business_hours": "08:00-20:00 UTC"},
        updated_at=anchor_datetime + timedelta(days=6, minutes=5),
        updated_by=support_agent,
    )
    upsert_app_setting(
        db,
        key="documents.review",
        value={"auto_assign_reviewer": True, "review_queue_limit": 50},
        updated_at=anchor_datetime + timedelta(days=6, minutes=10),
        updated_by=doc_reviewer,
    )

    upsert_audit_log(
        db,
        action="seed_demo_environment_completed",
        resource_type="system",
        actor_type=LogActorType.system,
        created_at=anchor_datetime + timedelta(days=6, minutes=30),
        metadata_json={"profile": "rich_demo"},
    )
    upsert_audit_log(
        db,
        action="booking_created",
        resource_type="booking",
        resource_id=booking_a.id,
        actor_type=LogActorType.user,
        actor_user=qa_customer,
        created_at=anchor_datetime + timedelta(hours=1),
        ip_address="203.0.113.11",
        user_agent="TravelBookWeb/1.5 (Macintosh)",
        metadata_json={"booking_code": booking_a.booking_code},
    )
    upsert_audit_log(
        db,
        action="payment_callback_processed",
        resource_type="payment",
        resource_id=payment_a.id,
        actor_type=LogActorType.system,
        created_at=anchor_datetime + timedelta(hours=1, minutes=6),
        metadata_json={"gateway": "vnpay", "status": "paid"},
        ip_address="203.0.113.51",
    )
    upsert_audit_log(
        db,
        action="document_review_completed",
        resource_type="uploaded_document",
        resource_id=doc_a_passport.id,
        actor_type=LogActorType.admin,
        actor_user=doc_reviewer,
        created_at=anchor_datetime + timedelta(hours=2),
        metadata_json={"status": "approved"},
    )
    upsert_audit_log(
        db,
        action="support_ticket_created",
        resource_type="support_ticket",
        resource_id=ticket_a.id,
        actor_type=LogActorType.user,
        actor_user=qa_customer,
        created_at=anchor_datetime + timedelta(hours=2, minutes=10),
        metadata_json={"reference": ticket_a.reference},
    )
    upsert_audit_log(
        db,
        action="admin_support_ticket_replied",
        resource_type="support_ticket",
        resource_id=ticket_d.id,
        actor_type=LogActorType.admin,
        actor_user=support_agent,
        created_at=anchor_datetime + timedelta(days=4, hours=10, minutes=55),
        metadata_json={"reference": ticket_d.reference, "status": ticket_d.status},
    )
    upsert_audit_log(
        db,
        action="refund_processed",
        resource_type="refund",
        resource_id=db.query(Refund).filter(Refund.payment_id == payment_d.id).one().id,
        actor_type=LogActorType.admin,
        actor_user=ops_analyst,
        created_at=anchor_datetime + timedelta(days=4, hours=10),
        metadata_json={"booking_code": booking_d.booking_code},
    )
    upsert_audit_log(
        db,
        action="admin_view_dashboard_summary",
        resource_type="dashboard",
        actor_type=LogActorType.admin,
        actor_user=admin,
        created_at=anchor_datetime + timedelta(days=6, hours=1),
        metadata_json={"recent_limit": 10},
    )
    upsert_audit_log(
        db,
        action="admin_list_bookings",
        resource_type="booking",
        actor_type=LogActorType.admin,
        actor_user=ops_analyst,
        created_at=anchor_datetime + timedelta(days=6, hours=1, minutes=5),
        metadata_json={"page": 1, "page_size": 20, "result_count": 6},
    )
    upsert_audit_log(
        db,
        action="booking_voucher_generated",
        resource_type="uploaded_document",
        resource_id=doc_c_voucher.id,
        actor_type=LogActorType.user,
        actor_user=family_customer,
        created_at=anchor_datetime + timedelta(days=2, hours=4),
        metadata_json={"booking_code": booking_c.booking_code},
    )

    upsert_security_event(
        db,
        title="Multiple failed login attempts for locked customer",
        event_type=SecurityEventType.auth,
        severity="high",
        related_user=users["locked_customer"],
        ip_address="198.51.100.77",
        detected_at=anchor_datetime + timedelta(hours=5, minutes=3),
        description="Five consecutive failed logins triggered account suspension.",
        event_data={"failed_login_count": 5},
    )
    upsert_security_event(
        db,
        title="Refund processed for cancelled flight booking",
        event_type=SecurityEventType.payment,
        severity="medium",
        related_user=luxury_customer,
        detected_at=anchor_datetime + timedelta(days=4, hours=10),
        description="Refund settled after cancellation review completed.",
        event_data={"booking_code": booking_d.booking_code, "amount": str(booking_d.total_final_amount)},
    )
    upsert_security_event(
        db,
        title="Rejected visa document requires traveler action",
        event_type=SecurityEventType.upload,
        severity="low",
        related_user=luxury_customer,
        detected_at=anchor_datetime + timedelta(days=5, hours=6),
        description="Uploaded visa file was rejected during manual review.",
        event_data={"booking_code": booking_e.booking_code},
    )

    upsert_notification_read_state(
        db,
        user=qa_customer,
        notification_id=f"booking-{booking_a.id}",
        read_at=anchor_datetime + timedelta(hours=2, minutes=30),
    )
    upsert_notification_read_state(
        db,
        user=qa_customer,
        notification_id=f"document-{doc_a_voucher.id}",
        read_at=anchor_datetime + timedelta(hours=2, minutes=31),
    )
    upsert_notification_read_state(
        db,
        user=family_customer,
        notification_id=f"support-{ticket_c.id}",
        read_at=anchor_datetime + timedelta(days=2, hours=8, minutes=15),
    )
    upsert_notification_read_state(
        db,
        user=luxury_customer,
        notification_id=f"refund-{db.query(Refund).filter(Refund.payment_id == payment_d.id).one().id}",
        read_at=anchor_datetime + timedelta(days=4, hours=10, minutes=40),
    )

    upsert_outbox_event(
        db,
        seed_key="booking-confirmation-flight",
        target="email",
        handler="send_booking_created_email",
        status="processed",
        payload={
            "kwargs": {
                "to_email": qa_customer.email,
                "full_name": qa_customer.full_name,
                "booking_code": booking_a.booking_code,
                "total_amount": str(booking_a.total_final_amount),
                "currency": "VND",
            }
        },
        available_at=anchor_datetime + timedelta(hours=1),
        processed_at=anchor_datetime + timedelta(hours=1, minutes=2),
        attempt_count=1,
        claimed_by="demo-worker-1",
        claim_token="claim-booking-confirmation-flight",
        processing_started_at=anchor_datetime + timedelta(hours=1, minutes=1),
        lease_expires_at=anchor_datetime + timedelta(hours=1, minutes=6),
    )
    upsert_outbox_event(
        db,
        seed_key="tour-payment-success",
        target="notification",
        handler="notify_booking_created",
        status="pending",
        payload={
            "kwargs": {
                "user_id": str(family_customer.id),
                "booking_id": str(booking_c.id),
                "booking_code": booking_c.booking_code,
            }
        },
        available_at=anchor_datetime + timedelta(days=2, hours=3, minutes=11),
    )
    upsert_outbox_event(
        db,
        seed_key="refund-processed-email",
        target="email",
        handler="send_refund_processed_email",
        status="failed",
        payload={
            "kwargs": {
                "to_email": luxury_customer.email,
                "full_name": luxury_customer.full_name,
                "booking_code": booking_d.booking_code,
                "refund_amount": str(booking_d.total_final_amount),
                "currency": "VND",
            }
        },
        available_at=anchor_datetime + timedelta(days=4, hours=10, minutes=5),
        attempt_count=2,
        last_error="SMTP timeout while dispatching refund_processed template",
    )

    # Keep inventory-facing numbers realistic.
    vn220.available_seats = 49
    vj123.available_seats = 60
    pq_schedule.available_slots = 17
    pq_schedule.status = TourScheduleStatus.scheduled
    dl_schedule.available_slots = 15
    dl_schedule.status = TourScheduleStatus.scheduled
    db.flush()

    sync_coupon_counts(
        db,
        coupons=[welcome_coupon, hotel_coupon, tour_coupon, flight_coupon],
    )

    return {
        "bookings": {
            "primary": booking_a,
            "hotel_pending": booking_b,
            "tour_paid": booking_c,
            "flight_refunded": booking_d,
            "hotel_failed": booking_e,
            "tour_expired": booking_f,
        },
        "documents": {
            "primary_passport": doc_a_passport,
            "primary_voucher": doc_a_voucher,
        },
    }


def main() -> None:
    args = parse_args()
    anchor_datetime = resolve_anchor_datetime(args.anchor_datetime)
    db = SessionLocal()

    try:
        with db.begin():
            seed_catalog(db, anchor_datetime=anchor_datetime)
            seed_default_coupons(db, anchor_datetime=anchor_datetime)
            users = seed_roles_and_users(db, anchor_datetime=anchor_datetime)
            seeded = seed_bookings_and_related_data(
                db,
                anchor_datetime=anchor_datetime,
                users=users,
            )

        booking_codes = [
            booking.booking_code for booking in seeded["bookings"].values()
        ]
        print("Demo seed completed successfully.")
        print(f"anchor_datetime={anchor_datetime.isoformat()}")
        print(f"admin_email={ADMIN_EMAIL}")
        print(f"admin_password={ADMIN_PASSWORD}")
        print(f"customer_email={CUSTOMER_EMAIL}")
        print(f"customer_password={CUSTOMER_PASSWORD}")
        print(f"booking_code={seeded['bookings']['primary'].booking_code}")
        print(f"seeded_booking_codes={','.join(booking_codes)}")
        print(
            "seeded_staff_emails="
            f"{SUPPORT_AGENT_EMAIL},{DOC_REVIEWER_EMAIL},{OPS_ANALYST_EMAIL}"
        )
        print("coupon_codes=WELCOME10,FLIGHT200K,HOTEL15,TOUR300K")
    finally:
        db.close()


if __name__ == "__main__":
    main()

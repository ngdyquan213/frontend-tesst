import enum


class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    deleted = "deleted"


class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    expired = "expired"
    failed = "failed"


class BookingItemType(str, enum.Enum):
    flight = "flight"
    hotel = "hotel"
    tour = "tour"
    package = "package"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    authorized = "authorized"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"
    cancelled = "cancelled"


class PaymentMethod(str, enum.Enum):
    vnpay = "vnpay"
    momo = "momo"
    stripe = "stripe"
    manual = "manual"


class DocumentType(str, enum.Enum):
    passport = "passport"
    visa = "visa"
    national_id = "national_id"
    invoice = "invoice"
    voucher = "voucher"
    other = "other"


class CouponType(str, enum.Enum):
    percentage = "percentage"
    fixed_amount = "fixed_amount"


class LogActorType(str, enum.Enum):
    user = "user"
    admin = "admin"
    system = "system"
    service = "service"


class SecurityEventType(str, enum.Enum):
    auth = "auth"
    access_control = "access_control"
    payment = "payment"
    upload = "upload"
    suspicious_activity = "suspicious_activity"
    system = "system"


class TourStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    inactive = "inactive"
    archived = "archived"


class TourScheduleStatus(str, enum.Enum):
    scheduled = "scheduled"
    sold_out = "sold_out"
    cancelled = "cancelled"
    closed = "closed"


class TravelerType(str, enum.Enum):
    adult = "adult"
    child = "child"
    infant = "infant"


class CouponApplicableProductType(str, enum.Enum):
    all = "all"
    flight = "flight"
    hotel = "hotel"
    tour = "tour"


class RefundStatus(str, enum.Enum):
    pending = "pending"
    processed = "processed"
    failed = "failed"
    cancelled = "cancelled"

from app.models.enums import DocumentType, PaymentMethod, PaymentStatus

API_V1_PREFIX = "/api/v1"

DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

SUPPORTED_PAYMENT_METHODS = frozenset(method.value for method in PaymentMethod)
SUPPORTED_DOCUMENT_TYPES = frozenset(document_type.value for document_type in DocumentType)

BOOKABLE_FLIGHT_STATUSES = frozenset({"scheduled"})
ALLOWED_PAYMENT_CALLBACK_STATUSES = frozenset(
    {
        PaymentStatus.paid.value,
        PaymentStatus.failed.value,
        PaymentStatus.cancelled.value,
    }
)

REQUEST_ID_HEADER = "X-Request-ID"
IDEMPOTENCY_KEY_HEADER = "Idempotency-Key"

PERM_ADMIN_USERS_READ = "admin.users.read"
PERM_ADMIN_BOOKINGS_READ = "admin.bookings.read"
PERM_ADMIN_PAYMENTS_READ = "admin.payments.read"
PERM_ADMIN_AUDIT_LOGS_READ = "admin.audit_logs.read"
PERM_ADMIN_COUPONS_READ = "admin.coupons.read"
PERM_ADMIN_COUPONS_WRITE = "admin.coupons.write"
PERM_ADMIN_REFUNDS_READ = "admin.refunds.read"
PERM_ADMIN_REFUNDS_WRITE = "admin.refunds.write"
PERM_ADMIN_TOURS_READ = "admin.tours.read"
PERM_ADMIN_TOURS_WRITE = "admin.tours.write"
PERM_ADMIN_DASHBOARD_READ = "admin.dashboard.read"
PERM_ADMIN_EXPORTS_READ = "admin.exports.read"

ALL_ADMIN_PERMISSIONS = (
    PERM_ADMIN_USERS_READ,
    PERM_ADMIN_BOOKINGS_READ,
    PERM_ADMIN_PAYMENTS_READ,
    PERM_ADMIN_AUDIT_LOGS_READ,
    PERM_ADMIN_COUPONS_READ,
    PERM_ADMIN_COUPONS_WRITE,
    PERM_ADMIN_REFUNDS_READ,
    PERM_ADMIN_REFUNDS_WRITE,
    PERM_ADMIN_TOURS_READ,
    PERM_ADMIN_TOURS_WRITE,
    PERM_ADMIN_DASHBOARD_READ,
    PERM_ADMIN_EXPORTS_READ,
)

from sqlalchemy.orm import Session

from app.api.dependencies.service_registry import ServiceRegistry
from app.services.admin_bulk_service import AdminBulkService
from app.services.admin_coupon_service import AdminCouponService
from app.services.admin_dashboard_service import AdminDashboardService
from app.services.admin_export_service import AdminExportService
from app.services.admin_service import AdminService
from app.services.admin_tour_service import AdminTourService
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService
from app.services.booking_cancellation_service import BookingCancellationService
from app.services.booking_service import BookingService
from app.services.coupon_service import CouponService
from app.services.flight_service import FlightService
from app.services.hotel_booking_service import HotelBookingService
from app.services.hotel_service import HotelService
from app.services.payment_callback_service import PaymentCallbackService
from app.services.payment_service import PaymentService
from app.services.tour_booking_service import TourBookingService
from app.services.tour_service import TourService
from app.services.traveler_service import TravelerService
from app.services.upload_service import UploadService
from app.services.user_service import UserService
from app.services.voucher_service import VoucherService


def build_audit_service(db: Session) -> AuditService:
    return ServiceRegistry(db).audit_service


def build_admin_dashboard_service(db: Session) -> AdminDashboardService:
    return ServiceRegistry(db).build_admin_dashboard_service()


def build_admin_service(
    db: Session,
    *,
    include_payment_repo: bool = False,
    include_audit_service: bool = False,
) -> AdminService:
    return ServiceRegistry(db).build_admin_service(
        include_payment_repo=include_payment_repo,
        include_audit_service=include_audit_service,
    )


def build_admin_bulk_service(db: Session) -> AdminBulkService:
    return ServiceRegistry(db).build_admin_bulk_service()


def build_admin_tour_service(db: Session) -> AdminTourService:
    return ServiceRegistry(db).build_admin_tour_service()


def build_admin_coupon_service(db: Session) -> AdminCouponService:
    return ServiceRegistry(db).build_admin_coupon_service()


def build_auth_service(db: Session) -> AuthService:
    return ServiceRegistry(db).build_auth_service()


def build_booking_service(db: Session) -> BookingService:
    return ServiceRegistry(db).build_booking_service()


def build_hotel_booking_service(db: Session) -> HotelBookingService:
    return ServiceRegistry(db).build_hotel_booking_service()


def build_tour_booking_service(db: Session) -> TourBookingService:
    return ServiceRegistry(db).build_tour_booking_service()


def build_coupon_service(db: Session) -> CouponService:
    return ServiceRegistry(db).build_coupon_service()


def build_payment_service(db: Session) -> PaymentService:
    return ServiceRegistry(db).build_payment_service()


def build_payment_callback_service(db: Session) -> PaymentCallbackService:
    return ServiceRegistry(db).build_payment_callback_service()


def build_voucher_service(db: Session) -> VoucherService:
    return ServiceRegistry(db).build_voucher_service()


def build_admin_export_service(db: Session) -> AdminExportService:
    return ServiceRegistry(db).build_admin_export_service()


def build_flight_service(db: Session) -> FlightService:
    return ServiceRegistry(db).build_flight_service()


def build_hotel_service(db: Session) -> HotelService:
    return ServiceRegistry(db).build_hotel_service()


def build_tour_service(db: Session) -> TourService:
    return ServiceRegistry(db).build_tour_service()


def build_upload_service(db: Session) -> UploadService:
    return ServiceRegistry(db).build_upload_service()


def build_traveler_service(db: Session) -> TravelerService:
    return ServiceRegistry(db).build_traveler_service()


def build_booking_cancellation_service(db: Session) -> BookingCancellationService:
    return ServiceRegistry(db).build_booking_cancellation_service()


def build_user_service(db: Session) -> UserService:
    return ServiceRegistry(db).build_user_service()

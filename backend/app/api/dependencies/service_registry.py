from __future__ import annotations

from functools import cached_property

from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.admin_dashboard_repository import AdminDashboardRepository
from app.repositories.admin_repository import AdminRepository
from app.repositories.audit_repository import AuditRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.coupon_repository import CouponRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.flight_repository import FlightRepository
from app.repositories.hotel_repository import HotelRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.tour_repository import TourRepository
from app.repositories.user_repository import UserRepository
from app.services.admin_bulk_service import AdminBulkService
from app.services.admin_coupon_service import AdminCouponService
from app.services.admin_dashboard_service import AdminDashboardService
from app.services.admin_export_service import AdminExportService
from app.services.admin_service import AdminService
from app.services.admin_tour_service import AdminTourService
from app.services.audit_service import AuditService
from app.services.auth_domain_service import AuthDomainService
from app.services.auth_service import AuthService
from app.services.auth_token_service import AuthTokenService
from app.services.booking_cancellation_domain_service import BookingCancellationDomainService
from app.services.booking_cancellation_service import BookingCancellationService
from app.services.booking_inventory_service import BookingInventoryService
from app.services.booking_service import BookingService
from app.services.coupon_service import CouponService
from app.services.flight_service import FlightService
from app.services.hotel_booking_service import HotelBookingService
from app.services.hotel_service import HotelService
from app.services.malware_scan_service import MalwareScanService
from app.services.payment_callback_domain_service import PaymentCallbackDomainService
from app.services.payment_callback_service import PaymentCallbackService
from app.services.payment_service import PaymentService
from app.services.pdf_voucher_service import PDFVoucherService
from app.services.storage_service import StorageService
from app.services.tour_booking_service import TourBookingService
from app.services.tour_service import TourService
from app.services.traveler_service import TravelerService
from app.services.upload_service import UploadService
from app.services.user_service import UserService
from app.services.voucher_document_service import VoucherDocumentService
from app.services.voucher_render_service import VoucherRenderService
from app.services.voucher_service import VoucherService
from app.workers.email_worker import EmailWorker
from app.workers.factory import create_email_worker, create_notification_worker
from app.workers.notification_worker import NotificationWorker


class ServiceRegistry:
    def __init__(self, db: Session) -> None:
        self.db = db

    @cached_property
    def audit_repo(self) -> AuditRepository:
        return AuditRepository(self.db)

    @cached_property
    def audit_service(self) -> AuditService:
        return AuditService(self.audit_repo)

    @cached_property
    def admin_dashboard_repo(self) -> AdminDashboardRepository:
        return AdminDashboardRepository(self.db)

    @cached_property
    def admin_repo(self) -> AdminRepository:
        return AdminRepository(self.db)

    @cached_property
    def booking_repo(self) -> BookingRepository:
        return BookingRepository(self.db)

    @cached_property
    def coupon_repo(self) -> CouponRepository:
        return CouponRepository(self.db)

    @cached_property
    def document_repo(self) -> DocumentRepository:
        return DocumentRepository(self.db)

    @cached_property
    def flight_repo(self) -> FlightRepository:
        return FlightRepository(self.db)

    @cached_property
    def hotel_repo(self) -> HotelRepository:
        return HotelRepository(self.db)

    @cached_property
    def payment_repo(self) -> PaymentRepository:
        return PaymentRepository(self.db)

    @cached_property
    def tour_repo(self) -> TourRepository:
        return TourRepository(self.db)

    @cached_property
    def user_repo(self) -> UserRepository:
        return UserRepository(self.db)

    @cached_property
    def email_worker(self) -> EmailWorker:
        return create_email_worker()

    @cached_property
    def notification_worker(self) -> NotificationWorker:
        return create_notification_worker()

    @cached_property
    def storage_service(self) -> StorageService:
        return StorageService()

    @cached_property
    def malware_scan_service(self) -> MalwareScanService:
        return MalwareScanService()

    @cached_property
    def auth_domain_service(self) -> AuthDomainService:
        return AuthDomainService(
            max_failed_logins=settings.AUTH_MAX_FAILED_LOGINS,
            lockout_minutes=settings.AUTH_LOCKOUT_MINUTES,
        )

    @cached_property
    def auth_token_service(self) -> AuthTokenService:
        return AuthTokenService(self.user_repo)

    @cached_property
    def booking_cancellation_domain_service(self) -> BookingCancellationDomainService:
        return BookingCancellationDomainService()

    @cached_property
    def booking_inventory_service(self) -> BookingInventoryService:
        return BookingInventoryService(
            flight_repo=self.flight_repo,
            hotel_repo=self.hotel_repo,
            tour_repo=self.tour_repo,
        )

    @cached_property
    def payment_callback_domain_service(self) -> PaymentCallbackDomainService:
        return PaymentCallbackDomainService()

    @cached_property
    def pdf_voucher_service(self) -> PDFVoucherService:
        return PDFVoucherService()

    @cached_property
    def voucher_render_service(self) -> VoucherRenderService:
        return VoucherRenderService()

    @cached_property
    def voucher_document_service(self) -> VoucherDocumentService:
        return VoucherDocumentService(
            document_repo=self.document_repo,
            audit_service=self.audit_service,
            pdf_voucher_service=self.pdf_voucher_service,
            email_worker=self.email_worker,
            storage_service=self.storage_service,
        )

    def build_admin_dashboard_service(self) -> AdminDashboardService:
        return AdminDashboardService(
            self.admin_dashboard_repo,
            db=self.db,
            audit_service=self.audit_service,
        )

    def build_admin_service(
        self,
        *,
        include_payment_repo: bool = False,
        include_audit_service: bool = False,
    ) -> AdminService:
        return AdminService(
            db=self.db,
            user_repo=self.user_repo,
            admin_repo=self.admin_repo,
            payment_repo=self.payment_repo if include_payment_repo else None,
            audit_service=self.audit_service if include_audit_service else None,
        )

    def build_admin_bulk_service(self) -> AdminBulkService:
        return AdminBulkService(
            coupon_repo=self.coupon_repo,
            tour_repo=self.tour_repo,
            payment_repo=self.payment_repo,
            admin_service=self.build_admin_service(
                include_payment_repo=True,
                include_audit_service=True,
            ),
            db=self.db,
            audit_service=self.audit_service,
        )

    def build_admin_tour_service(self) -> AdminTourService:
        return AdminTourService(
            db=self.db,
            tour_repo=self.tour_repo,
            audit_service=self.audit_service,
            admin_bulk_service=self.build_admin_bulk_service(),
        )

    def build_admin_coupon_service(self) -> AdminCouponService:
        return AdminCouponService(
            db=self.db,
            coupon_repo=self.coupon_repo,
            audit_service=self.audit_service,
            admin_bulk_service=self.build_admin_bulk_service(),
        )

    def build_auth_service(self) -> AuthService:
        return AuthService(
            db=self.db,
            user_repo=self.user_repo,
            audit_service=self.audit_service,
            email_worker=self.email_worker,
            auth_token_service=self.auth_token_service,
            domain_service=self.auth_domain_service,
        )

    def build_booking_service(self) -> BookingService:
        return BookingService(
            db=self.db,
            booking_repo=self.booking_repo,
            flight_repo=self.flight_repo,
            user_repo=self.user_repo,
            audit_service=self.audit_service,
            email_worker=self.email_worker,
            notification_worker=self.notification_worker,
        )

    def build_hotel_booking_service(self) -> HotelBookingService:
        return HotelBookingService(
            db=self.db,
            booking_repo=self.booking_repo,
            hotel_repo=self.hotel_repo,
            audit_service=self.audit_service,
        )

    def build_tour_booking_service(self) -> TourBookingService:
        return TourBookingService(
            db=self.db,
            booking_repo=self.booking_repo,
            tour_repo=self.tour_repo,
            audit_service=self.audit_service,
            email_worker=self.email_worker,
            notification_worker=self.notification_worker,
        )

    def build_coupon_service(self) -> CouponService:
        return CouponService(
            db=self.db,
            booking_repo=self.booking_repo,
            coupon_repo=self.coupon_repo,
            audit_service=self.audit_service,
        )

    def build_payment_service(self) -> PaymentService:
        return PaymentService(
            db=self.db,
            booking_repo=self.booking_repo,
            payment_repo=self.payment_repo,
            audit_service=self.audit_service,
            email_worker=self.email_worker,
        )

    def build_payment_callback_service(self) -> PaymentCallbackService:
        return PaymentCallbackService(
            db=self.db,
            booking_repo=self.booking_repo,
            payment_repo=self.payment_repo,
            audit_service=self.audit_service,
            email_worker=self.email_worker,
            domain_service=self.payment_callback_domain_service,
        )

    def build_voucher_service(self) -> VoucherService:
        return VoucherService(
            db=self.db,
            booking_repo=self.booking_repo,
            audit_service=self.audit_service,
            document_repo=self.document_repo,
            pdf_voucher_service=self.pdf_voucher_service,
            email_worker=self.email_worker,
            voucher_render_service=self.voucher_render_service,
            voucher_document_service=self.voucher_document_service,
        )

    def build_admin_export_service(self) -> AdminExportService:
        return AdminExportService(
            self.admin_repo,
            db=self.db,
            audit_service=self.audit_service,
        )

    def build_flight_service(self) -> FlightService:
        return FlightService(
            db=self.db,
            flight_repo=self.flight_repo,
            audit_service=self.audit_service,
        )

    def build_hotel_service(self) -> HotelService:
        return HotelService(
            db=self.db,
            hotel_repo=self.hotel_repo,
            audit_service=self.audit_service,
        )

    def build_tour_service(self) -> TourService:
        return TourService(
            db=self.db,
            tour_repo=self.tour_repo,
            audit_service=self.audit_service,
        )

    def build_upload_service(self) -> UploadService:
        return UploadService(
            db=self.db,
            document_repo=self.document_repo,
            audit_service=self.audit_service,
            booking_repo=self.booking_repo,
            storage_service=self.storage_service,
            malware_scan_service=self.malware_scan_service,
        )

    def build_traveler_service(self) -> TravelerService:
        return TravelerService(
            db=self.db,
            booking_repo=self.booking_repo,
            audit_service=self.audit_service,
        )

    def build_booking_cancellation_service(self) -> BookingCancellationService:
        return BookingCancellationService(
            db=self.db,
            booking_repo=self.booking_repo,
            payment_repo=self.payment_repo,
            audit_service=self.audit_service,
            email_worker=self.email_worker,
            inventory_service=self.booking_inventory_service,
            domain_service=self.booking_cancellation_domain_service,
        )

    def build_user_service(self) -> UserService:
        return UserService(
            db=self.db,
            audit_service=self.audit_service,
        )

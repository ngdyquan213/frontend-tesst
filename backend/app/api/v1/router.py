from fastapi import APIRouter

from app.api.v1 import (
    admin_bookings,
    admin_coupons,
    admin_dashboard,
    admin_exports,
    admin_payments,
    admin_refunds,
    admin_tours,
    admin_users,
    auth,
    booking_cancellations,
    booking_travelers,
    booking_vouchers,
    bookings,
    coupons,
    flights,
    hotels,
    payments,
    tours,
    uploads,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(flights.router)
api_router.include_router(hotels.router)
api_router.include_router(tours.router)
api_router.include_router(bookings.router)
api_router.include_router(booking_travelers.router)
api_router.include_router(booking_vouchers.router)
api_router.include_router(booking_cancellations.router)
api_router.include_router(coupons.router)
api_router.include_router(payments.router)
api_router.include_router(uploads.router)

api_router.include_router(admin_users.router)
api_router.include_router(admin_bookings.router)
api_router.include_router(admin_payments.router)
api_router.include_router(admin_coupons.router)
api_router.include_router(admin_tours.router)
api_router.include_router(admin_refunds.router)
api_router.include_router(admin_exports.router)
api_router.include_router(admin_dashboard.router)

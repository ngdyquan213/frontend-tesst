from sqlalchemy.orm import Session

from app.models.coupon import Coupon, CouponUsage


class CouponRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, coupon_id: str) -> Coupon | None:
        return self.db.query(Coupon).filter(Coupon.id == coupon_id).first()

    def get_by_code(self, code: str) -> Coupon | None:
        return self.db.query(Coupon).filter(Coupon.code == code).first()

    def get_by_code_for_update(self, code: str) -> Coupon | None:
        return self.db.query(Coupon).filter(Coupon.code == code).with_for_update().first()

    def list_coupons(self, skip: int = 0, limit: int = 50) -> list[Coupon]:
        return self.db.query(Coupon).offset(skip).limit(limit).all()

    def count_coupons(self) -> int:
        return self.db.query(Coupon).count()

    def count_usage_by_user(self, coupon_id: str, user_id: str) -> int:
        return (
            self.db.query(CouponUsage)
            .filter(
                CouponUsage.coupon_id == coupon_id,
                CouponUsage.user_id == user_id,
            )
            .count()
        )

    def get_usage_by_booking(self, coupon_id: str, booking_id: str) -> CouponUsage | None:
        return (
            self.db.query(CouponUsage)
            .filter(
                CouponUsage.coupon_id == coupon_id,
                CouponUsage.booking_id == booking_id,
            )
            .first()
        )

    def add_usage(self, usage: CouponUsage) -> CouponUsage:
        self.db.add(usage)
        self.db.flush()
        return usage

    def add_coupon(self, coupon: Coupon) -> Coupon:
        self.db.add(coupon)
        self.db.flush()
        return coupon

    def save_coupon(self, coupon: Coupon) -> Coupon:
        self.db.add(coupon)
        self.db.flush()
        return coupon

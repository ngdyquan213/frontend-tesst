from datetime import date
from decimal import Decimal


def validate_date_range(check_in_date: date, check_out_date: date) -> None:
    if check_out_date <= check_in_date:
        raise ValueError("check_out_date must be after check_in_date")


def validate_positive_decimal(value: Decimal, field_name: str) -> None:
    if value < Decimal("0"):
        raise ValueError(f"{field_name} must be non-negative")


def validate_positive_int(value: int, field_name: str) -> None:
    if value <= 0:
        raise ValueError(f"{field_name} must be greater than 0")

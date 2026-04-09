from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.content.public_content import (
    DESTINATION_SEEDS,
    PROMOTIONS,
    SUPPORT_FAQS,
    SUPPORT_HELP_TOPICS,
)
from app.core.database import get_db
from app.repositories.tour_repository import TourRepository
from app.schemas.content import (
    DestinationContentResponse,
    FaqContentResponse,
    HelpTopicContentResponse,
    PromotionContentResponse,
)

router = APIRouter(prefix="/content", tags=["content"])


def _normalize_key(value: str) -> str:
    return value.strip().lower()


def _build_destination_payload(db: Session) -> list[DestinationContentResponse]:
    tours = TourRepository(db).list_active_tours_for_catalog()
    destinations: list[DestinationContentResponse] = []

    for seed in DESTINATION_SEEDS:
        related_tours = [
            tour
            for tour in tours
            if _normalize_key(tour.destination) == _normalize_key(seed["tourSearchValue"])
        ]
        lowest_price: Decimal | None = None

        for tour in related_tours:
            for schedule in tour.schedules:
                for rule in schedule.price_rules:
                    if lowest_price is None or rule.price < lowest_price:
                        lowest_price = rule.price

        if not related_tours:
            continue

        destinations.append(
            DestinationContentResponse(
                **seed,
                tourCount=len(related_tours),
                startingPrice=float(lowest_price) if lowest_price is not None else None,
                currency=related_tours[0].schedules[0].price_rules[0].currency
                if related_tours[0].schedules and related_tours[0].schedules[0].price_rules
                else "USD",
            )
        )

    return sorted(
        destinations,
        key=lambda item: (-int(item.featured), -item.tourCount, item.name),
    )


@router.get("/destinations", response_model=list[DestinationContentResponse])
def list_destinations(
    query: str | None = Query(default=None),
    region: str | None = Query(default=None),
    featured_only: bool = Query(default=False),
    limit: int | None = Query(default=None, ge=1, le=24),
    db: Session = Depends(get_db),
) -> list[DestinationContentResponse]:
    normalized_query = _normalize_key(query) if query else None
    items = [
        item
        for item in _build_destination_payload(db)
        if (not region or item.region == region)
        and (not featured_only or item.featured)
        and (
            not normalized_query
            or normalized_query
            in " ".join(
                [
                    item.name,
                    item.country,
                    item.summary,
                    item.description,
                    item.bestTimeLabel,
                    item.signatureLabel,
                ]
            ).lower()
        )
    ]

    return items[:limit] if limit else items


@router.get("/promotions", response_model=list[PromotionContentResponse])
def list_promotions(
    category: str | None = Query(default=None),
    status: str | None = Query(default=None),
    featured_only: bool = Query(default=False),
    limit: int | None = Query(default=None, ge=1, le=24),
) -> list[PromotionContentResponse]:
    items = [
        PromotionContentResponse(**promotion)
        for promotion in PROMOTIONS
        if (not category or promotion["category"] == category)
        and (not status or promotion["status"] == status)
        and (not featured_only or promotion["featured"])
    ]
    items.sort(key=lambda item: (-int(item.featured), item.title))
    return items[:limit] if limit else items


@router.get("/support/help-topics", response_model=list[HelpTopicContentResponse])
def list_support_help_topics() -> list[HelpTopicContentResponse]:
    return [HelpTopicContentResponse(**topic) for topic in SUPPORT_HELP_TOPICS]


@router.get("/support/faqs", response_model=list[FaqContentResponse])
def list_support_faqs() -> list[FaqContentResponse]:
    return [FaqContentResponse(**faq) for faq in SUPPORT_FAQS]

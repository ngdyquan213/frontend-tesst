from pydantic import BaseModel


class DestinationContentResponse(BaseModel):
    id: str
    slug: str
    name: str
    country: str
    region: str
    eyebrow: str
    summary: str
    description: str
    imageUrl: str
    imageAlt: str
    bestTimeLabel: str
    signatureLabel: str
    featured: bool
    tourSearchValue: str
    tourCount: int
    startingPrice: float | None = None
    currency: str


class PromotionCtaResponse(BaseModel):
    label: str
    href: str
    kind: str
    liveHref: str | None = None
    liveLabel: str | None = None


class PromotionBannerResponse(BaseModel):
    id: str
    eyebrow: str
    badge: str
    title: str
    description: str
    status: str
    imageUrl: str
    imageAlt: str
    validFrom: str
    validUntil: str | None = None
    highlights: list[str]
    primaryCta: PromotionCtaResponse
    secondaryCta: PromotionCtaResponse | None = None


class PromotionContentResponse(BaseModel):
    id: str
    category: str
    status: str
    eyebrow: str
    badge: str
    title: str
    offerSummary: str
    description: str
    applicableLabel: str
    imageUrl: str
    imageAlt: str
    validFrom: str
    validUntil: str | None = None
    featured: bool
    primaryCta: PromotionCtaResponse
    secondaryCta: PromotionCtaResponse | None = None
    banner: PromotionBannerResponse | None = None


class HelpTopicContentResponse(BaseModel):
    id: str
    title: str
    description: str
    iconKey: str
    bullets: list[str]
    ctaLabel: str
    searchTerms: list[str]


class FaqContentResponse(BaseModel):
    id: str
    topicId: str
    categoryTitle: str
    categoryIconKey: str
    question: str
    answer: str

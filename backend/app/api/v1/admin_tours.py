from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import (
    build_admin_tour_service,
    get_pagination_params,
    require_permission,
)
from app.core.constants import PERM_ADMIN_TOURS_READ, PERM_ADMIN_TOURS_WRITE
from app.core.database import get_db
from app.schemas.admin_bulk import BulkActionItemResult, BulkActionResponse, BulkIdsRequest
from app.schemas.admin_tour import (
    AdminTourCreateRequest,
    AdminTourPriceRuleCreateRequest,
    AdminTourPriceRuleResponse,
    AdminTourResponse,
    AdminTourScheduleCreateRequest,
    AdminTourScheduleResponse,
    AdminTourScheduleUpdateRequest,
    AdminTourUpdateRequest,
)
from app.schemas.common import PaginatedResponse
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import (
    admin_tour_price_rule_to_dict,
    admin_tour_schedule_to_dict,
    admin_tour_to_dict,
)

router = APIRouter(prefix="/admin", tags=["admin-tours"])


@router.get("/tours", response_model=PaginatedResponse[AdminTourResponse])
def list_tours_admin(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user=Depends(require_permission(PERM_ADMIN_TOURS_READ)),
    db: Session = Depends(get_db),
):
    service = build_admin_tour_service(db)
    tours, total = service.list_tours(
        skip=pagination.offset,
        limit=pagination.limit,
        page=pagination.page,
        page_size=pagination.page_size,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    items = [AdminTourResponse(**admin_tour_to_dict(t)).model_dump(mode="json") for t in tours]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.post("/tours", response_model=AdminTourResponse, status_code=status.HTTP_201_CREATED)
def create_tour_admin(
    payload: AdminTourCreateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_TOURS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminTourResponse:
    service = build_admin_tour_service(db)
    tour = service.create_tour(
        payload=payload,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminTourResponse(**admin_tour_to_dict(tour))


@router.put("/tours/{tour_id}", response_model=AdminTourResponse)
def update_tour_admin(
    tour_id: str,
    payload: AdminTourUpdateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_TOURS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminTourResponse:
    service = build_admin_tour_service(db)
    tour = service.update_tour(
        tour_id=tour_id,
        payload=payload,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminTourResponse(**admin_tour_to_dict(tour))


@router.post("/tours/{tour_id}/deactivate", response_model=AdminTourResponse)
def deactivate_tour_admin(
    tour_id: str,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_TOURS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminTourResponse:
    service = build_admin_tour_service(db)
    tour = service.deactivate_tour(
        tour_id=tour_id,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminTourResponse(**admin_tour_to_dict(tour))


@router.get("/tours/{tour_id}/schedules", response_model=list[AdminTourScheduleResponse])
def list_tour_schedules_admin(
    tour_id: str,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_TOURS_READ)),
    db: Session = Depends(get_db),
) -> list[AdminTourScheduleResponse]:
    service = build_admin_tour_service(db)
    schedules = service.list_tour_schedules(
        tour_id=tour_id,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return [AdminTourScheduleResponse(**admin_tour_schedule_to_dict(s)) for s in schedules]


@router.post(
    "/tours/{tour_id}/schedules",
    response_model=AdminTourScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_tour_schedule_admin(
    tour_id: str,
    payload: AdminTourScheduleCreateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_TOURS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminTourScheduleResponse:
    service = build_admin_tour_service(db)
    schedule = service.create_tour_schedule(
        tour_id=tour_id,
        payload=payload,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminTourScheduleResponse(**admin_tour_schedule_to_dict(schedule))


@router.put("/tour-schedules/{schedule_id}", response_model=AdminTourScheduleResponse)
def update_tour_schedule_admin(
    schedule_id: str,
    payload: AdminTourScheduleUpdateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_TOURS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminTourScheduleResponse:
    service = build_admin_tour_service(db)
    schedule = service.update_tour_schedule(
        schedule_id=schedule_id,
        payload=payload,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminTourScheduleResponse(**admin_tour_schedule_to_dict(schedule))


@router.post("/tour-schedules/{schedule_id}/deactivate", response_model=AdminTourScheduleResponse)
def deactivate_tour_schedule_admin(
    schedule_id: str,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_TOURS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminTourScheduleResponse:
    service = build_admin_tour_service(db)
    schedule = service.deactivate_tour_schedule(
        schedule_id=schedule_id,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminTourScheduleResponse(**admin_tour_schedule_to_dict(schedule))


@router.post(
    "/tour-schedules/{schedule_id}/price-rules",
    response_model=AdminTourPriceRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_tour_price_rule_admin(
    schedule_id: str,
    payload: AdminTourPriceRuleCreateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_TOURS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminTourPriceRuleResponse:
    service = build_admin_tour_service(db)
    rule = service.create_tour_price_rule(
        schedule_id=schedule_id,
        payload=payload,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminTourPriceRuleResponse(**admin_tour_price_rule_to_dict(rule))


@router.post("/tour-schedules/bulk-close", response_model=BulkActionResponse)
def bulk_close_tour_schedules(
    payload: BulkIdsRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_TOURS_WRITE)),
    db: Session = Depends(get_db),
) -> BulkActionResponse:
    service = build_admin_tour_service(db)
    raw_results = service.bulk_close_tour_schedules(
        schedule_ids=payload.ids,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    results = [BulkActionItemResult(**item) for item in raw_results]
    return BulkActionResponse(
        total_requested=len(payload.ids),
        success_count=sum(1 for r in raw_results if r["success"]),
        failed_count=sum(1 for r in raw_results if not r["success"]),
        results=results,
    )

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import (
    build_admin_document_service,
    get_pagination_params,
    require_permission,
)
from app.core.constants import PERM_ADMIN_DOCUMENTS_READ, PERM_ADMIN_DOCUMENTS_WRITE
from app.core.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.document import AdminDocumentReviewRequest, DocumentResponse
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import document_to_dict

router = APIRouter(prefix="/admin", tags=["admin-documents"])


@router.get("/documents", response_model=PaginatedResponse[DocumentResponse])
def list_documents(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user=Depends(require_permission(PERM_ADMIN_DOCUMENTS_READ)),
    db: Session = Depends(get_db),
):
    service = build_admin_document_service(db)
    documents, total = service.list_documents(
        actor_user_id=current_user.id,
        skip=pagination.offset,
        limit=pagination.limit,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return build_paginated_response(
        items=[document_to_dict(document) for document in documents],
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.post("/documents/{document_id}/review", response_model=DocumentResponse)
def review_document(
    document_id: str,
    payload: AdminDocumentReviewRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_DOCUMENTS_WRITE)),
    db: Session = Depends(get_db),
):
    service = build_admin_document_service(db)
    document = service.review_document(
        actor_user_id=current_user.id,
        document_id=document_id,
        status=payload.status,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return DocumentResponse(**document_to_dict(document))

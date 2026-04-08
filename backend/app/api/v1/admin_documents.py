from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import build_admin_document_service, require_admin
from app.core.database import get_db
from app.schemas.document import AdminDocumentReviewRequest, DocumentResponse
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import document_to_dict

router = APIRouter(prefix="/admin", tags=["admin-documents"])


@router.get("/documents", response_model=list[DocumentResponse])
def list_documents(
    request: Request,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = build_admin_document_service(db)
    documents = service.list_documents(
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return [DocumentResponse(**document_to_dict(document)) for document in documents]


@router.post("/documents/{document_id}/review", response_model=DocumentResponse)
def review_document(
    document_id: str,
    payload: AdminDocumentReviewRequest,
    request: Request,
    current_user=Depends(require_admin),
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

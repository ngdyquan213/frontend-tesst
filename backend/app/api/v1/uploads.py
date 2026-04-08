from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import build_upload_service, get_current_user
from app.core.database import get_db
from app.models.enums import DocumentType
from app.schemas.document import DocumentResponse
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import document_to_dict

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    request: Request,
    file: UploadFile = File(...),
    document_type: DocumentType = Form(...),
    booking_id: str | None = Form(default=None),
    traveler_id: str | None = Form(default=None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    service = build_upload_service(db)

    document = service.upload_document(
        user_id=str(current_user.id),
        file=file,
        document_type=document_type,
        booking_id=booking_id,
        traveler_id=traveler_id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return DocumentResponse(**document_to_dict(document))


@router.get("/documents", response_model=list[DocumentResponse])
def list_my_documents(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = build_upload_service(db)
    documents = service.list_my_documents(str(current_user.id))
    return [DocumentResponse(**document_to_dict(doc)) for doc in documents]


@router.get("/documents/{document_id}/download")
def download_document(
    document_id: str,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = build_upload_service(db)
    return service.build_my_document_download_response(
        user_id=str(current_user.id),
        document_id=document_id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

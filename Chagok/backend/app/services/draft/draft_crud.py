"""
Draft CRUD operations extracted from DraftService.
"""

from typing import List

from sqlalchemy.orm import Session

from app.db.models import DraftDocument, DraftStatus, DocumentType
from app.db.schemas import (
    DraftCreate,
    DraftUpdate,
    DraftResponse,
    DraftListItem,
    DraftPreviewResponse,
)
from app.middleware import NotFoundError, PermissionError
from app.repositories.case_repository import CaseRepository
from app.repositories.case_member_repository import CaseMemberRepository
from app.services.draft.citation_extractor import CitationExtractor


class DraftCrud:
    """Encapsulates draft CRUD operations."""

    def __init__(
        self,
        db: Session,
        case_repo: CaseRepository,
        member_repo: CaseMemberRepository,
        citation_extractor: CitationExtractor,
    ):
        self.db = db
        self.case_repo = case_repo
        self.member_repo = member_repo
        self.citation_extractor = citation_extractor

    def list_drafts(self, case_id: str, user_id: str) -> List[DraftListItem]:
        """List all drafts for a case."""
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        drafts = self.db.query(DraftDocument).filter(
            DraftDocument.case_id == case_id
        ).order_by(DraftDocument.updated_at.desc()).all()

        return [
            DraftListItem(
                id=d.id,
                case_id=d.case_id,
                title=d.title,
                document_type=d.document_type.value,
                version=d.version,
                status=d.status.value,
                updated_at=d.updated_at
            ) for d in drafts
        ]

    def get_draft(self, case_id: str, draft_id: str, user_id: str) -> DraftResponse:
        """Get a specific draft by ID."""
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        draft = self.db.query(DraftDocument).filter(
            DraftDocument.id == draft_id,
            DraftDocument.case_id == case_id
        ).first()

        if not draft:
            raise NotFoundError("Draft")

        return DraftResponse(
            id=draft.id,
            case_id=draft.case_id,
            title=draft.title,
            document_type=draft.document_type.value,
            content=draft.content,
            version=draft.version,
            status=draft.status.value,
            created_by=draft.created_by,
            created_at=draft.created_at,
            updated_at=draft.updated_at
        )

    def create_draft(
        self,
        case_id: str,
        draft_data: DraftCreate,
        user_id: str
    ) -> DraftResponse:
        """Create a new draft document."""
        if not self.member_repo.has_write_access(case_id, user_id):
            raise PermissionError("You do not have write access to this case")

        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        doc_type_map = {
            "complaint": DocumentType.COMPLAINT,
            "motion": DocumentType.MOTION,
            "brief": DocumentType.BRIEF,
            "response": DocumentType.RESPONSE,
        }

        draft = DraftDocument(
            case_id=case_id,
            title=draft_data.title,
            document_type=doc_type_map.get(draft_data.document_type.value, DocumentType.BRIEF),
            content=draft_data.content.model_dump() if draft_data.content else {},
            version=1,
            status=DraftStatus.DRAFT,
            created_by=user_id
        )

        self.db.add(draft)
        self.db.commit()
        self.db.refresh(draft)

        return DraftResponse(
            id=draft.id,
            case_id=draft.case_id,
            title=draft.title,
            document_type=draft.document_type.value,
            content=draft.content,
            version=draft.version,
            status=draft.status.value,
            created_by=draft.created_by,
            created_at=draft.created_at,
            updated_at=draft.updated_at
        )

    def update_draft(
        self,
        case_id: str,
        draft_id: str,
        update_data: DraftUpdate,
        user_id: str
    ) -> DraftResponse:
        """Update an existing draft document."""
        if not self.member_repo.has_write_access(case_id, user_id):
            raise PermissionError("You do not have write access to this case")

        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        draft = self.db.query(DraftDocument).filter(
            DraftDocument.id == draft_id,
            DraftDocument.case_id == case_id
        ).first()

        if not draft:
            raise NotFoundError("Draft")

        doc_type_map = {
            "complaint": DocumentType.COMPLAINT,
            "motion": DocumentType.MOTION,
            "brief": DocumentType.BRIEF,
            "response": DocumentType.RESPONSE,
        }

        status_map = {
            "draft": DraftStatus.DRAFT,
            "reviewed": DraftStatus.REVIEWED,
            "exported": DraftStatus.EXPORTED,
        }

        if update_data.title is not None:
            draft.title = update_data.title

        if update_data.document_type is not None:
            draft.document_type = doc_type_map.get(
                update_data.document_type.value,
                draft.document_type
            )

        if update_data.content is not None:
            draft.content = update_data.content.model_dump()
            draft.version += 1

        if update_data.status is not None:
            draft.status = status_map.get(
                update_data.status.value,
                draft.status
            )

        self.db.commit()
        self.db.refresh(draft)

        return DraftResponse(
            id=draft.id,
            case_id=draft.case_id,
            title=draft.title,
            document_type=draft.document_type.value,
            content=draft.content,
            version=draft.version,
            status=draft.status.value,
            created_by=draft.created_by,
            created_at=draft.created_at,
            updated_at=draft.updated_at
        )

    def save_generated_draft(
        self,
        case_id: str,
        draft_response: DraftPreviewResponse,
        user_id: str
    ) -> DraftResponse:
        """Save a generated draft preview to the database."""
        if not self.member_repo.has_write_access(case_id, user_id):
            raise PermissionError("You do not have write access to this case")

        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        citations_formatted = self.citation_extractor.format_citations_for_document(
            draft_response.citations,
            draft_response.precedent_citations
        )

        content = {
            "header": {
                "court_name": "",
                "case_number": "",
                "parties": {}
            },
            "sections": [
                {
                    "title": "본문",
                    "content": draft_response.draft_text,
                    "order": 1
                }
            ],
            "citations": citations_formatted.get("evidence", []),
            "footer": {
                "date": draft_response.generated_at.strftime("%Y년 %m월 %d일"),
                "attorney": ""
            }
        }

        draft = DraftDocument(
            case_id=case_id,
            title=f"{case.title} - 초안",
            document_type=DocumentType.BRIEF,
            content=content,
            version=1,
            status=DraftStatus.DRAFT,
            created_by=user_id
        )

        self.db.add(draft)
        self.db.commit()
        self.db.refresh(draft)

        return DraftResponse(
            id=draft.id,
            case_id=draft.case_id,
            title=draft.title,
            document_type=draft.document_type.value,
            content=draft.content,
            version=draft.version,
            status=draft.status.value,
            created_by=draft.created_by,
            created_at=draft.created_at,
            updated_at=draft.updated_at
        )

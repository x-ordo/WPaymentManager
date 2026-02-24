"""
Evidence Service - Business logic for evidence management
Facade that delegates to evidence handlers
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict

from app.db.schemas import (
    PresignedUrlRequest,
    PresignedUrlResponse,
    UploadCompleteRequest,
    UploadCompleteResponse,
    EvidenceSummary,
    EvidenceDetail,
    EvidenceReviewResponse,
    Article840Tags,
    Article840Category,
    SpeakerMappingItem,
    SpeakerMappingUpdateRequest,
    SpeakerMappingResponse,
)
from app.repositories.case_repository import CaseRepository
from app.repositories.case_member_repository import CaseMemberRepository
from app.repositories.user_repository import UserRepository
from app.repositories.party_repository import PartyRepository
from app.adapters.s3_adapter import S3Adapter
from app.adapters.dynamo_adapter import DynamoEvidenceAdapter
from app.adapters.ai_worker_adapter import AiWorkerAdapter
from app.adapters.audit_adapter import AuditAdapter
from app.adapters.consistency_adapter import ConsistencyAdapter
from app.ports.storage import EvidenceMetadataPort, S3Port
from app.ports.ai_worker import AiWorkerPort
from app.ports.audit import AuditPort
from app.ports.consistency import ConsistencyPort
from app.services.evidence import (
    EvidenceUploadHandler,
    EvidenceQueryService,
    EvidenceProcessingHandler,
    EvidenceReviewHandler,
    SpeakerMappingHandler,
    EvidenceDeletionHandler,
    get_content_type,
    parse_article_840_tags,
    validate_speaker_mapping,
    MAX_SPEAKERS,
    MAX_SPEAKER_LABEL_LENGTH,
)


class EvidenceService:
    """
    Service for evidence management business logic.
    """

    MAX_SPEAKERS = MAX_SPEAKERS
    MAX_SPEAKER_LABEL_LENGTH = MAX_SPEAKER_LABEL_LENGTH

    def __init__(
        self,
        db: Session,
        s3_port: Optional[S3Port] = None,
        metadata_port: Optional[EvidenceMetadataPort] = None,
        ai_worker_port: Optional[AiWorkerPort] = None,
        audit_port: Optional[AuditPort] = None,
        consistency_port: Optional[ConsistencyPort] = None
    ):
        self.db = db
        self.case_repo = CaseRepository(db)
        self.member_repo = CaseMemberRepository(db)
        self.user_repo = UserRepository(db)
        self.party_repo = PartyRepository(db)
        self.s3_port = s3_port or S3Adapter()
        self.metadata_port = metadata_port or DynamoEvidenceAdapter()
        self.ai_worker_port = ai_worker_port or AiWorkerAdapter()
        self.audit_port = audit_port or AuditAdapter()
        self.consistency_port = consistency_port or ConsistencyAdapter()

        self.upload_handler = EvidenceUploadHandler(
            self.case_repo,
            self.member_repo,
            self.user_repo,
            self.s3_port,
            self.metadata_port,
            self.ai_worker_port,
        )
        self.query_handler = EvidenceQueryService(
            self.case_repo,
            self.member_repo,
            self.metadata_port,
        )
        self.processing_handler = EvidenceProcessingHandler(
            self.member_repo,
            self.metadata_port,
            self.ai_worker_port,
        )
        self.review_handler = EvidenceReviewHandler(
            self.case_repo,
            self.member_repo,
            self.metadata_port,
        )
        self.speaker_mapping_handler = SpeakerMappingHandler(
            self.db,
            self.member_repo,
            self.party_repo,
            self.metadata_port,
            self.audit_port,
        )
        self.deletion_handler = EvidenceDeletionHandler(
            self.db,
            self.member_repo,
            self.metadata_port,
            self.audit_port,
            self.consistency_port,
        )

    @staticmethod
    def _parse_article_840_tags(evidence_data: dict) -> Optional[Article840Tags]:
        """Parse Article 840 tags from evidence data."""
        return parse_article_840_tags(evidence_data)

    @staticmethod
    def _get_content_type(extension: str) -> str:
        """Get MIME content type from file extension."""
        return get_content_type(extension)

    def generate_upload_presigned_url(
        self,
        request: PresignedUrlRequest,
        user_id: str
    ) -> PresignedUrlResponse:
        return self.upload_handler.generate_upload_presigned_url(request, user_id)

    def handle_upload_complete(
        self,
        request: UploadCompleteRequest,
        user_id: str
    ) -> UploadCompleteResponse:
        return self.upload_handler.handle_upload_complete(request, user_id)

    def get_evidence_list(
        self,
        case_id: str,
        user_id: str,
        categories: Optional[List[Article840Category]] = None
    ) -> List[EvidenceSummary]:
        return self.query_handler.get_evidence_list(case_id, user_id, categories)

    def get_evidence_detail(self, evidence_id: str, user_id: str) -> EvidenceDetail:
        return self.query_handler.get_evidence_detail(evidence_id, user_id)

    def retry_processing(self, evidence_id: str, user_id: str) -> dict:
        return self.processing_handler.retry_processing(evidence_id, user_id)

    def get_evidence_status(self, evidence_id: str, user_id: str) -> dict:
        return self.query_handler.get_evidence_status(evidence_id, user_id)

    def review_evidence(
        self,
        case_id: str,
        evidence_id: str,
        reviewer_id: str,
        action: str,
        comment: Optional[str] = None
    ) -> EvidenceReviewResponse:
        return self.review_handler.review_evidence(
            case_id,
            evidence_id,
            reviewer_id,
            action,
            comment
        )

    def update_speaker_mapping(
        self,
        evidence_id: str,
        user_id: str,
        request: SpeakerMappingUpdateRequest
    ) -> SpeakerMappingResponse:
        return self.speaker_mapping_handler.update_speaker_mapping(
            evidence_id,
            user_id,
            request
        )

    def _validate_speaker_mapping(
        self,
        speaker_mapping: Dict[str, SpeakerMappingItem],
        case_id: str
    ) -> None:
        """Validate speaker mapping data."""
        validate_speaker_mapping(speaker_mapping, case_id, self.party_repo)

    def delete_evidence(
        self,
        evidence_id: str,
        user_id: str,
        hard_delete: bool = False
    ) -> dict:
        return self.deletion_handler.delete_evidence(evidence_id, user_id, hard_delete)

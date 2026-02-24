"""
Evidence speaker mapping handler.
"""

from datetime import datetime
import logging
from typing import Dict

from app.db.schemas import (
    SpeakerMappingItem,
    SpeakerMappingUpdateRequest,
    SpeakerMappingResponse,
)
from app.db.schemas.audit import AuditAction
from app.middleware import NotFoundError, PermissionError, ValidationError
from app.ports.audit import AuditPort
from app.ports.storage import EvidenceMetadataPort
from app.repositories.case_member_repository import CaseMemberRepository
from app.repositories.party_repository import PartyRepository

logger = logging.getLogger(__name__)


MAX_SPEAKERS = 10
MAX_SPEAKER_LABEL_LENGTH = 50


def validate_speaker_mapping(
    speaker_mapping: Dict[str, SpeakerMappingItem],
    case_id: str,
    party_repo: PartyRepository,
) -> None:
    """Validate speaker mapping data."""
    if len(speaker_mapping) > MAX_SPEAKERS:
        raise ValidationError(
            f"화자는 최대 {MAX_SPEAKERS}명까지 매핑 가능합니다"
        )

    party_ids = set()

    for label, item in speaker_mapping.items():
        if len(label) > MAX_SPEAKER_LABEL_LENGTH:
            raise ValidationError(
                f"화자명은 {MAX_SPEAKER_LABEL_LENGTH}자 이하여야 합니다"
            )
        party_ids.add(item.party_id)

    for party_id in party_ids:
        party = party_repo.get_by_id(party_id)
        if not party:
            raise ValidationError(
                f"인물 '{party_id}'을(를) 찾을 수 없습니다"
            )
        if party.case_id != case_id:
            raise ValidationError(
                "선택한 인물이 이 사건에 속하지 않습니다"
            )


class SpeakerMappingHandler:
    """Handles speaker mapping CRUD."""

    def __init__(
        self,
        db,
        member_repo: CaseMemberRepository,
        party_repo: PartyRepository,
        metadata_port: EvidenceMetadataPort,
        audit_port: AuditPort,
    ):
        self.db = db
        self.member_repo = member_repo
        self.party_repo = party_repo
        self.metadata_port = metadata_port
        self.audit_port = audit_port

    def update_speaker_mapping(
        self,
        evidence_id: str,
        user_id: str,
        request: SpeakerMappingUpdateRequest
    ) -> SpeakerMappingResponse:
        """
        Update speaker mapping for evidence.
        """
        evidence = self.metadata_port.get_evidence_by_id(evidence_id)
        if not evidence:
            raise NotFoundError("Evidence")

        case_id = evidence["case_id"]
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        speaker_mapping = request.speaker_mapping

        if not speaker_mapping:
            success = self.metadata_port.update_evidence_speaker_mapping(
                evidence_id,
                None,
                user_id
            )
            if not success:
                raise ValidationError("화자 매핑 삭제에 실패했습니다")

            self.audit_port.log_audit_event(
                db=self.db,
                user_id=user_id,
                action=AuditAction.SPEAKER_MAPPING_UPDATE,
                object_id=evidence_id
            )
            self.db.commit()
            logger.info(
                "Speaker mapping cleared for evidence %s by user %s",
                evidence_id,
                user_id
            )

            return SpeakerMappingResponse(
                evidence_id=evidence_id,
                speaker_mapping=None,
                updated_at=datetime.utcnow(),
                updated_by=user_id
            )

        validate_speaker_mapping(speaker_mapping, case_id, self.party_repo)

        mapping_dict = {
            label: {"party_id": item.party_id, "party_name": item.party_name}
            for label, item in speaker_mapping.items()
        }

        success = self.metadata_port.update_evidence_speaker_mapping(
            evidence_id,
            mapping_dict,
            user_id
        )
        if not success:
            raise ValidationError("화자 매핑 저장에 실패했습니다")

        self.audit_port.log_audit_event(
            db=self.db,
            user_id=user_id,
            action=AuditAction.SPEAKER_MAPPING_UPDATE,
            object_id=evidence_id
        )
        self.db.commit()
        logger.info(
            "Speaker mapping updated for evidence %s by user %s",
            evidence_id,
            user_id
        )

        return SpeakerMappingResponse(
            evidence_id=evidence_id,
            speaker_mapping=speaker_mapping,
            updated_at=datetime.utcnow(),
            updated_by=user_id
        )

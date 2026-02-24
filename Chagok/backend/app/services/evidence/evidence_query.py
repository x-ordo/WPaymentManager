"""
Evidence querying (list/detail/status) and Article 840 tag parsing.
"""

from datetime import datetime
from typing import List, Optional

from app.db.schemas import (
    EvidenceSummary,
    EvidenceDetail,
    Article840Tags,
    Article840Category,
    SpeakerMappingItem,
)
from app.middleware import NotFoundError, PermissionError
from app.repositories.case_member_repository import CaseMemberRepository
from app.repositories.case_repository import CaseRepository
from app.ports.storage import EvidenceMetadataPort


def parse_article_840_tags(evidence_data: dict) -> Optional[Article840Tags]:
    """
    Parse Article 840 tags from DynamoDB evidence data.
    """
    tags_data = evidence_data.get("article_840_tags")
    if not tags_data:
        return None

    try:
        categories = [
            Article840Category(cat)
            for cat in tags_data.get("categories", [])
        ]

        return Article840Tags(
            categories=categories,
            confidence=tags_data.get("confidence", 0.0),
            matched_keywords=tags_data.get("matched_keywords", [])
        )
    except (ValueError, KeyError):
        return None


class EvidenceQueryService:
    """Handles evidence list/detail/status queries."""

    def __init__(
        self,
        case_repo: CaseRepository,
        member_repo: CaseMemberRepository,
        metadata_port: EvidenceMetadataPort,
    ):
        self.case_repo = case_repo
        self.member_repo = member_repo
        self.metadata_port = metadata_port

    def get_evidence_list(
        self,
        case_id: str,
        user_id: str,
        categories: Optional[List[Article840Category]] = None
    ) -> List[EvidenceSummary]:
        """
        Get list of evidence for a case.
        """
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        evidence_list = self.metadata_port.get_evidence_by_case(case_id)

        summaries = [
            EvidenceSummary(
                id=evidence.get("evidence_id") or evidence.get("id"),
                case_id=evidence["case_id"],
                type=evidence["type"],
                filename=evidence["filename"],
                size=evidence.get("size", 0),
                created_at=datetime.fromisoformat(
                    evidence["created_at"].replace("Z", "+00:00")
                ),
                status=evidence.get("status", "pending"),
                ai_summary=evidence.get("ai_summary"),
                article_840_tags=parse_article_840_tags(evidence),
                has_speaker_mapping=bool(evidence.get("speaker_mapping"))
            )
            for evidence in evidence_list
        ]

        if categories:
            summaries = [
                summary for summary in summaries
                if summary.article_840_tags and any(
                    cat in summary.article_840_tags.categories
                    for cat in categories
                )
            ]

        return summaries

    def get_evidence_detail(self, evidence_id: str, user_id: str) -> EvidenceDetail:
        """
        Get detailed evidence metadata with AI analysis results.
        """
        evidence = self.metadata_port.get_evidence_by_id(evidence_id)
        if not evidence:
            raise NotFoundError("Evidence")

        case_id = evidence["case_id"]
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        article_840_tags = parse_article_840_tags(evidence)

        labels = evidence.get("labels", [])
        if article_840_tags and article_840_tags.categories:
            labels = [cat.value for cat in article_840_tags.categories]

        speaker_mapping = None
        raw_mapping = evidence.get("speaker_mapping")
        if raw_mapping:
            speaker_mapping = {
                label: SpeakerMappingItem(
                    party_id=item.get("party_id", ""),
                    party_name=item.get("party_name", "")
                )
                for label, item in raw_mapping.items()
            }

        speaker_mapping_updated_at = None
        if evidence.get("speaker_mapping_updated_at"):
            speaker_mapping_updated_at = datetime.fromisoformat(
                evidence["speaker_mapping_updated_at"]
            )

        return EvidenceDetail(
            id=evidence.get("evidence_id") or evidence.get("id"),
            case_id=evidence["case_id"],
            type=evidence["type"],
            filename=evidence["filename"],
            size=evidence.get("size", 0),
            s3_key=evidence["s3_key"],
            content_type=evidence.get("content_type", "application/octet-stream"),
            created_at=datetime.fromisoformat(evidence["created_at"]),
            status=evidence.get("status", "pending"),
            ai_summary=evidence.get("ai_summary"),
            labels=labels,
            insights=evidence.get("insights", []),
            content=evidence.get("content"),
            speaker=evidence.get("speaker"),
            timestamp=datetime.fromisoformat(
                evidence["timestamp"].replace("Z", "+00:00")
            ) if evidence.get("timestamp") else None,
            qdrant_id=evidence.get("qdrant_id"),
            article_840_tags=article_840_tags,
            speaker_mapping=speaker_mapping,
            speaker_mapping_updated_at=speaker_mapping_updated_at
        )

    def get_evidence_status(self, evidence_id: str, user_id: str) -> dict:
        """
        Get current status of evidence.
        """
        evidence = self.metadata_port.get_evidence_by_id(evidence_id)
        if not evidence:
            raise NotFoundError("Evidence")

        case_id = evidence["case_id"]
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        return {
            "evidence_id": evidence_id,
            "status": evidence.get("status", "unknown"),
            "error_message": evidence.get("error_message"),
            "updated_at": evidence.get("updated_at")
        }

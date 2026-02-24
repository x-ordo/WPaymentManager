"""
Evidence review workflow handler.
"""

from datetime import datetime

from app.db.schemas import EvidenceReviewResponse
from app.middleware import NotFoundError, PermissionError
from app.repositories.case_member_repository import CaseMemberRepository
from app.repositories.case_repository import CaseRepository
from app.ports.storage import EvidenceMetadataPort


class EvidenceReviewHandler:
    """Handles evidence review (approve/reject)."""

    def __init__(
        self,
        case_repo: CaseRepository,
        member_repo: CaseMemberRepository,
        metadata_port: EvidenceMetadataPort,
    ):
        self.case_repo = case_repo
        self.member_repo = member_repo
        self.metadata_port = metadata_port

    def review_evidence(
        self,
        case_id: str,
        evidence_id: str,
        reviewer_id: str,
        action: str,
        comment: str = None
    ) -> EvidenceReviewResponse:
        """
        Review client-uploaded evidence (approve or reject).
        """
        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        if not self.member_repo.has_access(case_id, reviewer_id):
            raise PermissionError("You do not have access to this case")

        evidence = self.metadata_port.get_evidence_by_id(evidence_id)
        if not evidence:
            raise NotFoundError("Evidence")

        if evidence.get("case_id") != case_id:
            raise NotFoundError("Evidence not found in this case")

        current_review_status = evidence.get("review_status")
        if current_review_status != "pending_review":
            raise ValueError(
                "Evidence cannot be reviewed. Current review_status: "
                f"{current_review_status}"
            )

        new_review_status = "approved" if action == "approve" else "rejected"
        reviewed_at = datetime.utcnow()

        additional_fields = {
            "review_status": new_review_status,
            "reviewed_by": reviewer_id,
            "reviewed_at": reviewed_at.isoformat(),
        }
        if comment:
            additional_fields["review_comment"] = comment

        self.metadata_port.update_evidence_status(
            evidence_id=evidence_id,
            status=evidence.get("status", "pending"),
            additional_fields=additional_fields
        )

        return EvidenceReviewResponse(
            evidence_id=evidence_id,
            case_id=case_id,
            review_status=new_review_status,
            reviewed_by=reviewer_id,
            reviewed_at=reviewed_at,
            comment=comment
        )

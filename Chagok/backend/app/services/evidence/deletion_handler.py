"""
Evidence deletion handler.
"""

from datetime import datetime
import logging

from app.db.schemas.audit import AuditAction
from app.middleware import NotFoundError, PermissionError
from app.ports.audit import AuditPort
from app.ports.consistency import ConsistencyPort
from app.ports.storage import EvidenceMetadataPort
from app.repositories.case_member_repository import CaseMemberRepository
from app.utils.consistency import ConsistencyError

logger = logging.getLogger(__name__)


class EvidenceDeletionHandler:
    """Handles soft/hard deletion for evidence."""

    def __init__(
        self,
        db,
        member_repo: CaseMemberRepository,
        metadata_port: EvidenceMetadataPort,
        audit_port: AuditPort,
        consistency_port: ConsistencyPort,
    ):
        self.db = db
        self.member_repo = member_repo
        self.metadata_port = metadata_port
        self.audit_port = audit_port
        self.consistency_port = consistency_port

    def delete_evidence(
        self,
        evidence_id: str,
        user_id: str,
        hard_delete: bool = False
    ) -> dict:
        """
        Delete evidence with DynamoDB/Qdrant consistency.
        """
        evidence = self.metadata_port.get_evidence_by_id(evidence_id)
        if not evidence:
            raise NotFoundError("Evidence")

        case_id = evidence["case_id"]
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        if hard_delete:
            try:
                success = self.consistency_port.delete_evidence_with_index(
                    case_id=case_id,
                    evidence_id=evidence_id
                )

                if success:
                    self.audit_port.log_audit_event(
                        db=self.db,
                        user_id=user_id,
                        action=AuditAction.DELETE_EVIDENCE,
                        object_id=evidence_id
                    )
                    self.db.commit()
                    logger.info(
                        "Evidence %s hard deleted by user %s",
                        evidence_id,
                        user_id
                    )

                return {
                    "success": success,
                    "evidence_id": evidence_id,
                    "action": "hard_delete",
                    "message": "Evidence permanently deleted from all stores"
                }
            except ConsistencyError as exc:
                logger.error(
                    "Consistency error deleting evidence %s: %s",
                    evidence_id,
                    exc
                )
                return {
                    "success": False,
                    "evidence_id": evidence_id,
                    "action": "hard_delete",
                    "message": str(exc),
                    "partial_success": exc.partial_success,
                    "details": exc.details
                }

        success = self.metadata_port.update_evidence_status(
            evidence_id=evidence_id,
            status=evidence.get("status", "pending"),
            additional_fields={
                "deleted": True,
                "deleted_at": datetime.utcnow().isoformat(),
                "deleted_by": user_id,
            }
        )

        if success:
            self.audit_port.log_audit_event(
                db=self.db,
                user_id=user_id,
                action=AuditAction.DELETE_EVIDENCE,
                object_id=evidence_id
            )
            self.db.commit()
            logger.info(
                "Evidence %s soft deleted by user %s",
                evidence_id,
                user_id
            )

        return {
            "success": success,
            "evidence_id": evidence_id,
            "action": "soft_delete",
            "message": "Evidence marked as deleted"
        }

"""
Evidence processing retry handler.
"""

import logging

from app.core.config import settings
from app.middleware import NotFoundError, PermissionError
from app.ports.ai_worker import AiWorkerPort
from app.ports.storage import EvidenceMetadataPort
from app.repositories.case_member_repository import CaseMemberRepository

logger = logging.getLogger(__name__)


class EvidenceProcessingHandler:
    """Handles retrying evidence processing."""

    def __init__(
        self,
        member_repo: CaseMemberRepository,
        metadata_port: EvidenceMetadataPort,
        ai_worker_port: AiWorkerPort,
    ):
        self.member_repo = member_repo
        self.metadata_port = metadata_port
        self.ai_worker_port = ai_worker_port

    def retry_processing(self, evidence_id: str, user_id: str) -> dict:
        """
        Retry processing for failed evidence.
        """
        evidence = self.metadata_port.get_evidence_by_id(evidence_id)
        if not evidence:
            raise NotFoundError("Evidence")

        case_id = evidence["case_id"]
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        current_status = evidence.get("status", "")
        if current_status not in ["failed", "pending", "processing"]:
            raise ValueError(
                "Cannot retry evidence with status "
                f"'{current_status}'. Only 'failed', 'pending', or 'processing' "
                "evidence can be retried."
            )

        s3_key = evidence.get("s3_key")
        if not s3_key:
            raise ValueError("Evidence missing s3_key - cannot retry")

        try:
            invoke_result = self.ai_worker_port.invoke_ai_worker(
                bucket=settings.S3_EVIDENCE_BUCKET,
                s3_key=s3_key,
                evidence_id=evidence_id,
                case_id=case_id
            )
            logger.info(
                "AI Worker retry invocation result for %s: %s",
                evidence_id,
                invoke_result
            )

            result_status = invoke_result.get("status", "")

            if result_status == "invoked":
                self.metadata_port.update_evidence_status(
                    evidence_id,
                    "processing",
                    error_message=None
                )
                return {
                    "success": True,
                    "message": "Evidence processing restarted",
                    "evidence_id": evidence_id,
                    "status": "processing"
                }
            if result_status == "skipped":
                self.metadata_port.update_evidence_status(
                    evidence_id,
                    "pending",
                    error_message=None
                )
                return {
                    "success": False,
                    "message": (
                        "AI Worker is disabled. Evidence remains pending for manual "
                        "processing."
                    ),
                    "evidence_id": evidence_id,
                    "status": "pending"
                }

            error_msg = invoke_result.get(
                "error_message",
                f"Lambda invocation failed with status: {result_status}"
            )
            self.metadata_port.update_evidence_status(
                evidence_id,
                "failed",
                error_message=error_msg
            )
            return {
                "success": False,
                "message": f"Retry failed: {error_msg}",
                "evidence_id": evidence_id,
                "status": "failed"
            }
        except Exception as exc:
            logger.error("AI Worker retry failed for evidence %s: %s", evidence_id, exc)
            self.metadata_port.update_evidence_status(
                evidence_id,
                "failed",
                error_message=str(exc)
            )
            return {
                "success": False,
                "message": f"Retry failed: {str(exc)}",
                "evidence_id": evidence_id,
                "status": "failed"
            }

from typing import Dict, Any, Optional, List
from app.ports.storage import EvidenceMetadataPort
from app.utils import dynamo as dynamo_utils


class DynamoEvidenceAdapter(EvidenceMetadataPort):
    def get_evidence_by_case(self, case_id: str) -> List[Dict[str, Any]]:
        return dynamo_utils.get_evidence_by_case(case_id)

    def get_evidence_by_id(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        return dynamo_utils.get_evidence_by_id(evidence_id)

    def put_evidence_metadata(self, evidence_data: Dict[str, Any]) -> Dict[str, Any]:
        return dynamo_utils.put_evidence_metadata(evidence_data)

    def update_evidence_status(
        self,
        evidence_id: str,
        status: str,
        error_message: Optional[str] = None,
        additional_fields: Optional[Dict[str, Any]] = None
    ) -> bool:
        return dynamo_utils.update_evidence_status(
            evidence_id=evidence_id,
            status=status,
            error_message=error_message,
            additional_fields=additional_fields
        )

    def update_evidence_speaker_mapping(
        self,
        evidence_id: str,
        mapping: Optional[Dict[str, Any]],
        user_id: str
    ) -> bool:
        return dynamo_utils.update_evidence_speaker_mapping(
            evidence_id=evidence_id,
            mapping=mapping,
            user_id=user_id
        )

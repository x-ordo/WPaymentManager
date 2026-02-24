from typing import Protocol, Dict, Any, Optional, List


class S3Port(Protocol):
    def generate_presigned_upload_url(
        self,
        bucket: str,
        key: str,
        content_type: str,
        expires_in: int = 300
    ) -> Dict[str, Any]:
        ...


class EvidenceMetadataPort(Protocol):
    def get_evidence_by_case(self, case_id: str) -> List[Dict[str, Any]]:
        ...

    def get_evidence_by_id(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        ...

    def put_evidence_metadata(self, evidence_data: Dict[str, Any]) -> Dict[str, Any]:
        ...

    def update_evidence_status(
        self,
        evidence_id: str,
        status: str,
        error_message: Optional[str] = None,
        additional_fields: Optional[Dict[str, Any]] = None
    ) -> bool:
        ...

    def update_evidence_speaker_mapping(
        self,
        evidence_id: str,
        mapping: Optional[Dict[str, Any]],
        user_id: str
    ) -> bool:
        ...

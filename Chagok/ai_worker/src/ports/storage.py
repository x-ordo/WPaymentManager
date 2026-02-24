from typing import Protocol, Dict, Any, Optional
from src.storage.schemas import EvidenceFile


class ObjectStoragePort(Protocol):
    def download_file(self, bucket_name: str, object_key: str, destination: str) -> None:
        ...


class MetadataStorePort(Protocol):
    def get_evidence(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        ...

    def check_hash_exists(self, file_hash: str, case_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        ...

    def check_s3_key_exists(self, s3_key: str) -> Optional[Dict[str, Any]]:
        ...

    def update_evidence_with_hash(
        self,
        evidence_id: str,
        file_hash: str,
        status: str,
        ai_summary: Optional[str] = None,
        article_840_tags: Optional[Dict[str, Any]] = None,
        qdrant_id: Optional[str] = None,
        case_id: Optional[str] = None,
        filename: Optional[str] = None,
        s3_key: Optional[str] = None,
        file_type: Optional[str] = None,
        content: Optional[str] = None,
        skip_if_processed: bool = True
    ) -> bool:
        ...

    def save_file_if_not_exists(self, evidence_file: EvidenceFile, file_hash: str) -> None:
        ...


class VectorStorePort(Protocol):
    def add_chunk_with_metadata(self, **kwargs: Any) -> None:
        ...

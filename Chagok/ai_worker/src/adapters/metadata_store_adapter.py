from typing import Dict, Any, Optional
from src.ports.storage import MetadataStorePort
from src.storage.metadata_store import MetadataStore
from src.storage.schemas import EvidenceFile


class MetadataStoreAdapter(MetadataStorePort):
    def __init__(self, store: Optional[MetadataStore] = None):
        self._store = store or MetadataStore()

    def get_evidence(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        return self._store.get_evidence(evidence_id)

    def check_hash_exists(self, file_hash: str, case_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        return self._store.check_hash_exists(file_hash, case_id=case_id)

    def check_s3_key_exists(self, s3_key: str) -> Optional[Dict[str, Any]]:
        return self._store.check_s3_key_exists(s3_key)

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
        return self._store.update_evidence_with_hash(
            evidence_id=evidence_id,
            file_hash=file_hash,
            status=status,
            ai_summary=ai_summary,
            article_840_tags=article_840_tags,
            qdrant_id=qdrant_id,
            case_id=case_id,
            filename=filename,
            s3_key=s3_key,
            file_type=file_type,
            content=content,
            skip_if_processed=skip_if_processed
        )

    def save_file_if_not_exists(self, evidence_file: EvidenceFile, file_hash: str) -> None:
        self._store.save_file_if_not_exists(evidence_file, file_hash)

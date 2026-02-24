from dataclasses import dataclass
from functools import lru_cache

from fastapi import Depends
from sqlalchemy.orm import Session

from app.adapters.ai_worker_adapter import AiWorkerAdapter
from app.adapters.audit_adapter import AuditAdapter
from app.adapters.consistency_adapter import ConsistencyAdapter
from app.adapters.dynamo_adapter import DynamoEvidenceAdapter
from app.adapters.s3_adapter import S3Adapter
from app.core.config import settings
from app.db.session import get_db
from app.domain.ports.file_storage_port import FileStoragePort
from app.domain.ports.llm_port import LLMPort
from app.domain.ports.metadata_store_port import MetadataStorePort
from app.domain.ports.vector_db_port import VectorDBPort
from app.domain.ports.worker_port import WorkerPort
from app.infrastructure.llm.gemini_adapter import GeminiAdapter
from app.infrastructure.llm.openai_adapter import OpenAIAdapter
from app.infrastructure.metadata.dynamodb_adapter import DynamoDBAdapter
from app.infrastructure.storage.s3_adapter import S3Adapter as FileStorageAdapter
from app.infrastructure.vector_db.qdrant_adapter import QdrantAdapter
from app.infrastructure.worker.lambda_adapter import LambdaAdapter
from app.ports.ai_worker import AiWorkerPort
from app.ports.audit import AuditPort
from app.ports.consistency import ConsistencyPort
from app.ports.storage import EvidenceMetadataPort, S3Port
from app.services.evidence_service import EvidenceService


@dataclass(frozen=True)
class ServiceContainer:
    s3: S3Port
    metadata: EvidenceMetadataPort
    ai_worker: AiWorkerPort
    audit: AuditPort
    consistency: ConsistencyPort

    def evidence_service(self, db: Session) -> EvidenceService:
        return EvidenceService(
            db,
            s3_port=self.s3,
            metadata_port=self.metadata,
            ai_worker_port=self.ai_worker,
            audit_port=self.audit,
            consistency_port=self.consistency
        )


@lru_cache
def get_container() -> ServiceContainer:
    return ServiceContainer(
        s3=S3Adapter(),
        metadata=DynamoEvidenceAdapter(),
        ai_worker=AiWorkerAdapter(),
        audit=AuditAdapter(),
        consistency=ConsistencyAdapter()
    )


def get_evidence_service(db: Session = Depends(get_db)) -> EvidenceService:
    return get_container().evidence_service(db)


@lru_cache
def get_llm_port() -> LLMPort:
    if settings.USE_GEMINI_FOR_DRAFT and settings.GEMINI_API_KEY:
        return GeminiAdapter()
    return OpenAIAdapter()


@lru_cache
def get_vector_db_port() -> VectorDBPort:
    return QdrantAdapter()


@lru_cache
def get_metadata_store_port() -> MetadataStorePort:
    return DynamoDBAdapter()


@lru_cache
def get_file_storage_port() -> FileStoragePort:
    return FileStorageAdapter()


@lru_cache
def get_worker_port() -> WorkerPort:
    return LambdaAdapter()


def clear_container_cache() -> None:
    get_container.cache_clear()
    get_llm_port.cache_clear()
    get_vector_db_port.cache_clear()
    get_metadata_store_port.cache_clear()
    get_file_storage_port.cache_clear()
    get_worker_port.cache_clear()

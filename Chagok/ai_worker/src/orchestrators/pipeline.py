from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, Optional
import os
import tempfile
import uuid
import logging

from src.adapters.embedding_adapter import EmbeddingProviderAdapter
from src.adapters.metadata_store_adapter import MetadataStoreAdapter
from src.adapters.s3_adapter import S3StorageAdapter
from src.adapters.vector_store_adapter import VectorStoreAdapter
from src.analysis.article_840_tagger import Article840Tagger
from src.analysis.person_extractor import extract_persons_from_messages
from src.analysis.relationship_inferrer import infer_relationships
from src.analysis.summarizer import EvidenceSummarizer
from src.api.backend_client import save_extracted_graph_to_backend
from src.ports.embedding import EmbeddingProviderPort
from src.ports.storage import MetadataStorePort, ObjectStoragePort, VectorStorePort
from src.storage.metadata_store import DuplicateError
from src.storage.schemas import EvidenceFile
from src.utils.cost_guard import CostGuard, FileSizeExceeded, get_file_type_from_extension
from src.utils.hash import calculate_file_hash
from src.utils.observability import (
    JobTracker,
    ProcessingStage,
    ErrorType,
    classify_exception
)

ParserRouter = Callable[[str], Optional[Any]]
CaseIdExtractor = Callable[[str, str], str]
EvidenceIdExtractor = Callable[[str], Optional[str]]


class PipelineOrchestrator:
    def __init__(
        self,
        storage: ObjectStoragePort,
        metadata_store: MetadataStorePort,
        vector_store: VectorStorePort,
        embedding_provider: EmbeddingProviderPort,
        logger: logging.Logger,
        tagger: Optional[Article840Tagger] = None,
        summarizer: Optional[EvidenceSummarizer] = None,
        cost_guard_factory: Optional[Callable[[], CostGuard]] = None,
        hash_func: Callable[[str], str] = calculate_file_hash
    ):
        self.storage = storage
        self.metadata_store = metadata_store
        self.vector_store = vector_store
        self.embedding_provider = embedding_provider
        self.logger = logger
        self.tagger = tagger or Article840Tagger()
        self.summarizer = summarizer or EvidenceSummarizer()
        self.cost_guard_factory = cost_guard_factory or CostGuard
        self.hash_func = hash_func

    def process_s3_object(
        self,
        bucket_name: str,
        object_key: str,
        parser_router: ParserRouter,
        extract_case_id: CaseIdExtractor,
        extract_evidence_id: EvidenceIdExtractor
    ) -> Dict[str, Any]:
        """
        S3 파일을 파싱하고 분석하는 메인 처리 함수

        Args:
            bucket_name: S3 버킷 이름
            object_key: S3 객체 키 (파일 경로)

        Returns:
            처리 결과 딕셔너리
        """
        tracker = JobTracker.from_s3_event(bucket_name, object_key)
        tracker.log(f"Starting job for s3://{bucket_name}/{object_key}")

        try:
            file_path = Path(object_key)
            file_extension = file_path.suffix
            tracker.set_file_info(file_type=file_extension.lstrip('.'))

            tracker.log(f"Processing file: {object_key}", extension=file_extension)
            self.logger.debug(f"Processing file {object_key}, ext={file_extension}")

            parser = parser_router(file_extension)
            self.logger.debug(f"Parser selected: {parser}")
            if not parser:
                tracker.record_error(
                    ErrorType.VALIDATION_ERROR,
                    f"Unsupported file type: {file_extension}"
                )
                return {
                    "status": "skipped",
                    "reason": f"Unsupported file type: {file_extension}",
                    "file": object_key,
                    "job_id": tracker.context.job_id
                }

            with tracker.stage(ProcessingStage.DOWNLOAD) as stage:
                local_path = os.path.join(tempfile.gettempdir(), file_path.name)
                os.makedirs(os.path.dirname(local_path), exist_ok=True)
                self.storage.download_file(bucket_name, object_key, local_path)
                stage.add_metadata(local_path=local_path)

            cost_guard = self.cost_guard_factory()
            file_type_str = get_file_type_from_extension(file_extension)

            try:
                self.logger.debug("Validating file size...")
                is_valid, file_details = cost_guard.validate_file(local_path, file_type_str)
                self.logger.debug(f"File valid: {is_valid}, details: {file_details}")
                tracker.log(
                    f"File validated: {file_details['file_size_mb']:.2f}MB ({file_type_str})",
                    file_size_mb=file_details['file_size_mb'],
                    requires_chunking=file_details.get('requires_chunking', False)
                )
                tracker.add_metadata(file_details=file_details)

            except FileSizeExceeded as e:
                tracker.record_error(
                    ErrorType.VALIDATION_ERROR,
                    f"File size exceeded: {e.file_size_mb:.2f}MB > {e.max_size_mb}MB limit"
                )
                tracker.log_summary()
                return {
                    "status": "rejected",
                    "reason": "file_size_exceeded",
                    "file": object_key,
                    "file_size_mb": e.file_size_mb,
                    "max_size_mb": e.max_size_mb,
                    "job_id": tracker.context.job_id
                }

            case_id = extract_case_id(object_key, bucket_name)
            tracker.set_case_id(case_id)

            with tracker.stage(ProcessingStage.HASH) as stage:
                self.logger.debug("Calculating hash...")
                file_hash = self.hash_func(local_path)
                self.logger.debug(f"Hash: {file_hash}")
                stage.add_metadata(hash_prefix=file_hash[:16])

            backend_evidence_id = extract_evidence_id(object_key)
            if backend_evidence_id:
                existing_record = self.metadata_store.get_evidence(backend_evidence_id)
                if existing_record and existing_record.get('status') == 'completed':
                    tracker.record_error(ErrorType.DUPLICATE, f"Evidence already completed: {backend_evidence_id}")
                    tracker.log_summary()
                    return {
                        "status": "skipped",
                        "reason": "already_processed_evidence_id",
                        "evidence_id": backend_evidence_id,
                        "file": object_key,
                        "job_id": tracker.context.job_id
                    }

            existing_by_hash = self.metadata_store.check_hash_exists(file_hash, case_id=case_id)
            if existing_by_hash and existing_by_hash.get('status') == 'completed':
                tracker.record_error(ErrorType.DUPLICATE, f"Hash already completed in case {case_id}: {file_hash}")
                tracker.log_summary()
                return {
                    "status": "skipped",
                    "reason": "already_processed_hash",
                    "existing_evidence_id": existing_by_hash.get('evidence_id'),
                    "file": object_key,
                    "job_id": tracker.context.job_id
                }

            existing_by_s3_key = self.metadata_store.check_s3_key_exists(object_key)
            if existing_by_s3_key and existing_by_s3_key.get('status') == 'completed':
                tracker.record_error(ErrorType.DUPLICATE, f"S3 key already completed: {existing_by_s3_key.get('evidence_id')}")
                tracker.log_summary()
                return {
                    "status": "skipped",
                    "reason": "already_processed_s3_key",
                    "existing_evidence_id": existing_by_s3_key.get('evidence_id'),
                    "file": object_key,
                    "job_id": tracker.context.job_id
                }

            with tracker.stage(ProcessingStage.PARSE) as stage:
                parsed_result = parser.parse(local_path)
                stage.log(f"Parsed with {parser.__class__.__name__}")
                stage.add_metadata(
                    parser_type=parser.__class__.__name__,
                    message_count=len(parsed_result) if parsed_result else 0
                )

            file_id = backend_evidence_id or f"file_{uuid.uuid4().hex[:12]}"
            source_type = parsed_result[0].metadata.get("source_type", "unknown") if parsed_result else "unknown"

            chunk_ids = []
            tags_list = []
            all_categories = set()
            fallback_embedding_count = 0

            with tracker.stage(ProcessingStage.ANALYZE) as analyze_stage:
                for message in parsed_result:
                    tagging_result = self.tagger.tag(message)
                    categories = [cat.value for cat in tagging_result.categories]
                    confidence = tagging_result.confidence
                    tags_list.append({
                        "categories": categories,
                        "confidence": confidence,
                        "matched_keywords": tagging_result.matched_keywords
                    })
                    all_categories.update(categories)
                analyze_stage.add_metadata(
                    messages_analyzed=len(parsed_result),
                    categories_detected=list(all_categories)
                )

            auto_extract_result = None
            try:
                full_text_for_extraction = "\n".join([msg.content for msg in parsed_result])
                messages_for_extraction = [
                    {"sender": msg.sender, "content": msg.content}
                    for msg in parsed_result
                ]
                extracted_persons = extract_persons_from_messages(messages_for_extraction)
                inferred_relationships = infer_relationships(full_text_for_extraction)

                tracker.log(
                    f"Auto-extraction: {len(extracted_persons)} persons, {len(inferred_relationships)} relationships"
                )

                if backend_evidence_id and (extracted_persons or inferred_relationships):
                    auto_extract_result = save_extracted_graph_to_backend(
                        case_id=case_id,
                        persons=extracted_persons,
                        relationships=inferred_relationships,
                        source_evidence_id=backend_evidence_id,
                        min_confidence=0.7
                    )
                    tracker.log(
                        f"Auto-extraction saved: {auto_extract_result.get('parties_saved', 0)} parties, "
                        f"{auto_extract_result.get('relationships_saved', 0)} relationships"
                    )
                    tracker.add_metadata(auto_extract_result=auto_extract_result)

            except Exception as e:
                tracker.record_error(
                    ErrorType.API_ERROR,
                    f"Auto-extraction failed: {e}",
                    exception=e
                )
                self.logger.warning(f"Auto-extraction failed (non-fatal): {e}")

            embeddings_data = []
            with tracker.stage(ProcessingStage.EMBED) as embed_stage:
                for idx, message in enumerate(parsed_result):
                    content = message.content
                    embedding, is_real_embedding = self.embedding_provider.get_embedding(content)
                    if not is_real_embedding:
                        fallback_embedding_count += 1
                    embeddings_data.append({
                        "message": message,
                        "embedding": embedding,
                        "is_real": is_real_embedding,
                        "tags": tags_list[idx]
                    })
                embed_stage.add_metadata(
                    embeddings_generated=len(embeddings_data),
                    fallback_count=fallback_embedding_count
                )
                if fallback_embedding_count > 0:
                    embed_stage.log(
                        f"Using fallback embeddings for {fallback_embedding_count} chunks",
                        level="warning"
                    )

            with tracker.stage(ProcessingStage.STORE) as store_stage:
                for data in embeddings_data:
                    message = data["message"]
                    embedding = data["embedding"]
                    is_real_embedding = data["is_real"]
                    tags = data["tags"]

                    chunk_id = f"chunk_{uuid.uuid4().hex[:12]}"
                    content = message.content
                    timestamp = message.timestamp.isoformat() if message.timestamp else datetime.now(timezone.utc).isoformat()
                    categories = tags["categories"]
                    confidence = tags["confidence"]

                    metadata = message.metadata if hasattr(message, 'metadata') else {}
                    line_number = metadata.get("line_number")
                    page_number = metadata.get("page_number")
                    segment_start = metadata.get("segment_start_sec")
                    segment_end = metadata.get("segment_end_sec")

                    collection_name = f"case_rag_{case_id}"
                    self.vector_store.add_chunk_with_metadata(
                        chunk_id=chunk_id,
                        file_id=file_id,
                        case_id=case_id,
                        content=content,
                        embedding=embedding,
                        timestamp=timestamp,
                        sender=message.sender,
                        score=None,
                        collection_name=collection_name,
                        file_name=file_path.name,
                        file_type=source_type,
                        legal_categories=categories if categories else None,
                        confidence_level=confidence if confidence else None,
                        line_number=line_number,
                        page_number=page_number,
                        segment_start_sec=segment_start,
                        segment_end_sec=segment_end,
                        is_fallback_embedding=not is_real_embedding
                    )
                    chunk_ids.append(chunk_id)
                store_stage.add_metadata(chunks_indexed=len(chunk_ids))

            try:
                summary_result = self.summarizer.summarize_evidence(parsed_result, max_words=100)
                ai_summary = summary_result.summary
                tracker.log(f"AI Summary generated: {ai_summary[:50]}...")
            except Exception as e:
                tracker.record_error(ErrorType.API_ERROR, f"AI summarization failed: {e}", exception=e)
                ai_summary = (
                    f"총 {len(parsed_result)}개 메시지 분석 완료. "
                    f"감지된 태그: {', '.join(all_categories) if all_categories else '없음'}"
                )

            article_840_tags = {
                "categories": list(all_categories),
                "total_messages": len(parsed_result),
                "chunks_indexed": len(chunk_ids)
            }

            full_content = "\n".join([msg.content for msg in parsed_result])
            if len(full_content) > 50000:
                full_content = full_content[:50000] + "\n\n... (이하 생략, 전체 {} 메시지)".format(len(parsed_result))

            original_filename = file_path.name
            if original_filename.startswith('ev_') and '_' in original_filename[3:]:
                parts = original_filename.split('_', 2)
                if len(parts) >= 3:
                    original_filename = parts[2]

            if backend_evidence_id:
                updated = self.metadata_store.update_evidence_with_hash(
                    evidence_id=backend_evidence_id,
                    file_hash=file_hash,
                    status="completed",
                    ai_summary=ai_summary,
                    article_840_tags=article_840_tags,
                    qdrant_id=chunk_ids[0] if chunk_ids else None,
                    case_id=case_id,
                    filename=original_filename,
                    s3_key=object_key,
                    file_type=source_type,
                    content=full_content,
                    skip_if_processed=True
                )
                if updated:
                    tracker.log(f"Updated Backend evidence: {backend_evidence_id} → completed")
                else:
                    tracker.record_error(ErrorType.DUPLICATE, f"Evidence {backend_evidence_id} already processed (concurrent)")
                    tracker.log_summary()
                    return {
                        "status": "skipped",
                        "reason": "concurrent_processed",
                        "evidence_id": backend_evidence_id,
                        "file": object_key,
                        "job_id": tracker.context.job_id
                    }
            else:
                evidence_file = EvidenceFile(
                    file_id=file_id,
                    filename=file_path.name,
                    file_type=source_type,
                    parsed_at=datetime.now(timezone.utc),
                    total_messages=len(parsed_result),
                    case_id=case_id,
                    filepath=object_key
                )
                try:
                    self.metadata_store.save_file_if_not_exists(evidence_file, file_hash)
                    tracker.log(f"Created new evidence record: {file_id}")
                except DuplicateError:
                    tracker.record_error(ErrorType.DUPLICATE, f"Evidence {file_id} already exists (concurrent)")
                    tracker.log_summary()
                    return {
                        "status": "skipped",
                        "reason": "concurrent_created",
                        "evidence_id": file_id,
                        "file": object_key,
                        "job_id": tracker.context.job_id
                    }

            tracker.context.current_stage = ProcessingStage.COMPLETE
            tracker.add_metadata(
                chunks_indexed=len(chunk_ids),
                categories=list(all_categories),
                summary_length=len(ai_summary)
            )
            tracker.log_summary()

            return {
                "status": "completed",
                "file": object_key,
                "parser_type": parser.__class__.__name__,
                "bucket": bucket_name,
                "case_id": case_id,
                "file_id": file_id,
                "evidence_id": backend_evidence_id,
                "file_hash": file_hash,
                "chunks_indexed": len(chunk_ids),
                "tags": tags_list,
                "ai_summary": ai_summary,
                "auto_extract": auto_extract_result,
                "job_id": tracker.context.job_id,
                "job_summary": tracker.get_summary()
            }

        except Exception as e:
            error_type = classify_exception(e)
            tracker.record_error(error_type, str(e), exception=e)
            tracker.log_summary()
            return {
                "status": "error",
                "file": object_key,
                "error": str(e),
                "error_type": error_type.value,
                "job_id": tracker.context.job_id,
                "job_summary": tracker.get_summary()
            }


def build_default_orchestrator(
    logger: logging.Logger,
    storage: Optional[ObjectStoragePort] = None,
    metadata_store: Optional[MetadataStorePort] = None,
    vector_store: Optional[VectorStorePort] = None,
    embedding_provider: Optional[EmbeddingProviderPort] = None,
    tagger: Optional[Article840Tagger] = None,
    summarizer: Optional[EvidenceSummarizer] = None,
    cost_guard_factory: Optional[Callable[[], CostGuard]] = None,
    hash_func: Callable[[str], str] = calculate_file_hash
) -> PipelineOrchestrator:
    return PipelineOrchestrator(
        storage=storage or S3StorageAdapter(),
        metadata_store=metadata_store or MetadataStoreAdapter(),
        vector_store=vector_store or VectorStoreAdapter(),
        embedding_provider=embedding_provider or EmbeddingProviderAdapter(),
        logger=logger,
        tagger=tagger,
        summarizer=summarizer,
        cost_guard_factory=cost_guard_factory,
        hash_func=hash_func
    )

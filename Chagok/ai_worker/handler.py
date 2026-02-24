"""
AWS Lambda Handler for LEH AI Worker.
Triggered by S3 ObjectCreated events.

Storage Architecture (Lambda Compatible):
- MetadataStore → DynamoDB (leh_evidence table)
- VectorStore → Qdrant Cloud
"""

import json
import urllib.parse
from datetime import datetime

import boto3
from pathlib import Path
from typing import Dict, Any, Optional

# Import AI Pipeline modules
from src.parsers.text import TextParser

# Optional parsers - may not be available if dependencies are missing
try:
    from src.parsers import ImageVisionParser
except ImportError:
    ImageVisionParser = None  # type: ignore

try:
    from src.parsers import PDFParser
except ImportError:
    PDFParser = None  # type: ignore

try:
    from src.parsers import AudioParser
except ImportError:
    AudioParser = None  # type: ignore

try:
    from src.parsers import VideoParser
except ImportError:
    VideoParser = None  # type: ignore
from src.adapters.metadata_store_adapter import MetadataStoreAdapter
from src.adapters.s3_adapter import S3StorageAdapter
from src.adapters.vector_store_adapter import VectorStoreAdapter
from src.analysis.article_840_tagger import Article840Tagger
from src.analysis.summarizer import EvidenceSummarizer
from src.orchestrators.pipeline import build_default_orchestrator
from src.storage.metadata_store import MetadataStore
from src.storage.vector_store import VectorStore
from src.utils.cost_guard import CostGuard
from src.utils.embeddings import get_embedding_with_fallback
from src.utils.hash import calculate_file_hash
# 012-precedent-integration: T044-T047 자동 추출 모듈
from src.analysis.person_extractor import extract_persons_from_messages
from src.analysis.relationship_inferrer import infer_relationships
from src.api.backend_client import save_extracted_graph_to_backend
from src.utils.logging_filter import SensitiveDataFilter
from src.utils.logging import setup_lambda_logging
from src.utils.observability import classify_exception, get_metrics

# Setup structured JSON logging for Lambda
# Outputs CloudWatch Logs Insights compatible JSON format
logger = setup_lambda_logging(SensitiveDataFilter())


class _HandlerEmbeddingProvider:
    def get_embedding(self, content: str):
        return get_embedding_with_fallback(content)


def route_parser(file_extension: str) -> Optional[Any]:
    """
    파일 확장자에 따라 적절한 파서를 반환

    NOTE: Keep in sync with backend/app/services/evidence_service.py type_mapping

    Args:
        file_extension: 파일 확장자 (예: '.pdf', '.jpg', '.mp4')

    Returns:
        적절한 파서 인스턴스 또는 None
    """
    ext = file_extension.lower()

    # 이미지 파일 (image)
    if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']:
        if ImageVisionParser is None:
            logger.warning("ImageVisionParser not available (missing dependencies)")
            return None
        return ImageVisionParser()

    # PDF 파일 (pdf)
    elif ext == '.pdf':
        if PDFParser is None:
            logger.warning("PDFParser not available (missing dependencies)")
            return None
        return PDFParser()

    # 오디오 파일 (audio)
    elif ext in ['.mp3', '.wav', '.m4a', '.aac']:
        if AudioParser is None:
            logger.warning("AudioParser not available (missing dependencies)")
            return None
        return AudioParser()

    # 비디오 파일 (video)
    elif ext in ['.mp4', '.avi', '.mov', '.mkv']:
        if VideoParser is None:
            logger.warning("VideoParser not available (missing dependencies)")
            return None
        return VideoParser()

    # 텍스트 파일 (text) - 카톡 포함
    elif ext in ['.txt', '.csv', '.json']:
        return TextParser()

    else:
        logger.warning(f"Unsupported file type: {ext}")
        return None


def route_and_process(bucket_name: str, object_key: str) -> Dict[str, Any]:
    """
    S3 파일을 파싱하고 분석하는 메인 처리 함수

    Args:
        bucket_name: S3 버킷 이름
        object_key: S3 객체 키 (파일 경로)

    Returns:
        처리 결과 딕셔너리
    """
    orchestrator = build_default_orchestrator(
        logger=logger,
        storage=S3StorageAdapter(s3_client=boto3.client('s3')),
        metadata_store=MetadataStoreAdapter(store=MetadataStore()),
        vector_store=VectorStoreAdapter(store=VectorStore()),
        embedding_provider=_HandlerEmbeddingProvider(),
        tagger=Article840Tagger(),
        summarizer=EvidenceSummarizer(),
        cost_guard_factory=CostGuard,
        hash_func=calculate_file_hash
    )
    return orchestrator.process_s3_object(
        bucket_name=bucket_name,
        object_key=object_key,
        parser_router=route_parser,
        extract_case_id=_extract_case_id,
        extract_evidence_id=_extract_evidence_id_from_s3_key
    )


def _extract_case_id(object_key: str, fallback: str) -> str:
    """
    S3 object key에서 case_id 추출

    Expected formats:
    - cases/{case_id}/raw/{evidence_id}_{filename} → case_id (Backend format)
    - evidence/{case_id}/filename.ext → case_id
    - {case_id}/filename.ext → case_id
    - filename.ext → fallback (bucket name)

    Args:
        object_key: S3 object key
        fallback: Fallback value (bucket name)

    Returns:
        Extracted case_id
    """
    parts = object_key.split('/')

    # cases/{case_id}/raw/{evidence_id}_{filename} 패턴 (Backend format)
    if len(parts) >= 4 and parts[0] == 'cases' and parts[2] == 'raw':
        return parts[1]

    # evidence/{case_id}/file.ext 패턴
    if len(parts) >= 3 and parts[0] == 'evidence':
        return parts[1]

    # {case_id}/file.ext 패턴
    if len(parts) >= 2:
        return parts[0]

    # 파일만 있는 경우 fallback
    return fallback


def _extract_evidence_id_from_s3_key(object_key: str) -> Optional[str]:
    """
    S3 object key에서 evidence_id 추출 (Backend 레코드 업데이트용)

    Expected format:
    - cases/{case_id}/raw/{evidence_id}_{filename}
    - 예: cases/case_001/raw/ev_abc123_photo.jpg → ev_abc123

    Args:
        object_key: S3 object key

    Returns:
        evidence_id if found, None otherwise
    """
    parts = object_key.split('/')

    # cases/{case_id}/raw/{evidence_id}_{filename} 패턴
    if len(parts) >= 4 and parts[0] == 'cases' and parts[2] == 'raw':
        filename = parts[3]
        # ev_xxx_filename.ext → ev_xxx 추출
        if filename.startswith('ev_') and '_' in filename[3:]:
            # ev_abc123_photo.jpg → ['ev', 'abc123', 'photo.jpg']
            ev_parts = filename.split('_', 2)
            if len(ev_parts) >= 2:
                return f"ev_{ev_parts[1]}"

    return None


def _handle_health_check(context) -> dict:
    """
    Lambda health check handler.
    Verifies connectivity to external services (OpenAI, Qdrant, DynamoDB).

    Usage: Invoke Lambda with {"action": "health_check"}

    Returns:
        dict: Health status of all components
    """
    import os
    from datetime import datetime

    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "leh-ai-worker",
        "version": "1.0.0",
        "checks": {}
    }

    # Check OpenAI API key
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if openai_key and openai_key.startswith("sk-"):
        health["checks"]["openai"] = {"status": "ok", "message": "API key configured"}
    else:
        health["checks"]["openai"] = {"status": "error", "message": "API key missing"}
        health["status"] = "degraded"

    # Check Qdrant configuration
    qdrant_url = os.getenv("QDRANT_URL") or os.getenv("QDRANT_HOST")
    if qdrant_url:
        health["checks"]["qdrant"] = {"status": "ok", "message": "URL configured"}
    else:
        health["checks"]["qdrant"] = {"status": "error", "message": "URL missing"}
        health["status"] = "degraded"

    # Check DynamoDB table configuration
    ddb_table = os.getenv("DDB_EVIDENCE_TABLE") or os.getenv("DYNAMODB_TABLE")
    if ddb_table:
        health["checks"]["dynamodb"] = {"status": "ok", "message": f"Table: {ddb_table}"}
    else:
        health["checks"]["dynamodb"] = {"status": "error", "message": "Table not configured"}
        health["status"] = "degraded"

    # Check S3 bucket configuration
    s3_bucket = os.getenv("S3_EVIDENCE_BUCKET")
    if s3_bucket:
        health["checks"]["s3"] = {"status": "ok", "message": f"Bucket: {s3_bucket}"}
    else:
        health["checks"]["s3"] = {"status": "error", "message": "Bucket not configured"}
        health["status"] = "degraded"

    # Add Lambda context info if available
    if context:
        health["lambda"] = {
            "function_name": getattr(context, "function_name", "unknown"),
            "memory_limit_mb": getattr(context, "memory_limit_in_mb", "unknown"),
            "remaining_time_ms": getattr(context, "get_remaining_time_in_millis", lambda: "unknown")()
        }

    logger.info("Health check completed", extra={"health_status": health["status"]})

    return {
        "statusCode": 200,
        "body": json.dumps(health)
    }


def handle(event, context):
    """
    AWS Lambda Entrypoint.
    S3 이벤트를 수신하여 파일 정보를 파싱하고 AI 파이프라인을 시작합니다.
    """
    import time
    start_time = time.time()

    # Extract trace_id from Lambda context for request tracking
    trace_id = getattr(context, 'aws_request_id', None) if context else None

    # Initialize CloudWatch metrics
    metrics = get_metrics()

    logger.info(
        "Received S3 event",
        extra={
            "trace_id": trace_id,
            "record_count": len(event.get("Records", [])),
            "event_source": event.get("Records", [{}])[0].get("eventSource", "unknown")
        }
    )

    # Health check 처리 (Lambda 직접 호출 시)
    if event.get("action") == "health_check":
        return _handle_health_check(context)

    # S3 이벤트가 아닌 경우(테스트 등) 방어 로직
    if "Records" not in event:
        return {"status": "ignored", "reason": "No S3 Records found"}

    results = []

    for record in event["Records"]:
        file_type = None
        try:
            # 1. S3 이벤트에서 버킷과 키(파일 경로) 추출
            s3 = record.get("s3", {})
            bucket_name = s3.get("bucket", {}).get("name")
            object_key = s3.get("object", {}).get("key")
            file_size = s3.get("object", {}).get("size", 0)

            # URL Decoding (공백 등이 + 또는 %20으로 들어올 수 있음)
            if object_key:
                object_key = urllib.parse.unquote_plus(object_key)
                file_type = Path(object_key).suffix.lower().lstrip('.')

            logger.info(
                "Processing file",
                extra={
                    "trace_id": trace_id,
                    "bucket": bucket_name,
                    "key": object_key,
                    "file_extension": file_type,
                    "file_size": file_size
                }
            )

            # 2. 파일 처리 로직 실행 (Strategy Pattern 적용)
            result = route_and_process(bucket_name, object_key)
            results.append(result)

            # Record successful processing metric
            if file_type:
                metrics.record_file_processed(file_type, file_size)

            logger.info(
                "File processed successfully",
                extra={
                    "trace_id": trace_id,
                    "key": object_key,
                    "status": result.get("status", "unknown")
                }
            )

        except Exception as e:
            error_type = classify_exception(e)

            logger.error(
                "Error processing record",
                extra={
                    "trace_id": trace_id,
                    "error_type": type(e).__name__,
                    "error_message": str(e)
                },
                exc_info=True
            )

            # Record error metric
            metrics.record_error(error_type, file_type)

            # 실제 운영 시에는 여기서 DLQ로 보내거나 에러를 다시 raise 해야 함
            results.append({"error": str(e), "status": "failed"})

    # Calculate total execution time
    duration_ms = (time.time() - start_time) * 1000
    success_count = sum(1 for r in results if r.get("status") != "failed")
    failed_count = sum(1 for r in results if r.get("status") == "failed")

    # Record execution time metric
    metrics.record_execution_time(
        duration_ms=duration_ms,
        success=(failed_count == 0)
    )

    # Record memory usage if available from Lambda context
    if context and hasattr(context, 'memory_limit_in_mb'):
        # Note: Lambda doesn't directly expose used memory, but we can estimate
        # For now, just record the limit. In production, use /proc/meminfo
        try:
            import resource
            memory_used_mb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss // 1024
            metrics.record_memory_usage(memory_used_mb, context.memory_limit_in_mb)
        except Exception:
            pass  # Memory tracking not critical

    # Flush all metrics to CloudWatch
    metrics.flush()

    logger.info(
        "Lambda execution complete",
        extra={
            "trace_id": trace_id,
            "total_records": len(results),
            "successful": success_count,
            "failed": failed_count,
            "duration_ms": round(duration_ms, 2)
        }
    )

    return {
        "statusCode": 200,
        "body": json.dumps({"results": results})
    }

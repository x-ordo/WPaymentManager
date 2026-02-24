"""
Unit tests for evidence handlers and EvidenceService facade wrappers.
"""

from datetime import datetime
from unittest.mock import MagicMock

import pytest

from app.core.config import settings
from app.db.models import UserRole
from app.db.schemas import ExifMetadataInput, UploadCompleteRequest, EvidenceReviewResponse
from app.middleware import NotFoundError, PermissionError
from app.services.evidence.upload_handler import EvidenceUploadHandler
from app.services.evidence.evidence_query import EvidenceQueryService
from app.services.evidence.processing_handler import EvidenceProcessingHandler
from app.services.evidence.review_handler import EvidenceReviewHandler
from app.services.evidence.deletion_handler import EvidenceDeletionHandler
from app.services.evidence_service import EvidenceService
from app.utils.consistency import ConsistencyError


def make_upload_handler():
    case_repo = MagicMock()
    member_repo = MagicMock()
    user_repo = MagicMock()
    s3_port = MagicMock()
    metadata_port = MagicMock()
    ai_worker_port = MagicMock()
    return (
        EvidenceUploadHandler(
            case_repo,
            member_repo,
            user_repo,
            s3_port,
            metadata_port,
            ai_worker_port,
        ),
        case_repo,
        member_repo,
        user_repo,
        metadata_port,
        ai_worker_port,
    )


def test_upload_complete_client_exif_skipped():
    handler, case_repo, member_repo, user_repo, metadata_port, ai_worker_port = make_upload_handler()
    case_repo.get_by_id.return_value = MagicMock()
    member_repo.has_access.return_value = True
    user_repo.get_by_id.return_value = MagicMock(role=UserRole.CLIENT)
    ai_worker_port.invoke_ai_worker.return_value = {"status": "skipped"}
    settings.S3_EVIDENCE_BUCKET = "bucket"

    request = UploadCompleteRequest(
        case_id="case-1",
        evidence_temp_id="ev-1",
        s3_key="cases/case-1/raw/ev-1_photo.jpg",
        file_size=123,
        exif_metadata=ExifMetadataInput(
            gps_latitude=37.0,
            gps_longitude=127.0,
            gps_altitude=12.3,
            datetime_original="2024-01-01T00:00:00Z",
            camera_make="Canon",
            camera_model="EOS",
        ),
    )

    result = handler.handle_upload_complete(request, "user-1")

    assert result.status == "pending"
    assert result.review_status == "pending_review"
    metadata_port.put_evidence_metadata.assert_called_once()
    payload = metadata_port.put_evidence_metadata.call_args[0][0]
    assert payload["review_status"] == "pending_review"
    assert "exif_metadata" in payload
    metadata_port.update_evidence_status.assert_not_called()


def test_upload_complete_error_status_marks_failed():
    handler, case_repo, member_repo, user_repo, metadata_port, ai_worker_port = make_upload_handler()
    case_repo.get_by_id.return_value = MagicMock()
    member_repo.has_access.return_value = True
    user_repo.get_by_id.return_value = None
    ai_worker_port.invoke_ai_worker.return_value = {
        "status": "error",
        "error_message": "boom",
    }
    settings.S3_EVIDENCE_BUCKET = "bucket"

    request = UploadCompleteRequest(
        case_id="case-1",
        evidence_temp_id="ev-2",
        s3_key="cases/case-1/raw/ev-2_note.txt",
        file_size=10,
    )

    result = handler.handle_upload_complete(request, "user-1")

    assert result.status == "failed"
    assert result.review_status == "approved"
    metadata_port.update_evidence_status.assert_called_once_with(
        "ev-2",
        "failed",
        error_message="boom"
    )


def test_upload_complete_exception_marks_failed():
    handler, case_repo, member_repo, user_repo, metadata_port, ai_worker_port = make_upload_handler()
    case_repo.get_by_id.return_value = MagicMock()
    member_repo.has_access.return_value = True
    user_repo.get_by_id.return_value = MagicMock(role=UserRole.LAWYER)
    ai_worker_port.invoke_ai_worker.side_effect = RuntimeError("nope")
    settings.S3_EVIDENCE_BUCKET = "bucket"

    request = UploadCompleteRequest(
        case_id="case-1",
        evidence_temp_id="ev-3",
        s3_key="cases/case-1/raw/ev-3_file.pdf",
    )

    result = handler.handle_upload_complete(request, "user-1")

    assert result.status == "failed"
    metadata_port.update_evidence_status.assert_called_once_with(
        "ev-3",
        "failed",
        error_message="nope"
    )


def test_query_list_no_access():
    case_repo = MagicMock()
    member_repo = MagicMock()
    metadata_port = MagicMock()
    member_repo.has_access.return_value = False

    handler = EvidenceQueryService(case_repo, member_repo, metadata_port)

    with pytest.raises(PermissionError):
        handler.get_evidence_list("case-1", "user-1")


def test_query_detail_with_mapping_and_status():
    case_repo = MagicMock()
    member_repo = MagicMock()
    metadata_port = MagicMock()
    member_repo.has_access.return_value = True
    metadata_port.get_evidence_by_id.return_value = {
        "evidence_id": "ev-1",
        "case_id": "case-1",
        "type": "audio",
        "filename": "note.mp3",
        "size": 100,
        "s3_key": "cases/case-1/raw/ev-1_note.mp3",
        "content_type": "audio/mpeg",
        "created_at": "2024-01-01T00:00:00+00:00",
        "status": "done",
        "labels": ["legacy"],
        "article_840_tags": {
            "categories": ["adultery"],
            "confidence": 0.8,
            "matched_keywords": ["x"],
        },
        "speaker_mapping": {
            "A": {"party_id": "party-1", "party_name": "Person"},
        },
        "speaker_mapping_updated_at": "2024-01-02T00:00:00+00:00",
        "timestamp": "2024-01-01T00:00:00Z",
    }

    handler = EvidenceQueryService(case_repo, member_repo, metadata_port)
    result = handler.get_evidence_detail("ev-1", "user-1")

    assert result.speaker_mapping["A"].party_id == "party-1"
    assert result.speaker_mapping_updated_at is not None
    assert result.labels == ["adultery"]
    assert result.timestamp is not None


def test_query_status_success():
    case_repo = MagicMock()
    member_repo = MagicMock()
    metadata_port = MagicMock()
    member_repo.has_access.return_value = True
    metadata_port.get_evidence_by_id.return_value = {
        "evidence_id": "ev-1",
        "case_id": "case-1",
        "status": "failed",
        "error_message": "boom",
        "updated_at": "2024-01-01T00:00:00Z",
    }

    handler = EvidenceQueryService(case_repo, member_repo, metadata_port)
    result = handler.get_evidence_status("ev-1", "user-1")

    assert result["status"] == "failed"
    assert result["error_message"] == "boom"


def test_processing_invalid_status():
    member_repo = MagicMock()
    metadata_port = MagicMock()
    ai_worker_port = MagicMock()
    metadata_port.get_evidence_by_id.return_value = {
        "case_id": "case-1",
        "status": "done",
        "s3_key": "cases/case-1/raw/ev-1.txt",
    }
    member_repo.has_access.return_value = True
    handler = EvidenceProcessingHandler(member_repo, metadata_port, ai_worker_port)

    with pytest.raises(ValueError):
        handler.retry_processing("ev-1", "user-1")


def test_processing_missing_s3_key():
    member_repo = MagicMock()
    metadata_port = MagicMock()
    ai_worker_port = MagicMock()
    metadata_port.get_evidence_by_id.return_value = {
        "case_id": "case-1",
        "status": "failed",
    }
    member_repo.has_access.return_value = True
    handler = EvidenceProcessingHandler(member_repo, metadata_port, ai_worker_port)

    with pytest.raises(ValueError):
        handler.retry_processing("ev-1", "user-1")


def test_processing_invoked():
    member_repo = MagicMock()
    metadata_port = MagicMock()
    ai_worker_port = MagicMock()
    metadata_port.get_evidence_by_id.return_value = {
        "case_id": "case-1",
        "status": "failed",
        "s3_key": "cases/case-1/raw/ev-1.txt",
    }
    member_repo.has_access.return_value = True
    ai_worker_port.invoke_ai_worker.return_value = {"status": "invoked"}
    settings.S3_EVIDENCE_BUCKET = "bucket"

    handler = EvidenceProcessingHandler(member_repo, metadata_port, ai_worker_port)
    result = handler.retry_processing("ev-1", "user-1")

    assert result["success"] is True
    metadata_port.update_evidence_status.assert_called_once_with(
        "ev-1",
        "processing",
        error_message=None
    )


def test_processing_skipped():
    member_repo = MagicMock()
    metadata_port = MagicMock()
    ai_worker_port = MagicMock()
    metadata_port.get_evidence_by_id.return_value = {
        "case_id": "case-1",
        "status": "failed",
        "s3_key": "cases/case-1/raw/ev-1.txt",
    }
    member_repo.has_access.return_value = True
    ai_worker_port.invoke_ai_worker.return_value = {"status": "skipped"}
    settings.S3_EVIDENCE_BUCKET = "bucket"

    handler = EvidenceProcessingHandler(member_repo, metadata_port, ai_worker_port)
    result = handler.retry_processing("ev-1", "user-1")

    assert result["success"] is False
    metadata_port.update_evidence_status.assert_called_once_with(
        "ev-1",
        "pending",
        error_message=None
    )


def test_processing_error_status():
    member_repo = MagicMock()
    metadata_port = MagicMock()
    ai_worker_port = MagicMock()
    metadata_port.get_evidence_by_id.return_value = {
        "case_id": "case-1",
        "status": "failed",
        "s3_key": "cases/case-1/raw/ev-1.txt",
    }
    member_repo.has_access.return_value = True
    ai_worker_port.invoke_ai_worker.return_value = {
        "status": "error",
        "error_message": "boom",
    }
    settings.S3_EVIDENCE_BUCKET = "bucket"

    handler = EvidenceProcessingHandler(member_repo, metadata_port, ai_worker_port)
    result = handler.retry_processing("ev-1", "user-1")

    assert result["status"] == "failed"
    metadata_port.update_evidence_status.assert_called_once_with(
        "ev-1",
        "failed",
        error_message="boom"
    )


def test_processing_exception():
    member_repo = MagicMock()
    metadata_port = MagicMock()
    ai_worker_port = MagicMock()
    metadata_port.get_evidence_by_id.return_value = {
        "case_id": "case-1",
        "status": "failed",
        "s3_key": "cases/case-1/raw/ev-1.txt",
    }
    member_repo.has_access.return_value = True
    ai_worker_port.invoke_ai_worker.side_effect = RuntimeError("fail")
    settings.S3_EVIDENCE_BUCKET = "bucket"

    handler = EvidenceProcessingHandler(member_repo, metadata_port, ai_worker_port)
    result = handler.retry_processing("ev-1", "user-1")

    assert result["status"] == "failed"
    metadata_port.update_evidence_status.assert_called_once_with(
        "ev-1",
        "failed",
        error_message="fail"
    )


def test_review_handler_errors_and_success():
    case_repo = MagicMock()
    member_repo = MagicMock()
    metadata_port = MagicMock()
    handler = EvidenceReviewHandler(case_repo, member_repo, metadata_port)

    case_repo.get_by_id.return_value = None
    with pytest.raises(NotFoundError):
        handler.review_evidence("case-1", "ev-1", "user-1", "approve")

    case_repo.get_by_id.return_value = MagicMock()
    member_repo.has_access.return_value = False
    with pytest.raises(PermissionError):
        handler.review_evidence("case-1", "ev-1", "user-1", "approve")

    member_repo.has_access.return_value = True
    metadata_port.get_evidence_by_id.return_value = None
    with pytest.raises(NotFoundError):
        handler.review_evidence("case-1", "ev-1", "user-1", "approve")

    metadata_port.get_evidence_by_id.return_value = {
        "case_id": "other-case",
        "review_status": "pending_review",
    }
    with pytest.raises(NotFoundError):
        handler.review_evidence("case-1", "ev-1", "user-1", "approve")

    metadata_port.get_evidence_by_id.return_value = {
        "case_id": "case-1",
        "review_status": "approved",
    }
    with pytest.raises(ValueError):
        handler.review_evidence("case-1", "ev-1", "user-1", "approve")

    metadata_port.get_evidence_by_id.return_value = {
        "case_id": "case-1",
        "review_status": "pending_review",
        "status": "pending",
    }
    result = handler.review_evidence(
        "case-1",
        "ev-1",
        "user-1",
        "approve",
        comment="ok"
    )
    assert result.review_status == "approved"
    assert result.comment == "ok"
    metadata_port.update_evidence_status.assert_called()


def test_deletion_handler_branches():
    db = MagicMock()
    member_repo = MagicMock()
    metadata_port = MagicMock()
    audit_port = MagicMock()
    consistency_port = MagicMock()
    handler = EvidenceDeletionHandler(
        db,
        member_repo,
        metadata_port,
        audit_port,
        consistency_port,
    )

    metadata_port.get_evidence_by_id.return_value = None
    with pytest.raises(NotFoundError):
        handler.delete_evidence("ev-1", "user-1")

    metadata_port.get_evidence_by_id.return_value = {"case_id": "case-1"}
    member_repo.has_access.return_value = False
    with pytest.raises(PermissionError):
        handler.delete_evidence("ev-1", "user-1")

    member_repo.has_access.return_value = True
    consistency_port.delete_evidence_with_index.return_value = True
    result = handler.delete_evidence("ev-1", "user-1", hard_delete=True)
    assert result["success"] is True
    audit_port.log_audit_event.assert_called()
    db.commit.assert_called()

    consistency_port.delete_evidence_with_index.side_effect = ConsistencyError(
        "oops",
        partial_success=True,
        details={"step": "qdrant"}
    )
    result = handler.delete_evidence("ev-1", "user-1", hard_delete=True)
    assert result["success"] is False
    assert result["partial_success"] is True

    consistency_port.delete_evidence_with_index.side_effect = None
    metadata_port.update_evidence_status.return_value = True
    result = handler.delete_evidence("ev-1", "user-1", hard_delete=False)
    assert result["success"] is True

    metadata_port.update_evidence_status.return_value = False
    audit_port.log_audit_event.reset_mock()
    result = handler.delete_evidence("ev-1", "user-1", hard_delete=False)
    assert result["success"] is False
    audit_port.log_audit_event.assert_not_called()


def test_service_wrapper_delegation():
    service = EvidenceService(
        MagicMock(),
        s3_port=MagicMock(),
        metadata_port=MagicMock(),
        ai_worker_port=MagicMock(),
        audit_port=MagicMock(),
        consistency_port=MagicMock(),
    )
    service.processing_handler = MagicMock()
    service.query_handler = MagicMock()
    service.review_handler = MagicMock()
    service.deletion_handler = MagicMock()

    service.processing_handler.retry_processing.return_value = {"ok": True}
    service.query_handler.get_evidence_status.return_value = {"status": "ok"}
    review_result = EvidenceReviewResponse(
        evidence_id="ev-1",
        case_id="case-1",
        review_status="approved",
        reviewed_by="user-1",
        reviewed_at=datetime.utcnow(),
        comment=None,
    )
    service.review_handler.review_evidence.return_value = review_result
    service.deletion_handler.delete_evidence.return_value = {"deleted": True}

    assert service.retry_processing("ev-1", "user-1") == {"ok": True}
    assert service.get_evidence_status("ev-1", "user-1") == {"status": "ok"}
    assert service.review_evidence("case-1", "ev-1", "user-1", "approve") is review_result
    assert service.delete_evidence("ev-1", "user-1") == {"deleted": True}

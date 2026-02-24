"""
Evidence upload handling (presigned URL generation + upload completion).
"""

from datetime import datetime
import logging
from typing import Optional

from app.core.config import settings
from app.db.models import UserRole
from app.db.schemas import (
    PresignedUrlRequest,
    PresignedUrlResponse,
    UploadCompleteRequest,
    UploadCompleteResponse,
)
from app.middleware import NotFoundError, PermissionError
from app.repositories.case_member_repository import CaseMemberRepository
from app.repositories.case_repository import CaseRepository
from app.repositories.user_repository import UserRepository
from app.ports.ai_worker import AiWorkerPort
from app.ports.storage import EvidenceMetadataPort, S3Port
from app.middleware import ValidationError
from app.utils.evidence import (
    generate_evidence_id,
    extract_filename_from_s3_key,
    validate_evidence_filename,
)

logger = logging.getLogger(__name__)


CONTENT_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif",
    "mp3": "audio/mpeg", "wav": "audio/wav", "m4a": "audio/mp4",
    "mp4": "video/mp4", "avi": "video/x-msvideo", "mov": "video/quicktime",
    "pdf": "application/pdf",
    "txt": "text/plain", "csv": "text/csv", "json": "application/json",
}


def get_content_type(extension: str) -> str:
    """Get MIME content type from file extension."""
    return CONTENT_TYPES.get(extension, "application/octet-stream")


class EvidenceUploadHandler:
    """Handles presigned URL generation and upload completion."""

    def __init__(
        self,
        case_repo: CaseRepository,
        member_repo: CaseMemberRepository,
        user_repo: UserRepository,
        s3_port: S3Port,
        metadata_port: EvidenceMetadataPort,
        ai_worker_port: AiWorkerPort,
    ):
        self.case_repo = case_repo
        self.member_repo = member_repo
        self.user_repo = user_repo
        self.s3_port = s3_port
        self.metadata_port = metadata_port
        self.ai_worker_port = ai_worker_port

    def generate_upload_presigned_url(
        self,
        request: PresignedUrlRequest,
        user_id: str
    ) -> PresignedUrlResponse:
        """
        Generate S3 presigned URL for evidence upload.
        """
        case = self.case_repo.get_by_id(request.case_id)
        if not case:
            raise NotFoundError("Case")

        if not self.member_repo.has_access(request.case_id, user_id):
            raise PermissionError("You do not have access to this case")

        extension = validate_evidence_filename(request.filename)
        evidence_temp_id = generate_evidence_id()
        s3_key = f"cases/{request.case_id}/raw/{evidence_temp_id}_{request.filename}"

        presigned_data = self.s3_port.generate_presigned_upload_url(
            bucket=settings.S3_EVIDENCE_BUCKET,
            key=s3_key,
            content_type=get_content_type(extension),
            expires_in=min(settings.S3_PRESIGNED_URL_EXPIRE_SECONDS, 300)
        )

        return PresignedUrlResponse(
            upload_url=presigned_data["upload_url"],
            fields=presigned_data["fields"],
            evidence_temp_id=evidence_temp_id,
            s3_key=s3_key
        )

    def handle_upload_complete(
        self,
        request: UploadCompleteRequest,
        user_id: str
    ) -> UploadCompleteResponse:
        """
        Handle evidence upload completion notification.
        """
        case = self.case_repo.get_by_id(request.case_id)
        if not case:
            raise NotFoundError("Case")

        if not self.member_repo.has_access(request.case_id, user_id):
            raise PermissionError("You do not have access to this case")

        uploader = self.user_repo.get_by_id(user_id)
        if uploader and uploader.role == UserRole.CLIENT:
            review_status = "pending_review"
        else:
            review_status = "approved"

        filename = extract_filename_from_s3_key(request.s3_key)

        try:
            extension = validate_evidence_filename(filename)
        except ValidationError as exc:
            logger.warning("Upload complete rejected due to invalid filename: %s", exc)
            raise
        type_mapping = {
            "jpg": "image", "jpeg": "image", "png": "image", "gif": "image", "bmp": "image",
            "mp3": "audio", "wav": "audio", "m4a": "audio", "aac": "audio",
            "mp4": "video", "avi": "video", "mov": "video", "mkv": "video",
            "pdf": "pdf",
            "txt": "text", "csv": "text", "json": "text",
        }
        evidence_type = type_mapping.get(extension, "document")

        evidence_id = request.evidence_temp_id
        created_at = datetime.utcnow()

        evidence_metadata = {
            "evidence_id": evidence_id,
            "case_id": request.case_id,
            "type": evidence_type,
            "filename": filename,
            "s3_key": request.s3_key,
            "size": request.file_size,
            "content_type": get_content_type(extension),
            "status": "pending",
            "review_status": review_status,
            "created_at": created_at.isoformat(),
            "created_by": user_id,
            "note": request.note,
            "deleted": False,
        }

        if request.exif_metadata:
            exif_data = {}
            if request.exif_metadata.gps_latitude is not None:
                exif_data["gps_latitude"] = request.exif_metadata.gps_latitude
            if request.exif_metadata.gps_longitude is not None:
                exif_data["gps_longitude"] = request.exif_metadata.gps_longitude
            if request.exif_metadata.gps_altitude is not None:
                exif_data["gps_altitude"] = request.exif_metadata.gps_altitude
            if request.exif_metadata.datetime_original:
                exif_data["datetime_original"] = request.exif_metadata.datetime_original
            if request.exif_metadata.camera_make:
                exif_data["camera_make"] = request.exif_metadata.camera_make
            if request.exif_metadata.camera_model:
                exif_data["camera_model"] = request.exif_metadata.camera_model
            if exif_data:
                evidence_metadata["exif_metadata"] = exif_data
                logger.info(
                    "EXIF metadata stored for evidence %s: %s",
                    evidence_id,
                    list(exif_data.keys())
                )

        self.metadata_port.put_evidence_metadata(evidence_metadata)

        try:
            invoke_result = self.ai_worker_port.invoke_ai_worker(
                bucket=settings.S3_EVIDENCE_BUCKET,
                s3_key=request.s3_key,
                evidence_id=evidence_id,
                case_id=request.case_id
            )
            logger.info("AI Worker invocation result: %s", invoke_result)

            result_status = invoke_result.get("status", "")

            if result_status == "invoked":
                self.metadata_port.update_evidence_status(evidence_id, "processing")
            elif result_status == "skipped":
                logger.info(
                    "AI Worker disabled - evidence %s stays pending for manual processing",
                    evidence_id
                )
                return UploadCompleteResponse(
                    evidence_id=evidence_id,
                    case_id=request.case_id,
                    filename=filename,
                    s3_key=request.s3_key,
                    status="pending",
                    review_status=review_status,
                    created_at=created_at
                )
            else:
                error_msg = invoke_result.get(
                    "error_message",
                    f"Lambda invocation failed with status: {result_status}"
                )
                logger.error(
                    "AI Worker invocation failed for evidence %s: %s",
                    evidence_id,
                    error_msg
                )
                self.metadata_port.update_evidence_status(
                    evidence_id,
                    "failed",
                    error_message=error_msg
                )
                return UploadCompleteResponse(
                    evidence_id=evidence_id,
                    case_id=request.case_id,
                    filename=filename,
                    s3_key=request.s3_key,
                    status="failed",
                    review_status=review_status,
                    created_at=created_at
                )
        except Exception as exc:
            logger.error("AI Worker invocation exception for evidence %s: %s", evidence_id, exc)
            self.metadata_port.update_evidence_status(
                evidence_id,
                "failed",
                error_message=str(exc)
            )
            return UploadCompleteResponse(
                evidence_id=evidence_id,
                case_id=request.case_id,
                filename=filename,
                s3_key=request.s3_key,
                status="failed",
                review_status=review_status,
                created_at=created_at
            )

        return UploadCompleteResponse(
            evidence_id=evidence_id,
            case_id=request.case_id,
            filename=filename,
            s3_key=request.s3_key,
            status="processing",
            review_status=review_status,
            created_at=created_at
        )

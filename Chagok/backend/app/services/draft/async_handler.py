"""
Async draft preview handler extracted from DraftService.
"""

from typing import List
from datetime import datetime, timezone
import json
import logging
import traceback

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.db.models import Job, JobType, JobStatus
from app.db.schemas import (
    DraftPreviewRequest,
    DraftPreviewResponse,
    DraftJobStatus,
    DraftJobCreateResponse,
    DraftJobStatusResponse,
)
from app.middleware import NotFoundError, PermissionError
from app.repositories.case_repository import CaseRepository
from app.repositories.case_member_repository import CaseMemberRepository

logger = logging.getLogger(__name__)


class DraftAsyncHandler:
    """Encapsulates async draft preview flow and job status parsing."""

    def __init__(
        self,
        db: Session,
        case_repo: CaseRepository,
        member_repo: CaseMemberRepository,
        draft_service_cls,
    ):
        self.db = db
        self.case_repo = case_repo
        self.member_repo = member_repo
        self.draft_service_cls = draft_service_cls

    def start_async_draft_preview(
        self,
        case_id: str,
        request: DraftPreviewRequest,
        user_id: str,
        background_tasks: BackgroundTasks
    ) -> DraftJobCreateResponse:
        """Kick off async draft generation and return job info."""
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        job = Job(
            case_id=case_id,
            user_id=user_id,
            job_type=JobType.DRAFT_GENERATION,
            status=JobStatus.QUEUED,
            input_data=json.dumps({
                "sections": request.sections,
                "language": request.language,
                "style": request.style
            })
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        background_tasks.add_task(
            self._execute_draft_generation_task,
            job.id,
            case_id,
            request.sections,
            request.language,
            request.style,
            user_id
        )

        return DraftJobCreateResponse(
            job_id=job.id,
            case_id=case_id,
            status=DraftJobStatus.QUEUED,
            created_at=job.created_at
        )

    def _execute_draft_generation_task(
        self,
        job_id: str,
        case_id: str,
        sections: List[str],
        language: str,
        style: str,
        user_id: str
    ):
        """Run draft generation in background with a new DB session."""
        from app.db.session import SessionLocal

        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                logger.error(f"Job {job_id} not found")
                return

            job.status = JobStatus.PROCESSING
            job.started_at = datetime.now(timezone.utc)
            job.progress = "10"
            db.commit()

            draft_service = self.draft_service_cls(db)

            request = DraftPreviewRequest(
                sections=sections,
                language=language,
                style=style
            )

            logger.info(f"Starting draft generation for job {job_id}")
            job.progress = "30"
            db.commit()

            draft_response = draft_service.generate_draft_preview(
                case_id=case_id,
                request=request,
                user_id=user_id
            )

            job.progress = "90"
            db.commit()

            job.status = JobStatus.COMPLETED
            job.progress = "100"
            job.completed_at = datetime.now(timezone.utc)
            job.output_data = json.dumps({
                "case_id": draft_response.case_id,
                "draft_text": draft_response.draft_text,
                "citations": [c.model_dump() for c in draft_response.citations],
                "precedent_citations": [p.model_dump() for p in draft_response.precedent_citations],
                "generated_at": draft_response.generated_at.isoformat(),
                "preview_disclaimer": draft_response.preview_disclaimer
            })
            db.commit()

            logger.info(f"Draft generation completed for job {job_id}")

        except Exception as exc:
            logger.error(f"Draft generation failed for job {job_id}: {exc}")
            logger.error(traceback.format_exc())

            try:
                job = db.query(Job).filter(Job.id == job_id).first()
                if job:
                    job.status = JobStatus.FAILED
                    job.completed_at = datetime.now(timezone.utc)
                    job.error_details = json.dumps({
                        "error": str(exc),
                        "traceback": traceback.format_exc()
                    })
                    db.commit()
            except Exception as commit_error:
                logger.error(f"Failed to update job status: {commit_error}")
        finally:
            db.close()

    def get_draft_job_status(
        self,
        case_id: str,
        job_id: str,
        user_id: str
    ) -> DraftJobStatusResponse:
        """Return async draft job status with result or error."""
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        job = self.db.query(Job).filter(
            Job.id == job_id,
            Job.case_id == case_id,
            Job.job_type == JobType.DRAFT_GENERATION
        ).first()

        if not job:
            raise NotFoundError("Draft job")

        status_map = {
            JobStatus.QUEUED: DraftJobStatus.QUEUED,
            JobStatus.PROCESSING: DraftJobStatus.PROCESSING,
            JobStatus.COMPLETED: DraftJobStatus.COMPLETED,
            JobStatus.FAILED: DraftJobStatus.FAILED,
            JobStatus.RETRY: DraftJobStatus.QUEUED,
            JobStatus.CANCELLED: DraftJobStatus.FAILED,
        }

        result = None
        if job.status == JobStatus.COMPLETED and job.output_data:
            try:
                output = json.loads(job.output_data)
                result = DraftPreviewResponse(
                    case_id=output["case_id"],
                    draft_text=output["draft_text"],
                    citations=output["citations"],
                    precedent_citations=output.get("precedent_citations", []),
                    generated_at=datetime.fromisoformat(output["generated_at"]),
                    preview_disclaimer=output.get("preview_disclaimer", "")
                )
            except Exception as exc:
                logger.error(f"Failed to parse job output: {exc}")

        error_message = None
        if job.status == JobStatus.FAILED and job.error_details:
            try:
                error = json.loads(job.error_details)
                error_message = error.get("error", "알 수 없는 오류가 발생했습니다.")
            except Exception:
                error_message = "알 수 없는 오류가 발생했습니다."

        return DraftJobStatusResponse(
            job_id=job.id,
            case_id=job.case_id,
            status=status_map.get(job.status, DraftJobStatus.QUEUED),
            progress=int(job.progress) if job.progress else 0,
            result=result,
            error_message=error_message,
            created_at=job.created_at,
            completed_at=job.completed_at
        )

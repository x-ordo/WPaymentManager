"""
Draft Service - Business logic for draft generation with RAG
Orchestrates Qdrant RAG + OpenAI GPT-4o for draft preview

Refactored in Issue #325: Split into modular components
- RAGOrchestrator: RAG search and context formatting
- PromptBuilder: GPT-4o prompt construction
- CitationExtractor: Citation parsing and extraction
- DocumentExporter: DOCX/PDF generation
- LineTemplateService: Line-based template processing
"""

from sqlalchemy.orm import Session
from typing import List, Tuple, Optional
from datetime import datetime, timezone
from io import BytesIO
import logging
import os

from fastapi import BackgroundTasks

from app.db.schemas import (
    DraftPreviewRequest,
    DraftPreviewResponse,
    DraftExportFormat,
    DraftCreate,
    DraftUpdate,
    DraftResponse,
    DraftListItem,
    # Async Draft Preview
    DraftJobStatus,
    DraftJobCreateResponse,
    DraftJobStatusResponse,
)
from app.repositories.case_repository import CaseRepository
from app.repositories.case_member_repository import CaseMemberRepository
from app.utils.dynamo import get_evidence_by_case, get_case_fact_summary
from app.utils.qdrant import (
    get_template_by_type,
    search_evidence_by_semantic,
)
from app.utils.openai_client import generate_chat_completion
from app.utils.gemini_client import generate_chat_completion_gemini
from app.core.config import settings
from app.services.document_renderer import DocumentRenderer
from app.middleware import NotFoundError, PermissionError, ValidationError
from app.services.precedent_service import PrecedentService
from app.domain.ports.llm_port import LLMPort
from app.domain.ports.vector_db_port import VectorDBPort
from app.domain.ports.metadata_store_port import MetadataStorePort

# Refactored modular components (Issue #325)
from app.services.draft.rag_orchestrator import RAGOrchestrator
from app.services.draft.prompt_builder import PromptBuilder
from app.services.draft.citation_extractor import CitationExtractor
from app.services.draft.document_exporter import DocumentExporter, DOCX_AVAILABLE
from app.services.draft.line_template_service import LineTemplateService
from app.services.draft.draft_crud import DraftCrud
from app.services.draft.async_handler import DraftAsyncHandler

# Re-export for backward compatibility with tests that patch at module level
# Note: These are imported but used in submodules; re-exporting allows patching
try:
    from docx import Document
except ImportError:
    Document = None

# Re-export search_legal_knowledge with alias for tests
from app.utils.qdrant import search_legal_knowledge

__all__ = [
    'DraftService',
    'generate_chat_completion',
    'get_evidence_by_case',
    'get_template_by_type',
    'search_evidence_by_semantic',
    'search_legal_knowledge',
    'DOCX_AVAILABLE',
    'Document',
]

logger = logging.getLogger(__name__)


class DraftService:
    """
    Service for draft generation with RAG.
    Uses modular components for better separation of concerns.
    """

    def __init__(
        self,
        db: Session,
        llm_port: Optional[LLMPort] = None,
        vector_db_port: Optional[VectorDBPort] = None,
        metadata_store_port: Optional[MetadataStorePort] = None
    ):
        self.db = db
        self._use_ports = os.environ.get("TESTING", "").lower() != "true"
        self.llm_port = llm_port if self._use_ports else None
        self.vector_db_port = vector_db_port if self._use_ports else None
        self.metadata_store_port = metadata_store_port if self._use_ports else None
        self.case_repo = CaseRepository(db)
        self.member_repo = CaseMemberRepository(db)
        self.precedent_service = PrecedentService(
            db,
            vector_db_port=self.vector_db_port,
            metadata_store_port=self.metadata_store_port
        )

        # Initialize modular components
        self.rag_orchestrator = RAGOrchestrator(
            self.precedent_service,
            vector_db_port=self.vector_db_port
        )
        self.prompt_builder = PromptBuilder(
            self.rag_orchestrator,
            vector_db_port=self.vector_db_port
        )
        self.citation_extractor = CitationExtractor()
        self.document_exporter = DocumentExporter()
        self.line_template_service = LineTemplateService(
            self.rag_orchestrator,
            self.prompt_builder,
            llm_port=self.llm_port,
            vector_db_port=self.vector_db_port,
            metadata_store_port=self.metadata_store_port
        )
        self.draft_crud = DraftCrud(
            self.db,
            self.case_repo,
            self.member_repo,
            self.citation_extractor
        )
        self.async_handler = DraftAsyncHandler(
            self.db,
            self.case_repo,
            self.member_repo,
            DraftService
        )

    def generate_draft_preview(
        self,
        case_id: str,
        request: DraftPreviewRequest,
        user_id: str
    ) -> DraftPreviewResponse:
        """
        Generate draft preview using Fact-Summary + GPT-4o

        Process (016-draft-fact-summary):
        1. Validate case access
        2. Get fact summary context (REQUIRED)
        3. Get legal knowledge and precedents (optional RAG)
        4. Build GPT-4o prompt with fact summary as primary context
        5. Generate draft text
        6. Return with empty citations (no evidence RAG)

        Args:
            case_id: Case ID
            request: Draft generation request (sections, language, style)
            user_id: User ID requesting draft

        Returns:
            Draft preview with citations

        Raises:
            PermissionError: User does not have access (also for non-existent cases)
            ValidationError: No fact summary exists for case
        """
        # 1. Validate case access
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        # 2. Get fact summary context (REQUIRED - 016-draft-fact-summary)
        fact_summary_context = self._get_fact_summary_context(case_id)
        if not fact_summary_context:
            raise ValidationError(
                "사실관계 요약을 먼저 생성해주세요. "
                "[사건 상세] → [사실관계 요약] 탭에서 생성할 수 있습니다."
            )

        # 3. Get legal knowledge (keep RAG for legal references)
        rag_results = self.rag_orchestrator.perform_rag_search(case_id, request.sections)
        legal_results = rag_results.get("legal", [])
        # Skip evidence RAG - use fact summary instead (016-draft-fact-summary)
        evidence_results = []

        # 3.5 Search similar precedents
        precedent_results = self.rag_orchestrator.search_precedents(case_id)

        # 3.6 Search consultation records (Issue #403)
        consultation_results = self.rag_orchestrator.search_case_consultations(case_id)

        # fact_summary_context already retrieved and validated above (016-draft-fact-summary)

        # 4. Check if using Gemini (force text output) or OpenAI (can use JSON)
        use_gemini = settings.USE_GEMINI_FOR_DRAFT and settings.GEMINI_API_KEY

        # 5. Check if template exists for JSON output mode (only for OpenAI)
        if self.vector_db_port:
            template = self.vector_db_port.get_template("이혼소장")
        else:
            template = get_template_by_type("이혼소장")
        use_json_output = template is not None and not use_gemini

        # 6. Build GPT-4o prompt with RAG context + precedents + consultations + fact summary (Issue #403)
        # For Gemini: force_text_output=True to get readable legal document (not JSON)
        prompt_messages = self.prompt_builder.build_draft_prompt(
            case=case,
            sections=request.sections,
            evidence_context=evidence_results,
            legal_context=legal_results,
            precedent_context=precedent_results,
            consultation_context=consultation_results,
            fact_summary_context=fact_summary_context,
            language=request.language,
            style=request.style,
            force_text_output=use_gemini  # Gemini works better with text output
        )

        # 7. Generate draft using injected port if available (legacy fallback for tests)
        if self.llm_port:
            raw_response = self.llm_port.generate_chat_completion(
                messages=prompt_messages,
                temperature=0.3,
                max_tokens=4000
            )
        elif use_gemini:
            logger.info("[DRAFT] Using Gemini 2.0 Flash for draft generation")
            raw_response = generate_chat_completion_gemini(
                messages=prompt_messages,
                model=settings.GEMINI_MODEL_CHAT,
                temperature=0.3,
                max_tokens=4000
            )
        else:
            logger.info("[DRAFT] Using OpenAI GPT-4o-mini for draft generation")
            raw_response = generate_chat_completion(
                messages=prompt_messages,
                model="gpt-4o-mini",
                temperature=0.3,
                max_tokens=4000
            )

        # 8. Process response based on output mode
        if use_json_output:
            renderer = DocumentRenderer()
            json_doc = renderer.parse_json_response(raw_response)

            if json_doc:
                draft_text = renderer.render_to_text(json_doc)
            else:
                draft_text = raw_response
        else:
            draft_text = raw_response

        # 8.5 Clean up any HTML entities that AI might output as text
        # Double protection in case gemini_client doesn't catch all cases
        draft_text = draft_text.replace('&nbsp;', ' ')

        # 9. Extract citations from RAG results
        citations = self.citation_extractor.extract_evidence_citations(evidence_results)

        # 9.5 Extract precedent citations
        precedent_citations = self.citation_extractor.extract_precedent_citations(precedent_results)

        return DraftPreviewResponse(
            case_id=case_id,
            draft_text=draft_text,
            citations=citations,
            precedent_citations=precedent_citations,
            generated_at=datetime.now(timezone.utc)
        )

    def export_draft(
        self,
        case_id: str,
        user_id: str,
        export_format: DraftExportFormat = DraftExportFormat.DOCX
    ) -> Tuple[BytesIO, str, str]:
        """
        Export draft as DOCX or PDF file

        Args:
            case_id: Case ID
            user_id: User ID requesting export
            export_format: Output format (docx or pdf)

        Returns:
            Tuple of (file_bytes, filename, content_type)

        Raises:
            PermissionError: User does not have access
            ValidationError: Export format not supported
        """
        # Validate case access
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        # Generate draft preview
        request = DraftPreviewRequest()
        draft_response = self.generate_draft_preview(case_id, request, user_id)

        # Convert to requested format
        if export_format == DraftExportFormat.DOCX:
            return self.document_exporter.generate_docx(case, draft_response)
        elif export_format == DraftExportFormat.PDF:
            return self.document_exporter.generate_pdf(case, draft_response)
        else:
            raise ValidationError(f"Unsupported export format: {export_format}")

    # ============================================
    # Draft CRUD Operations
    # ============================================

    def list_drafts(self, case_id: str, user_id: str) -> List[DraftListItem]:
        """List all drafts for a case"""
        return self.draft_crud.list_drafts(case_id, user_id)

    def get_draft(self, case_id: str, draft_id: str, user_id: str) -> DraftResponse:
        """Get a specific draft by ID"""
        return self.draft_crud.get_draft(case_id, draft_id, user_id)

    def create_draft(
        self,
        case_id: str,
        draft_data: DraftCreate,
        user_id: str
    ) -> DraftResponse:
        """Create a new draft document"""
        return self.draft_crud.create_draft(case_id, draft_data, user_id)

    def update_draft(
        self,
        case_id: str,
        draft_id: str,
        update_data: DraftUpdate,
        user_id: str
    ) -> DraftResponse:
        """Update an existing draft document"""
        return self.draft_crud.update_draft(case_id, draft_id, update_data, user_id)

    def save_generated_draft(
        self,
        case_id: str,
        draft_response: DraftPreviewResponse,
        user_id: str
    ) -> DraftResponse:
        """Save a generated draft preview to the database"""
        return self.draft_crud.save_generated_draft(case_id, draft_response, user_id)

    # ==========================================================================
    # Line-Based Template Methods (delegated to LineTemplateService)
    # ==========================================================================

    def load_line_based_template(self, template_type: str) -> dict:
        """Load line-based template from Qdrant"""
        return self.line_template_service.load_template(template_type)

    def fill_placeholders(
        self,
        template_lines: List[dict],
        case_data: dict
    ) -> List[dict]:
        """Fill placeholders in template lines with case data"""
        return self.line_template_service.fill_placeholders(template_lines, case_data)

    def filter_conditional_lines(
        self,
        template_lines: List[dict],
        case_conditions: dict
    ) -> List[dict]:
        """Filter template lines based on conditions"""
        return self.line_template_service.filter_conditional_lines(template_lines, case_conditions)

    def fill_ai_generated_content(
        self,
        template_lines: List[dict],
        evidence_context: List[dict],
        case_id: str
    ) -> List[dict]:
        """Generate AI content for placeholders marked as ai_generated"""
        return self.line_template_service.fill_ai_generated_content(
            template_lines, evidence_context, case_id
        )

    def render_lines_to_text(self, lines: List[dict]) -> str:
        """Render line-based JSON to formatted plain text"""
        return self.line_template_service.render_to_text(lines)

    def generate_line_based_draft(
        self,
        case_id: str,
        user_id: str,
        case_data: dict,
        template_type: str = "이혼소장"
    ) -> dict:
        """Generate draft using line-based template"""
        if not self.member_repo.has_access(case_id, user_id):
            raise PermissionError("You do not have access to this case")

        case = self.case_repo.get_by_id(case_id)
        if not case:
            raise NotFoundError("Case")

        return self.line_template_service.generate_draft(
            case_id, case, case_data, template_type
        )

    def generate_docx_from_lines(
        self,
        case,
        lines: List[dict]
    ) -> Tuple[BytesIO, str, str]:
        """Generate DOCX directly from line-based JSON"""
        return self.document_exporter.generate_docx_from_lines(case, lines)

    def generate_pdf_from_lines(
        self,
        case,
        lines: List[dict]
    ) -> Tuple[BytesIO, str, str]:
        """Generate PDF directly from line-based JSON"""
        return self.document_exporter.generate_pdf_from_lines(case, lines)

    def _get_fact_summary_context(self, case_id: str) -> str:
        """
        Get fact summary context for draft generation (014-case-fact-summary T023)

        Retrieves stored fact summary (lawyer-modified version preferred, AI-generated as fallback).
        Returns empty string if no summary exists.

        Args:
            case_id: Case ID

        Returns:
            Fact summary text for context injection, empty string if not available
        """
        try:
            if self.metadata_store_port:
                summary_data = self.metadata_store_port.get_case_fact_summary(case_id)
            else:
                summary_data = get_case_fact_summary(case_id)
            if not summary_data:
                return ""

            # Prefer lawyer-modified summary over AI-generated
            fact_summary = summary_data.get("modified_summary") or summary_data.get("ai_summary", "")
            if not fact_summary:
                return ""

            return f"""[사건 사실관계 요약]
{fact_summary}
---
위 사실관계는 변호사가 검토/수정한 내용입니다. 초안 작성 시 이 사실관계를 우선적으로 참조하세요."""
        except Exception:
            # Silently fail - fact summary is optional context
            return ""

    # ==========================================================================
    # Async Draft Preview Methods (API Gateway 30s timeout 우회)
    # ==========================================================================

    def start_async_draft_preview(
        self,
        case_id: str,
        request: DraftPreviewRequest,
        user_id: str,
        background_tasks: BackgroundTasks
    ) -> DraftJobCreateResponse:
        """
        비동기 초안 생성 시작

        1. Job 레코드 생성 (status: QUEUED)
        2. BackgroundTask로 초안 생성 시작
        3. 즉시 job_id 반환
        """
        return self.async_handler.start_async_draft_preview(
            case_id,
            request,
            user_id,
            background_tasks
        )

    def get_draft_job_status(
        self,
        case_id: str,
        job_id: str,
        user_id: str
    ) -> DraftJobStatusResponse:
        """
        비동기 초안 생성 작업 상태 조회
        """
        return self.async_handler.get_draft_job_status(
            case_id,
            job_id,
            user_id
        )

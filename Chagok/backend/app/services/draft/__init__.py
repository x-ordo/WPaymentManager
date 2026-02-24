"""
Draft Services Package

Modular components for draft generation:
- RAGOrchestrator: RAG search and context formatting
- PromptBuilder: GPT-4o prompt construction
- CitationExtractor: Citation parsing and extraction
- DocumentExporter: DOCX/PDF generation
- LineTemplateService: Line-based template processing

Extracted from DraftService for better modularity (Issue #325)
"""

from app.services.draft.rag_orchestrator import RAGOrchestrator
from app.services.draft.prompt_builder import PromptBuilder
from app.services.draft.citation_extractor import CitationExtractor
from app.services.draft.document_exporter import DocumentExporter
from app.services.draft.line_template_service import LineTemplateService
from app.services.draft.draft_crud import DraftCrud
from app.services.draft.async_handler import DraftAsyncHandler

__all__ = [
    "RAGOrchestrator",
    "PromptBuilder",
    "CitationExtractor",
    "DocumentExporter",
    "LineTemplateService",
    "DraftCrud",
    "DraftAsyncHandler",
]

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class VectorDBPort(ABC):
    """Port interface for vector database operations."""

    @abstractmethod
    def search_evidence(
        self,
        case_id: str,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """Search evidence vectors for a given case."""

    @abstractmethod
    def search_legal_knowledge(
        self,
        query: str,
        top_k: int = 3,
        doc_type: Optional[str] = None
    ) -> List[Dict]:
        """Search legal knowledge vectors."""

    @abstractmethod
    def get_template(self, template_type: str) -> Optional[Dict]:
        """Fetch a legal document template by type."""

    @abstractmethod
    def create_collection(self, case_id: str) -> bool:
        """Create a case-specific collection."""

    @abstractmethod
    def delete_case_collection(self, case_id: str) -> bool:
        """Delete a case-specific collection."""

    @abstractmethod
    def index_consultation_document(self, case_id: str, consultation: Dict) -> str:
        """Index a consultation document for RAG search."""

    @abstractmethod
    def delete_consultation_document(self, case_id: str, consultation_id: str) -> bool:
        """Delete a consultation document from the vector store."""

    @abstractmethod
    def search_consultations(self, case_id: str, query: str = "", top_k: int = 5) -> List[Dict]:
        """Search consultation documents for a case."""

    @abstractmethod
    def get_template_schema(self, template_type: str) -> Optional[str]:
        """Fetch a template schema formatted for prompt usage."""

    @abstractmethod
    def get_template_example(self, template_type: str) -> Optional[str]:
        """Fetch a template example formatted for prompt usage."""

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Return health information for the vector database."""

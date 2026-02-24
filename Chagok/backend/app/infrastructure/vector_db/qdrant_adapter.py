from typing import Any, Callable, Dict, List, Optional

from app.domain.ports.vector_db_port import VectorDBPort
from app.utils.qdrant import (
    search_evidence_by_semantic,
    search_legal_knowledge,
    get_template_by_type,
    create_case_collection,
    delete_case_collection,
    index_consultation_document,
    delete_consultation_document,
    search_consultations,
    get_template_schema_for_prompt,
    get_template_example_for_prompt,
    get_qdrant_client
)


class QdrantAdapter(VectorDBPort):
    """VectorDBPort implementation using Qdrant utilities."""

    def __init__(
        self,
        search_evidence_func: Callable[..., List[Dict]] = search_evidence_by_semantic,
        search_legal_func: Callable[..., List[Dict]] = search_legal_knowledge,
        get_template_func: Callable[..., Optional[Dict]] = get_template_by_type,
        create_collection_func: Callable[..., bool] = create_case_collection,
        delete_collection_func: Callable[..., bool] = delete_case_collection,
        index_consultation_func: Callable[..., str] = index_consultation_document,
        delete_consultation_func: Callable[..., bool] = delete_consultation_document,
        search_consultations_func: Callable[..., List[Dict]] = search_consultations,
        get_template_schema_func: Callable[..., Optional[str]] = get_template_schema_for_prompt,
        get_template_example_func: Callable[..., Optional[str]] = get_template_example_for_prompt,
        health_check_func: Optional[Callable[[], Dict[str, Any]]] = None
    ) -> None:
        self._search_evidence = search_evidence_func
        self._search_legal = search_legal_func
        self._get_template = get_template_func
        self._create_collection = create_collection_func
        self._delete_collection = delete_collection_func
        self._index_consultation = index_consultation_func
        self._delete_consultation = delete_consultation_func
        self._search_consultations = search_consultations_func
        self._get_template_schema = get_template_schema_func
        self._get_template_example = get_template_example_func
        self._health_check = health_check_func or self._default_health_check

    def search_evidence(
        self,
        case_id: str,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        return self._search_evidence(
            case_id=case_id,
            query=query,
            top_k=top_k,
            filters=filters
        )

    def search_legal_knowledge(
        self,
        query: str,
        top_k: int = 3,
        doc_type: Optional[str] = None
    ) -> List[Dict]:
        return self._search_legal(
            query=query,
            top_k=top_k,
            doc_type=doc_type
        )

    def get_template(self, template_type: str) -> Optional[Dict]:
        return self._get_template(template_type)

    def create_collection(self, case_id: str) -> bool:
        return self._create_collection(case_id)

    def delete_case_collection(self, case_id: str) -> bool:
        return self._delete_collection(case_id)

    def index_consultation_document(self, case_id: str, consultation: Dict) -> str:
        return self._index_consultation(case_id, consultation)

    def delete_consultation_document(self, case_id: str, consultation_id: str) -> bool:
        return self._delete_consultation(case_id, consultation_id)

    def search_consultations(
        self,
        case_id: str,
        query: str = "",
        top_k: int = 5
    ) -> List[Dict]:
        return self._search_consultations(case_id=case_id, query=query, top_k=top_k)

    def get_template_schema(self, template_type: str) -> Optional[str]:
        return self._get_template_schema(template_type)

    def get_template_example(self, template_type: str) -> Optional[str]:
        return self._get_template_example(template_type)

    def health_check(self) -> Dict[str, Any]:
        return self._health_check()

    def _default_health_check(self) -> Dict[str, Any]:
        try:
            client = get_qdrant_client()
            collections = client.get_collections()
            return {
                "status": "ok",
                "collections_count": len(collections.collections)
            }
        except Exception as exc:
            return {
                "status": "error",
                "error": str(exc)
            }

"""
Unit tests for Qdrant utilities (app/utils/qdrant.py)
"""

import pytest
from unittest.mock import patch, MagicMock

from app.utils.qdrant import (
    _get_collection_name,
    _get_qdrant_client,
    search_evidence_by_semantic,
    index_evidence_document,
    create_case_collection,
    delete_case_collection,
    get_all_documents_in_case,
    search_legal_knowledge,
    get_template_by_type,
    get_template_schema_for_prompt,
    get_template_example_for_prompt,
    index_consultation_document,
    delete_consultation_document,
    search_consultations,
    delete_case_index,
    create_case_index,
    get_qdrant_client,
    LEGAL_KNOWLEDGE_COLLECTION,
    TEMPLATE_COLLECTION,
)
import app.utils.qdrant as qdrant_module


class TestGetQdrantClientInitialization:
    """Tests for _get_qdrant_client function initialization branches"""

    @pytest.fixture(autouse=True)
    def reset_singleton(self):
        """Reset the singleton client before each test"""
        qdrant_module._qdrant_client = None
        yield
        qdrant_module._qdrant_client = None

    @patch('app.utils.qdrant.QdrantClient')
    @patch('app.utils.qdrant.settings')
    def test_uses_qdrant_url_when_available(self, mock_settings, mock_qdrant_class):
        """Should use QDRANT_URL when set"""
        mock_settings.QDRANT_URL = "https://qdrant.example.com"
        mock_settings.QDRANT_API_KEY = "test_api_key"
        mock_settings.QDRANT_HOST = None
        mock_client = MagicMock()
        mock_qdrant_class.return_value = mock_client

        result = _get_qdrant_client()

        mock_qdrant_class.assert_called_once_with(
            url="https://qdrant.example.com",
            api_key="test_api_key",
        )
        assert result == mock_client

    @patch('app.utils.qdrant.QdrantClient')
    @patch('app.utils.qdrant.settings')
    def test_uses_qdrant_url_with_no_api_key(self, mock_settings, mock_qdrant_class):
        """Should use QDRANT_URL with None api_key when not set"""
        mock_settings.QDRANT_URL = "https://qdrant.example.com"
        mock_settings.QDRANT_API_KEY = None
        mock_settings.QDRANT_HOST = None
        mock_client = MagicMock()
        mock_qdrant_class.return_value = mock_client

        result = _get_qdrant_client()

        mock_qdrant_class.assert_called_once_with(
            url="https://qdrant.example.com",
            api_key=None,
        )

    @patch('app.utils.qdrant.QdrantClient')
    @patch('app.utils.qdrant.settings')
    def test_uses_host_with_http_protocol(self, mock_settings, mock_qdrant_class):
        """Should use url parameter when QDRANT_HOST has http:// protocol"""
        mock_settings.QDRANT_URL = None
        mock_settings.QDRANT_HOST = "http://localhost:6333"
        mock_settings.QDRANT_API_KEY = "test_key"
        mock_settings.QDRANT_PORT = 6333
        mock_settings.QDRANT_USE_HTTPS = False
        mock_client = MagicMock()
        mock_qdrant_class.return_value = mock_client

        result = _get_qdrant_client()

        mock_qdrant_class.assert_called_once_with(
            url="http://localhost:6333",
            api_key="test_key",
        )

    @patch('app.utils.qdrant.QdrantClient')
    @patch('app.utils.qdrant.settings')
    def test_uses_host_with_https_protocol(self, mock_settings, mock_qdrant_class):
        """Should use url parameter when QDRANT_HOST has https:// protocol"""
        mock_settings.QDRANT_URL = None
        mock_settings.QDRANT_HOST = "https://qdrant.cloud.example.com"
        mock_settings.QDRANT_API_KEY = "cloud_key"
        mock_settings.QDRANT_PORT = 6333
        mock_settings.QDRANT_USE_HTTPS = True
        mock_client = MagicMock()
        mock_qdrant_class.return_value = mock_client

        result = _get_qdrant_client()

        mock_qdrant_class.assert_called_once_with(
            url="https://qdrant.cloud.example.com",
            api_key="cloud_key",
        )

    @patch('app.utils.qdrant.QdrantClient')
    @patch('app.utils.qdrant.settings')
    def test_uses_host_port_when_no_protocol(self, mock_settings, mock_qdrant_class):
        """Should use host/port parameters when QDRANT_HOST has no protocol"""
        mock_settings.QDRANT_URL = None
        mock_settings.QDRANT_HOST = "localhost"
        mock_settings.QDRANT_PORT = 6333
        mock_settings.QDRANT_API_KEY = "test_key"
        mock_settings.QDRANT_USE_HTTPS = False
        mock_client = MagicMock()
        mock_qdrant_class.return_value = mock_client

        result = _get_qdrant_client()

        mock_qdrant_class.assert_called_once_with(
            host="localhost",
            port=6333,
            api_key="test_key",
            https=False,
        )

    @patch('app.utils.qdrant.QdrantClient')
    @patch('app.utils.qdrant.settings')
    def test_uses_host_port_with_https(self, mock_settings, mock_qdrant_class):
        """Should pass https=True when configured"""
        mock_settings.QDRANT_URL = None
        mock_settings.QDRANT_HOST = "qdrant-server"
        mock_settings.QDRANT_PORT = 6334
        mock_settings.QDRANT_API_KEY = None
        mock_settings.QDRANT_USE_HTTPS = True
        mock_client = MagicMock()
        mock_qdrant_class.return_value = mock_client

        result = _get_qdrant_client()

        mock_qdrant_class.assert_called_once_with(
            host="qdrant-server",
            port=6334,
            api_key=None,
            https=True,
        )

    @patch('app.utils.qdrant.QdrantClient')
    @patch('app.utils.qdrant.settings')
    def test_uses_in_memory_when_no_config(self, mock_settings, mock_qdrant_class):
        """Should use in-memory Qdrant when no host/url configured"""
        mock_settings.QDRANT_URL = None
        mock_settings.QDRANT_HOST = None
        mock_client = MagicMock()
        mock_qdrant_class.return_value = mock_client

        result = _get_qdrant_client()

        mock_qdrant_class.assert_called_once_with(":memory:")

    @patch('app.utils.qdrant.QdrantClient')
    @patch('app.utils.qdrant.settings')
    def test_singleton_returns_cached_client(self, mock_settings, mock_qdrant_class):
        """Should return cached client on subsequent calls"""
        mock_settings.QDRANT_URL = None
        mock_settings.QDRANT_HOST = None
        mock_client = MagicMock()
        mock_qdrant_class.return_value = mock_client

        result1 = _get_qdrant_client()
        result2 = _get_qdrant_client()

        assert result1 is result2
        assert mock_qdrant_class.call_count == 1  # Only called once


class TestGetCollectionName:
    """Tests for _get_collection_name function"""

    def test_returns_prefixed_name(self):
        """Should return collection name with prefix"""
        result = _get_collection_name("case_123")
        assert "case_123" in result
        assert result.startswith("case_rag_") or "case_rag" in result


class TestSearchEvidenceBySemantic:
    """Tests for search_evidence_by_semantic function"""

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_empty_when_collection_not_exists(self, mock_get_client, mock_embedding):
        """Should return empty list when collection doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client

        result = search_evidence_by_semantic("case_001", "search query")

        assert result == []
        mock_embedding.assert_not_called()

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_evidence_on_success(self, mock_get_client, mock_embedding):
        """Should return evidence documents from search"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]

        mock_hit = MagicMock()
        mock_hit.payload = {"evidence_id": "ev_001", "content": "Test content"}
        mock_hit.score = 0.85
        mock_client.query_points.return_value.points = [mock_hit]

        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        result = search_evidence_by_semantic("case_001", "search query")

        assert len(result) == 1
        assert result[0]["evidence_id"] == "ev_001"
        assert result[0]["_score"] == 0.85

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_applies_filters(self, mock_get_client, mock_embedding):
        """Should apply filters to search"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.query_points.return_value.points = []
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        search_evidence_by_semantic(
            "case_001",
            "search query",
            filters={"labels": ["폭언", "협박"]}
        )

        call_args = mock_client.query_points.call_args
        assert call_args[1]["query_filter"] is not None

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_applies_single_value_filter(self, mock_get_client, mock_embedding):
        """Should apply single value filter"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.query_points.return_value.points = []
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        search_evidence_by_semantic(
            "case_001",
            "search query",
            filters={"speaker": "원고"}
        )

        call_args = mock_client.query_points.call_args
        assert call_args[1]["query_filter"] is not None

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_empty_on_error(self, mock_get_client, mock_embedding):
        """Should return empty list on error"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.query_points.side_effect = Exception("Search error")
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        result = search_evidence_by_semantic("case_001", "search query")

        assert result == []


class TestIndexEvidenceDocument:
    """Tests for index_evidence_document function"""

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_indexes_document_with_vector(self, mock_get_client, mock_embedding):
        """Should index document with provided vector"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client

        doc = {"id": "ev_001", "content": "Test", "vector": [0.1] * 1536}
        result = index_evidence_document("case_001", doc)

        assert result == "ev_001"
        mock_client.upsert.assert_called_once()
        mock_embedding.assert_not_called()

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_generates_embedding_when_no_vector(self, mock_get_client, mock_embedding):
        """Should generate embedding when no vector provided"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        doc = {"id": "ev_001", "content": "Test content"}
        result = index_evidence_document("case_001", doc)

        assert result == "ev_001"
        mock_embedding.assert_called_once_with("Test content")

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant.create_case_collection')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_creates_collection_if_not_exists(self, mock_get_client, mock_create, mock_embedding):
        """Should create collection if it doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        doc = {"id": "ev_001", "content": "Test"}
        index_evidence_document("case_001", doc)

        mock_create.assert_called_once_with("case_001")

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_raises_without_id(self, mock_get_client):
        """Should raise ValueError when no id"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client

        with pytest.raises(ValueError) as exc_info:
            index_evidence_document("case_001", {"content": "Test"})

        assert "id" in str(exc_info.value)

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_raises_without_vector_or_content(self, mock_get_client):
        """Should raise ValueError when no vector or content"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client

        with pytest.raises(ValueError) as exc_info:
            index_evidence_document("case_001", {"id": "ev_001"})

        assert "vector" in str(exc_info.value) or "content" in str(exc_info.value)

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_uses_evidence_id_field(self, mock_get_client, mock_embedding):
        """Should use evidence_id field as document id"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        doc = {"evidence_id": "ev_002", "content": "Test"}
        result = index_evidence_document("case_001", doc)

        assert result == "ev_002"

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_raises_on_error(self, mock_get_client, mock_embedding):
        """Should raise exception on error"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.upsert.side_effect = Exception("Upsert error")
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        with pytest.raises(Exception):
            index_evidence_document("case_001", {"id": "ev_001", "content": "Test"})


class TestCreateCaseCollection:
    """Tests for create_case_collection function"""

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_creates_collection(self, mock_get_client):
        """Should create collection successfully"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client

        result = create_case_collection("case_001")

        assert result is True
        mock_client.create_collection.assert_called_once()

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_true_when_exists(self, mock_get_client):
        """Should return True when collection already exists"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client

        result = create_case_collection("case_001")

        assert result is True
        mock_client.create_collection.assert_not_called()

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_raises_on_error(self, mock_get_client):
        """Should raise exception on error"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_client.create_collection.side_effect = Exception("Create error")
        mock_get_client.return_value = mock_client

        with pytest.raises(Exception):
            create_case_collection("case_001")


class TestDeleteCaseCollection:
    """Tests for delete_case_collection function"""

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_deletes_collection(self, mock_get_client):
        """Should delete collection successfully"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client

        result = delete_case_collection("case_001")

        assert result is True
        mock_client.delete_collection.assert_called_once()

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_false_when_not_exists(self, mock_get_client):
        """Should return False when collection doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client

        result = delete_case_collection("case_999")

        assert result is False
        mock_client.delete_collection.assert_not_called()

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_false_on_error(self, mock_get_client):
        """Should return False on error"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.delete_collection.side_effect = Exception("Delete error")
        mock_get_client.return_value = mock_client

        result = delete_case_collection("case_001")

        assert result is False


class TestGetAllDocumentsInCase:
    """Tests for get_all_documents_in_case function"""

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_documents(self, mock_get_client):
        """Should return all documents in collection"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]

        mock_point1 = MagicMock()
        mock_point1.payload = {"id": "doc_001"}
        mock_point2 = MagicMock()
        mock_point2.payload = {"id": "doc_002"}
        mock_client.scroll.return_value = ([mock_point1, mock_point2], None)
        mock_get_client.return_value = mock_client

        result = get_all_documents_in_case("case_001")

        assert len(result) == 2

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_empty_when_collection_not_exists(self, mock_get_client):
        """Should return empty list when collection doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client

        result = get_all_documents_in_case("case_999")

        assert result == []

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_empty_on_error(self, mock_get_client):
        """Should return empty list on error"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.scroll.side_effect = Exception("Scroll error")
        mock_get_client.return_value = mock_client

        result = get_all_documents_in_case("case_001")

        assert result == []


class TestSearchLegalKnowledge:
    """Tests for search_legal_knowledge function"""

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_legal_documents(self, mock_get_client, mock_embedding):
        """Should return legal documents from search"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = LEGAL_KNOWLEDGE_COLLECTION
        mock_client.get_collections.return_value.collections = [mock_collection]

        mock_hit = MagicMock()
        mock_hit.payload = {"title": "민법 제840조", "content": "이혼 사유"}
        mock_hit.score = 0.9
        mock_client.query_points.return_value.points = [mock_hit]

        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        result = search_legal_knowledge("이혼 사유")

        assert len(result) == 1
        assert result[0]["title"] == "민법 제840조"
        assert result[0]["_score"] == 0.9

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_applies_doc_type_filter(self, mock_get_client, mock_embedding):
        """Should apply doc_type filter"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = LEGAL_KNOWLEDGE_COLLECTION
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.query_points.return_value.points = []
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        search_legal_knowledge("이혼", doc_type="statute")

        call_args = mock_client.query_points.call_args
        assert call_args[1]["query_filter"] is not None

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_empty_when_collection_not_exists(self, mock_get_client):
        """Should return empty list when collection doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client

        result = search_legal_knowledge("test query")

        assert result == []

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_empty_on_error(self, mock_get_client, mock_embedding):
        """Should return empty list on error"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = LEGAL_KNOWLEDGE_COLLECTION
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.query_points.side_effect = Exception("Search error")
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        result = search_legal_knowledge("test query")

        assert result == []


class TestGetTemplateByType:
    """Tests for get_template_by_type function"""

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_template(self, mock_get_client):
        """Should return template when found"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = TEMPLATE_COLLECTION
        mock_client.get_collections.return_value.collections = [mock_collection]

        mock_point = MagicMock()
        mock_point.id = "template_001"
        mock_point.payload = {
            "template_type": "이혼소장",
            "version": "1.0",
            "description": "이혼 소장 템플릿",
            "schema": {"type": "object"},
            "example": {"title": "Example"},
            "applicable_cases": ["이혼"]
        }
        mock_client.scroll.return_value = ([mock_point], None)
        mock_get_client.return_value = mock_client

        result = get_template_by_type("이혼소장")

        assert result["template_type"] == "이혼소장"
        assert result["schema"] == {"type": "object"}

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_none_when_not_found(self, mock_get_client):
        """Should return None when template not found"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = TEMPLATE_COLLECTION
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.scroll.return_value = ([], None)
        mock_get_client.return_value = mock_client

        result = get_template_by_type("없는템플릿")

        assert result is None

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_none_when_collection_not_exists(self, mock_get_client):
        """Should return None when collection doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client

        result = get_template_by_type("이혼소장")

        assert result is None

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_none_on_error(self, mock_get_client):
        """Should return None on error"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = TEMPLATE_COLLECTION
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.scroll.side_effect = Exception("Scroll error")
        mock_get_client.return_value = mock_client

        result = get_template_by_type("이혼소장")

        assert result is None


class TestGetTemplateSchemaForPrompt:
    """Tests for get_template_schema_for_prompt function"""

    @patch('app.utils.qdrant.get_template_by_type')
    def test_returns_json_schema(self, mock_get_template):
        """Should return JSON schema string"""
        mock_get_template.return_value = {
            "template_type": "이혼소장",
            "schema": {"type": "object", "properties": {}}
        }

        result = get_template_schema_for_prompt("이혼소장")

        assert result is not None
        assert "type" in result
        assert "object" in result

    @patch('app.utils.qdrant.get_template_by_type')
    def test_returns_none_when_no_template(self, mock_get_template):
        """Should return None when template not found"""
        mock_get_template.return_value = None

        result = get_template_schema_for_prompt("없는템플릿")

        assert result is None

    @patch('app.utils.qdrant.get_template_by_type')
    def test_returns_none_when_no_schema(self, mock_get_template):
        """Should return None when template has no schema"""
        mock_get_template.return_value = {"template_type": "이혼소장"}

        result = get_template_schema_for_prompt("이혼소장")

        assert result is None


class TestGetTemplateExampleForPrompt:
    """Tests for get_template_example_for_prompt function"""

    @patch('app.utils.qdrant.get_template_by_type')
    def test_returns_json_example(self, mock_get_template):
        """Should return JSON example string"""
        mock_get_template.return_value = {
            "template_type": "이혼소장",
            "example": {"title": "이혼 소장", "content": "본문"}
        }

        result = get_template_example_for_prompt("이혼소장")

        assert result is not None
        assert "title" in result

    @patch('app.utils.qdrant.get_template_by_type')
    def test_returns_none_when_no_template(self, mock_get_template):
        """Should return None when template not found"""
        mock_get_template.return_value = None

        result = get_template_example_for_prompt("없는템플릿")

        assert result is None

    @patch('app.utils.qdrant.get_template_by_type')
    def test_returns_none_when_no_example(self, mock_get_template):
        """Should return None when template has no example"""
        mock_get_template.return_value = {"template_type": "이혼소장"}

        result = get_template_example_for_prompt("이혼소장")

        assert result is None


class TestIndexConsultationDocument:
    """Tests for index_consultation_document function"""

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_indexes_consultation(self, mock_get_client, mock_embedding):
        """Should index consultation document"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        consultation = {
            "id": "consult_001",
            "summary": "Test consultation",
            "notes": "Additional notes",
            "date": "2024-01-15",
            "type": "초기 상담",
            "participants": ["의뢰인", "변호사"]
        }
        result = index_consultation_document("case_001", consultation)

        assert result == "consult_001"
        mock_client.upsert.assert_called_once()

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant.create_case_collection')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_creates_collection_if_not_exists(self, mock_get_client, mock_create, mock_embedding):
        """Should create collection if doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        consultation = {"id": "consult_001", "summary": "Test"}
        index_consultation_document("case_001", consultation)

        mock_create.assert_called_once_with("case_001")

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_raises_without_id(self, mock_get_client):
        """Should raise ValueError when no id"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client

        with pytest.raises(ValueError) as exc_info:
            index_consultation_document("case_001", {"summary": "Test"})

        assert "id" in str(exc_info.value)

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_handles_minimal_consultation(self, mock_get_client, mock_embedding):
        """Should handle consultation with minimal fields"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        consultation = {"id": "consult_001"}
        result = index_consultation_document("case_001", consultation)

        assert result == "consult_001"

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_raises_on_error(self, mock_get_client, mock_embedding):
        """Should raise exception on error"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.upsert.side_effect = Exception("Upsert error")
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        with pytest.raises(Exception):
            index_consultation_document("case_001", {"id": "consult_001", "summary": "Test"})


class TestDeleteConsultationDocument:
    """Tests for delete_consultation_document function"""

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_deletes_consultation(self, mock_get_client):
        """Should delete consultation document"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client

        result = delete_consultation_document("case_001", "consult_001")

        assert result is True
        mock_client.delete.assert_called_once()

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_false_when_collection_not_exists(self, mock_get_client):
        """Should return False when collection doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client

        result = delete_consultation_document("case_999", "consult_001")

        assert result is False

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_false_on_error(self, mock_get_client):
        """Should return False on error"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.delete.side_effect = Exception("Delete error")
        mock_get_client.return_value = mock_client

        result = delete_consultation_document("case_001", "consult_001")

        assert result is False


class TestSearchConsultations:
    """Tests for search_consultations function"""

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_searches_with_query(self, mock_get_client, mock_embedding):
        """Should search consultations with semantic query"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]

        mock_hit = MagicMock()
        mock_hit.payload = {"consultation_id": "consult_001", "summary": "Test"}
        mock_hit.score = 0.8
        mock_client.query_points.return_value.points = [mock_hit]

        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        result = search_consultations("case_001", "상담 내용")

        assert len(result) == 1
        assert result[0]["consultation_id"] == "consult_001"
        mock_embedding.assert_called_once()

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_scrolls_without_query(self, mock_get_client):
        """Should scroll all consultations when no query"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]

        mock_point = MagicMock()
        mock_point.payload = {"consultation_id": "consult_001"}
        mock_client.scroll.return_value = ([mock_point], None)

        mock_get_client.return_value = mock_client

        result = search_consultations("case_001", "")

        assert len(result) == 1
        mock_client.scroll.assert_called_once()

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_empty_when_collection_not_exists(self, mock_get_client):
        """Should return empty list when collection doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client

        result = search_consultations("case_999", "test")

        assert result == []

    @patch('app.utils.qdrant.generate_embedding')
    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_empty_on_error(self, mock_get_client, mock_embedding):
        """Should return empty list on error"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "case_rag_case_001"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.query_points.side_effect = Exception("Search error")
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        result = search_consultations("case_001", "test query")

        assert result == []


class TestBackwardCompatibilityAliases:
    """Tests for backward compatibility aliases"""

    @patch('app.utils.qdrant.delete_case_collection')
    def test_delete_case_index_calls_delete_collection(self, mock_delete):
        """delete_case_index should call delete_case_collection"""
        mock_delete.return_value = True

        result = delete_case_index("case_001")

        assert result is True
        mock_delete.assert_called_once_with("case_001")

    @patch('app.utils.qdrant.create_case_collection')
    def test_create_case_index_calls_create_collection(self, mock_create):
        """create_case_index should call create_case_collection"""
        mock_create.return_value = True

        result = create_case_index("case_001")

        assert result is True
        mock_create.assert_called_once_with("case_001")


class TestGetQdrantClient:
    """Tests for get_qdrant_client function"""

    @patch('app.utils.qdrant._get_qdrant_client')
    def test_returns_client(self, mock_internal_get):
        """Should return Qdrant client"""
        mock_client = MagicMock()
        mock_internal_get.return_value = mock_client

        result = get_qdrant_client()

        assert result == mock_client
        mock_internal_get.assert_called_once()

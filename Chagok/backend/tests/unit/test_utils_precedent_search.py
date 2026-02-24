"""
Unit tests for Precedent Search utilities (app/utils/precedent_search.py)
012-precedent-integration
"""

import pytest
from unittest.mock import patch, MagicMock

from app.utils.precedent_search import (
    create_legal_knowledge_collection,
    search_similar_precedents,
    get_fallback_precedents,
)


class TestGetFallbackPrecedents:
    """Tests for get_fallback_precedents function"""

    def test_returns_default_three_when_no_fault_types(self):
        """Should return top 3 precedents when fault_types is None"""
        result = get_fallback_precedents(None)

        assert len(result) == 3
        # Should be sorted by similarity score
        assert all("case_ref" in p for p in result)
        assert all("summary" in p for p in result)

    def test_returns_default_three_when_empty_fault_types(self):
        """Should return top 3 precedents when fault_types is empty list"""
        result = get_fallback_precedents([])

        assert len(result) == 3

    def test_matches_부정행위_fault_type(self):
        """Should return precedents matching 부정행위 fault type"""
        result = get_fallback_precedents(["부정행위"])

        assert len(result) > 0
        # All results should contain 부정행위 in key_factors
        for p in result:
            assert any("부정행위" in kf for kf in p["key_factors"])

    def test_matches_가정폭력_fault_type(self):
        """Should return precedents matching 가정폭력 fault type"""
        result = get_fallback_precedents(["가정폭력"])

        assert len(result) > 0
        for p in result:
            assert any("가정폭력" in kf or "폭력" in kf for kf in p["key_factors"])

    def test_matches_multiple_fault_types(self):
        """Should return precedents matching any of multiple fault types"""
        result = get_fallback_precedents(["부정행위", "가정폭력"])

        assert len(result) > 0
        # Results should include matches for either fault type
        fault_categories = set()
        for p in result:
            for kf in p["key_factors"]:
                if "부정행위" in kf:
                    fault_categories.add("부정행위")
                if "가정폭력" in kf or "폭력" in kf:
                    fault_categories.add("가정폭력")
        assert len(fault_categories) >= 1

    def test_sorted_by_similarity_score(self):
        """Should return results sorted by similarity score descending"""
        result = get_fallback_precedents(["부정행위", "가정폭력"])

        scores = [p["similarity_score"] for p in result]
        assert scores == sorted(scores, reverse=True)

    def test_max_five_results(self):
        """Should return at most 5 matching precedents"""
        # 부정행위 and 가정폭력 together should have many matches
        result = get_fallback_precedents(["부정행위", "가정폭력", "악의의 유기"])

        assert len(result) <= 5

    def test_returns_default_for_unknown_fault_type(self):
        """Should return default 3 when fault type doesn't match any"""
        result = get_fallback_precedents(["알수없는유형"])

        assert len(result) == 3

    def test_precedent_structure(self):
        """Should return precedents with correct structure"""
        result = get_fallback_precedents(["부정행위"])

        for p in result:
            assert "case_ref" in p
            assert "court" in p
            assert "decision_date" in p
            assert "summary" in p
            assert "division_ratio" in p
            assert "key_factors" in p
            assert "similarity_score" in p

    def test_division_ratio_structure(self):
        """Should have proper division_ratio structure"""
        result = get_fallback_precedents(["부정행위"])

        for p in result:
            if p["division_ratio"]:
                assert "plaintiff" in p["division_ratio"]
                assert "defendant" in p["division_ratio"]


class TestCreateLegalKnowledgeCollection:
    """Tests for create_legal_knowledge_collection function"""

    @patch('app.utils.precedent_search._get_qdrant_client')
    def test_returns_true_when_collection_exists(self, mock_get_client):
        """Should return True if collection already exists"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "leh_legal_knowledge"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_get_client.return_value = mock_client

        result = create_legal_knowledge_collection()

        assert result is True
        mock_client.create_collection.assert_not_called()

    @patch('app.utils.precedent_search._get_qdrant_client')
    def test_creates_collection_when_not_exists(self, mock_get_client):
        """Should create collection when it doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client

        result = create_legal_knowledge_collection()

        assert result is True
        mock_client.create_collection.assert_called_once()

    @patch('app.utils.precedent_search._get_qdrant_client')
    def test_returns_false_on_error(self, mock_get_client):
        """Should return False on error"""
        mock_client = MagicMock()
        mock_client.get_collections.side_effect = Exception("Connection error")
        mock_get_client.return_value = mock_client

        result = create_legal_knowledge_collection()

        assert result is False


class TestSearchSimilarPrecedents:
    """Tests for search_similar_precedents function"""

    @patch('app.utils.precedent_search.generate_embedding')
    @patch('app.utils.precedent_search._get_qdrant_client')
    def test_returns_empty_when_collection_not_exists(self, mock_get_client, mock_embedding):
        """Should return empty list when collection doesn't exist"""
        mock_client = MagicMock()
        mock_client.get_collections.return_value.collections = []
        mock_get_client.return_value = mock_client

        result = search_similar_precedents("test query")

        assert result == []
        mock_embedding.assert_not_called()

    @patch('app.utils.precedent_search.generate_embedding')
    @patch('app.utils.precedent_search._get_qdrant_client')
    def test_returns_precedents_on_success(self, mock_get_client, mock_embedding):
        """Should return precedents from Qdrant search"""
        # Setup mock client
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "leh_legal_knowledge"
        mock_client.get_collections.return_value.collections = [mock_collection]

        # Setup mock search result
        mock_hit = MagicMock()
        mock_hit.payload = {
            "case_number": "2020므12345",
            "court": "서울가정법원",
            "decision_date": "2020-05-15",
            "summary": "Test summary",
            "division_ratio": {"plaintiff": 60, "defendant": 40},
            "key_factors": ["부정행위"]
        }
        mock_hit.score = 0.85

        mock_points = MagicMock()
        mock_points.points = [mock_hit]
        mock_client.query_points.return_value = mock_points

        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        result = search_similar_precedents("부정행위로 인한 이혼")

        assert len(result) == 1
        assert result[0]["case_ref"] == "2020므12345"
        assert result[0]["similarity_score"] == 0.85

    @patch('app.utils.precedent_search.generate_embedding')
    @patch('app.utils.precedent_search._get_qdrant_client')
    def test_returns_empty_on_error(self, mock_get_client, mock_embedding):
        """Should return empty list on error"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "leh_legal_knowledge"
        mock_client.get_collections.return_value.collections = [mock_collection]
        mock_client.query_points.side_effect = Exception("Search error")
        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        result = search_similar_precedents("test query")

        assert result == []

    @patch('app.utils.precedent_search.generate_embedding')
    @patch('app.utils.precedent_search._get_qdrant_client')
    def test_handles_missing_payload_fields(self, mock_get_client, mock_embedding):
        """Should handle missing payload fields gracefully"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "leh_legal_knowledge"
        mock_client.get_collections.return_value.collections = [mock_collection]

        # Minimal payload with missing fields
        mock_hit = MagicMock()
        mock_hit.payload = {"document": "Content from document field"}
        mock_hit.score = 0.7

        mock_points = MagicMock()
        mock_points.points = [mock_hit]
        mock_client.query_points.return_value = mock_points

        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        result = search_similar_precedents("test query")

        assert len(result) == 1
        # Should use document field as summary fallback
        assert result[0]["summary"] == "Content from document field"
        assert result[0]["case_ref"] == ""  # Default empty string

    @patch('app.utils.precedent_search.generate_embedding')
    @patch('app.utils.precedent_search._get_qdrant_client')
    def test_respects_limit_parameter(self, mock_get_client, mock_embedding):
        """Should pass limit parameter to Qdrant"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "leh_legal_knowledge"
        mock_client.get_collections.return_value.collections = [mock_collection]

        mock_points = MagicMock()
        mock_points.points = []
        mock_client.query_points.return_value = mock_points

        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        search_similar_precedents("test query", limit=5)

        call_kwargs = mock_client.query_points.call_args[1]
        assert call_kwargs["limit"] == 5

    @patch('app.utils.precedent_search.generate_embedding')
    @patch('app.utils.precedent_search._get_qdrant_client')
    def test_respects_min_score_parameter(self, mock_get_client, mock_embedding):
        """Should pass min_score as score_threshold to Qdrant"""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.name = "leh_legal_knowledge"
        mock_client.get_collections.return_value.collections = [mock_collection]

        mock_points = MagicMock()
        mock_points.points = []
        mock_client.query_points.return_value = mock_points

        mock_get_client.return_value = mock_client
        mock_embedding.return_value = [0.1] * 1536

        search_similar_precedents("test query", min_score=0.7)

        call_kwargs = mock_client.query_points.call_args[1]
        assert call_kwargs["score_threshold"] == 0.7

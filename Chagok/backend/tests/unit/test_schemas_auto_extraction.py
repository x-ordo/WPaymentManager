"""
Unit tests for Auto-Extraction schemas (app/schemas/auto_extraction.py)
012-precedent-integration: T009-T010
"""

import pytest
from pydantic import ValidationError

from app.schemas.auto_extraction import (
    AutoExtractedPartyRequest,
    AutoExtractedPartyResponse,
    AutoExtractedRelationshipRequest,
    AutoExtractedRelationshipResponse,
)
from app.schemas.party import PartyType, RelationshipType


class TestAutoExtractedPartyRequest:
    """Tests for AutoExtractedPartyRequest schema"""

    def test_valid_party_request(self):
        """Should create valid party request"""
        request = AutoExtractedPartyRequest(
            name="김철수",
            type=PartyType.PLAINTIFF,
            extraction_confidence=0.95,
            source_evidence_id="ev_001"
        )
        assert request.name == "김철수"
        assert request.type == PartyType.PLAINTIFF
        assert request.extraction_confidence == 0.95
        assert request.source_evidence_id == "ev_001"

    def test_confidence_range(self):
        """Should validate confidence range [0, 1]"""
        # Valid min
        req = AutoExtractedPartyRequest(
            name="테스트",
            type=PartyType.DEFENDANT,
            extraction_confidence=0.0,
            source_evidence_id="ev_001"
        )
        assert req.extraction_confidence == 0.0

        # Valid max
        req = AutoExtractedPartyRequest(
            name="테스트",
            type=PartyType.DEFENDANT,
            extraction_confidence=1.0,
            source_evidence_id="ev_001"
        )
        assert req.extraction_confidence == 1.0

        # Invalid - over 1
        with pytest.raises(ValidationError):
            AutoExtractedPartyRequest(
                name="테스트",
                type=PartyType.DEFENDANT,
                extraction_confidence=1.5,
                source_evidence_id="ev_001"
            )

        # Invalid - negative
        with pytest.raises(ValidationError):
            AutoExtractedPartyRequest(
                name="테스트",
                type=PartyType.DEFENDANT,
                extraction_confidence=-0.1,
                source_evidence_id="ev_001"
            )

    def test_name_required(self):
        """Should require name field"""
        with pytest.raises(ValidationError):
            AutoExtractedPartyRequest(
                type=PartyType.PLAINTIFF,
                extraction_confidence=0.9,
                source_evidence_id="ev_001"
            )


class TestAutoExtractedPartyResponse:
    """Tests for AutoExtractedPartyResponse schema"""

    def test_empty_response(self):
        """Should create empty response"""
        response = AutoExtractedPartyResponse()
        assert response.created == []
        assert response.duplicates == []

    def test_response_with_data(self):
        """Should create response with data"""
        response = AutoExtractedPartyResponse(
            created=[],
            duplicates=[{"name": "김철수", "reason": "already_exists"}]
        )
        assert len(response.duplicates) == 1
        assert response.duplicates[0]["name"] == "김철수"


class TestAutoExtractedRelationshipRequest:
    """Tests for AutoExtractedRelationshipRequest schema"""

    def test_valid_relationship_request(self):
        """Should create valid relationship request"""
        request = AutoExtractedRelationshipRequest(
            source_party_name="김철수",
            target_party_name="이영희",
            type=RelationshipType.MARRIAGE,
            extraction_confidence=0.85
        )
        assert request.source_party_name == "김철수"
        assert request.target_party_name == "이영희"
        assert request.type == RelationshipType.MARRIAGE
        assert request.extraction_confidence == 0.85
        assert request.evidence_text is None

    def test_with_evidence_text(self):
        """Should accept optional evidence text"""
        request = AutoExtractedRelationshipRequest(
            source_party_name="김철수",
            target_party_name="박미나",
            type=RelationshipType.AFFAIR,
            extraction_confidence=0.7,
            evidence_text="2023년 5월부터 불륜관계 시작"
        )
        assert request.evidence_text == "2023년 5월부터 불륜관계 시작"

    def test_all_relationship_types(self):
        """Should accept all relationship types"""
        types = [
            RelationshipType.MARRIAGE,
            RelationshipType.AFFAIR,
            RelationshipType.PARENT_CHILD,
            RelationshipType.SIBLING,
            RelationshipType.IN_LAW,
            RelationshipType.COHABIT,
        ]
        for rel_type in types:
            request = AutoExtractedRelationshipRequest(
                source_party_name="A",
                target_party_name="B",
                type=rel_type,
                extraction_confidence=0.5
            )
            assert request.type == rel_type


class TestAutoExtractedRelationshipResponse:
    """Tests for AutoExtractedRelationshipResponse schema"""

    def test_empty_response(self):
        """Should create empty response"""
        response = AutoExtractedRelationshipResponse()
        assert response.created == []
        assert response.skipped == []

    def test_response_with_skipped(self):
        """Should create response with skipped relationships"""
        response = AutoExtractedRelationshipResponse(
            created=[],
            skipped=[
                {"source": "김철수", "target": "이영희", "reason": "low_confidence"}
            ]
        )
        assert len(response.skipped) == 1
        assert response.skipped[0]["reason"] == "low_confidence"

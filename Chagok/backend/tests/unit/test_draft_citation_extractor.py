"""
Unit tests for Draft CitationExtractor (app/services/draft/citation_extractor.py)
"""

import pytest
from unittest.mock import MagicMock

from app.services.draft.citation_extractor import CitationExtractor
from app.db.schemas import DraftCitation, PrecedentCitation


class TestFormatCitationsForDocument:
    """Tests for format_citations_for_document method"""

    def test_formats_evidence_only(self):
        """Should format evidence citations without precedents"""
        extractor = CitationExtractor()
        evidence = [
            DraftCitation(evidence_id="ev_001", snippet="Test content", labels=["폭언"]),
            DraftCitation(evidence_id="ev_002", snippet="Another", labels=["협박"])
        ]

        result = extractor.format_citations_for_document(evidence)

        assert "evidence" in result
        assert len(result["evidence"]) == 2
        assert result["evidence"][0]["evidence_id"] == "ev_001"
        assert "precedents" not in result

    def test_formats_evidence_with_precedents(self):
        """Should format both evidence and precedent citations (line 119)"""
        extractor = CitationExtractor()
        evidence = [
            DraftCitation(evidence_id="ev_001", snippet="Test", labels=[])
        ]
        precedents = [
            PrecedentCitation(
                case_ref="2020므12345",
                court="서울가정법원",
                decision_date="2020-06-15",
                summary="이혼 사유 인정",
                source_url="https://example.com/case",
                similarity_score=0.85
            )
        ]

        result = extractor.format_citations_for_document(evidence, precedents)

        assert "evidence" in result
        assert "precedents" in result
        assert len(result["precedents"]) == 1
        assert result["precedents"][0]["case_ref"] == "2020므12345"
        assert result["precedents"][0]["court"] == "서울가정법원"

    def test_formats_empty_evidence_with_precedents(self):
        """Should format empty evidence but with precedents"""
        extractor = CitationExtractor()
        precedents = [
            PrecedentCitation(
                case_ref="2021다56789",
                court="대법원",
                decision_date="2021-03-20",
                summary="위자료 산정 기준",
                source_url=None,
                similarity_score=0.92
            )
        ]

        result = extractor.format_citations_for_document([], precedents)

        assert "evidence" in result
        assert len(result["evidence"]) == 0
        assert "precedents" in result
        assert len(result["precedents"]) == 1

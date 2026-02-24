"""
Unit tests for has_speaker_mapping field in evidence list
015-evidence-speaker-mapping: T023
"""

import pytest
from unittest.mock import MagicMock, patch

from app.services.evidence_service import EvidenceService
from app.services.evidence import EvidenceQueryService


class TestEvidenceListHasSpeakerMapping:
    """Unit tests for has_speaker_mapping field in evidence list response"""

    @pytest.fixture
    def mock_db(self):
        return MagicMock()

@pytest.fixture
def service_with_mocks():
    """Fixture to create an EvidenceService with mocked dependencies."""
    db_mock = MagicMock()
    with patch('app.services.evidence_service.EvidenceServiceQueryHandler') as mock_query_handler:
        service = EvidenceService(db_mock)
        service.query_handler = mock_query_handler.return_value
        yield service, mock_query_handler.return_value


    def test_evidence_with_speaker_mapping_has_flag_true(self, service_with_mocks):
        """
        Evidence with a non-empty speaker_mapping should have has_speaker_mapping = True.
        """
        service, mock_query_handler = service_with_mocks
        mock_query_handler.get_evidence_list.return_value = [
            Evidence(
                id="evt_1",
                type="audio",
                speaker_mapping=[{"speaker": "SPEAKER_00", "party_id": "party_123"}]
            )
        ]

        result = service.get_evidence_list("case_123", "user_001")

        assert len(result) == 1
        assert result[0].has_speaker_mapping is True

    def test_evidence_without_speaker_mapping_has_flag_false(self, service_with_mocks):
        """
        Evidence with no speaker_mapping (None) should have has_speaker_mapping = False.
        """
        service, mock_query_handler = service_with_mocks
        mock_query_handler.get_evidence_list.return_value = [
            Evidence(
                id="evt_2",
                type="video",
                speaker_mapping=None
            )
        ]

        result = service.get_evidence_list("case_123", "user_001")

        assert len(result) == 1
        assert result[0].has_speaker_mapping is False

    def test_evidence_with_empty_speaker_mapping_has_flag_false(self, service_with_mocks):
        """
        Evidence with an empty speaker_mapping list should have has_speaker_mapping = False.
        """
        service, mock_query_handler = service_with_mocks
        mock_query_handler.get_evidence_list.return_value = [
            Evidence(
                id="evt_3",
                type="audio",
                speaker_mapping=[]
            )
        ]

        result = service.get_evidence_list("case_123", "user_001")

        assert len(result) == 1
        assert result[0].has_speaker_mapping is False

    def test_evidence_with_none_speaker_mapping_has_flag_false(self, service_with_mocks):
        """
        Evidence with speaker_mapping=None should have has_speaker_mapping = False.
        """
        service, mock_query_handler = service_with_mocks
        mock_query_handler.get_evidence_list.return_value = [
            Evidence(
                id="evt_4",
                type="image",
                speaker_mapping=None
            )
        ]

        result = service.get_evidence_list("case_123", "user_001")

        assert len(result) == 1
        assert result[0].has_speaker_mapping is False

    def test_mixed_evidence_list(self, service_with_mocks):
        """
        A mixed list of evidence items should have the correct has_speaker_mapping flag set for each.
        """
        service, mock_query_handler = service_with_mocks
        mock_query_handler.get_evidence_list.return_value = [
            Evidence(
                id="evt_1",
                type="audio",
                speaker_mapping=[{"speaker": "SPEAKER_00", "party_id": "party_123"}]
            ),
            Evidence(
                id="evt_2",
                type="video",
                speaker_mapping=[]
            ),
            Evidence(
                id="evt_3",
                type="image",
                speaker_mapping=None
            ),
        ]

        result = service.get_evidence_list("case_123", "user_001")

        assert len(result) == 3
        assert result[0].has_speaker_mapping is True
        assert result[1].has_speaker_mapping is False
        assert result[2].has_speaker_mapping is False

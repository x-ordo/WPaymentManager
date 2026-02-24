"""
Integration tests for PATCH /evidence/{id}/speaker-mapping endpoint
015-evidence-speaker-mapping: T009

Tests EvidenceService.update_speaker_mapping method with mocked dependencies.
"""

import pytest
from unittest.mock import MagicMock, patch, patch

from app.services.evidence_service import EvidenceService
from app.db.schemas import SpeakerMappingItem, SpeakerMappingUpdateRequest
from app.middleware import NotFoundError, PermissionError, ValidationError


class TestSpeakerMappingAPI:
    """Integration tests for speaker mapping API endpoint"""

    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        db = MagicMock()
        db.commit = MagicMock()
        db.flush = MagicMock()
        db.add = MagicMock()
        return db

    @pytest.fixture
    def mock_user_id(self):
        """Mock user ID for authenticated requests"""
        return "user_lawyer_001"

    @pytest.fixture
    def mock_evidence(self):
        """Mock evidence data from DynamoDB"""
        return {
            "evidence_id": "evt_test_123",
            "case_id": "case_test_456",
            "type": "image",
            "filename": "kakaotalk_capture.jpg",
            "s3_key": "cases/case_test_456/raw/evt_test_123_kakaotalk_capture.jpg",
            "status": "completed",
            "created_at": "2024-01-15T10:00:00Z",
        }

    @pytest.fixture
    def mock_party(self):
        """Mock party object"""
        party = MagicMock()
        party.id = "party_001"
        party.case_id = "case_test_456"
        party.name = "김동우"
        party.type = "plaintiff"
        return party

    @pytest.fixture
    def mock_party_2(self):
        """Second mock party for multi-speaker mapping"""
        party = MagicMock()
        party.id = "party_002"
        party.case_id = "case_test_456"
        party.name = "김도연"
        party.type = "defendant"
        return party

    def test_update_speaker_mapping_success(
        self,
        mock_db,
        mock_evidence,
        mock_party,
        mock_party_2,
        mock_user_id
    ):
        """Successfully update speaker mapping via API"""
        with patch('app.services.evidence_service.DynamoEvidenceAdapter') as mock_dynamo_adapter, \
             patch('app.services.evidence_service.AuditAdapter') as mock_audit_adapter:
            mock_dynamo_adapter.return_value.get_evidence_by_id.return_value = mock_evidence
            mock_dynamo_adapter.return_value.update_evidence_speaker_mapping.return_value = True

            service = EvidenceService(mock_db)
            # Mock case member access
            service.member_repo.has_access = MagicMock(return_value=True)
            # Mock party repository
            service.party_repo.get_by_id = MagicMock(
                side_effect=lambda x: mock_party if x == "party_001" else mock_party_2
            )

            request = SpeakerMappingUpdateRequest(
                speaker_mapping={
                    "나": SpeakerMappingItem(party_id="party_001", party_name="김동우"),
                    "상대방": SpeakerMappingItem(party_id="party_002", party_name="김도연")
                }
            )

            result = service.update_speaker_mapping("evt_test_123", mock_user_id, request)

            assert result.evidence_id == "evt_test_123"
            assert "나" in result.speaker_mapping
            assert result.speaker_mapping["나"].party_id == "party_001"
            # Verify audit log was called
            mock_audit_adapter.return_value.log_audit_event.assert_called_once()

    def test_clear_speaker_mapping(
        self,
        mock_db,
        mock_evidence,
        mock_user_id
    ):
        """Clear speaker mapping with empty object"""
        with patch('app.services.evidence_service.DynamoEvidenceAdapter') as mock_dynamo_adapter, \
             patch('app.services.evidence_service.AuditAdapter') as mock_audit_adapter:
            mock_dynamo_adapter.return_value.get_evidence_by_id.return_value = mock_evidence
            mock_dynamo_adapter.return_value.update_evidence_speaker_mapping.return_value = True

            service = EvidenceService(mock_db)
            service.member_repo.has_access = MagicMock(return_value=True)

            request = SpeakerMappingUpdateRequest(speaker_mapping={})

            result = service.update_speaker_mapping("evt_test_123", mock_user_id, request)

            assert result.evidence_id == "evt_test_123"
            assert result.speaker_mapping is None
            # Verify audit log was called for clearing too
            mock_audit_adapter.return_value.log_audit_event.assert_called_once()

    def test_update_speaker_mapping_evidence_not_found(
        self,
        mock_db,
        mock_user_id
    ):
        """Return 404 when evidence doesn't exist"""
        with patch('app.services.evidence_service.DynamoEvidenceAdapter') as mock_dynamo_adapter:
            mock_dynamo_adapter.return_value.get_evidence_by_id.return_value = None

            service = EvidenceService(mock_db)

            request = SpeakerMappingUpdateRequest(
                speaker_mapping={
                    "나": SpeakerMappingItem(party_id="party_001", party_name="김동우")
                }
            )

            with pytest.raises(NotFoundError):
                service.update_speaker_mapping("evt_nonexistent", mock_user_id, request)

    def test_update_speaker_mapping_permission_denied(
        self,
        mock_db,
        mock_evidence,
        mock_user_id
    ):
        """Return 403 when user doesn't have case access"""
        with patch('app.services.evidence_service.DynamoEvidenceAdapter') as mock_dynamo_adapter:
            mock_dynamo_adapter.return_value.get_evidence_by_id.return_value = mock_evidence

            service = EvidenceService(mock_db)
            service.member_repo.has_access = MagicMock(return_value=False)

            request = SpeakerMappingUpdateRequest(
                speaker_mapping={
                    "나": SpeakerMappingItem(party_id="party_001", party_name="김동우")
                }
            )

            with pytest.raises(PermissionError):
                service.update_speaker_mapping("evt_test_123", mock_user_id, request)

    def test_update_speaker_mapping_invalid_party(
        self,
        mock_db,
        mock_evidence,
        mock_user_id
    ):
        """Return 400 when party_id doesn't exist"""
        with patch('app.services.evidence_service.DynamoEvidenceAdapter') as mock_dynamo_adapter:
            mock_dynamo_adapter.return_value.get_evidence_by_id.return_value = mock_evidence

            service = EvidenceService(mock_db)
            service.member_repo.has_access = MagicMock(return_value=True)
            service.party_repo.get_by_id = MagicMock(return_value=None)  # Party not found

            request = SpeakerMappingUpdateRequest(
                speaker_mapping={
                    "나": SpeakerMappingItem(
                        party_id="party_nonexistent", party_name="김동우"
                    )
                }
            )

            with pytest.raises(ValidationError) as exc_info:
                service.update_speaker_mapping("evt_test_123", mock_user_id, request)

            assert "찾을 수 없습니다" in str(exc_info.value)

    def test_update_speaker_mapping_party_wrong_case(
        self,
        mock_db,
        mock_evidence,
        mock_party,
        mock_user_id
    ):
        """Return 400 when party belongs to different case"""
        with patch('app.services.evidence_service.DynamoEvidenceAdapter') as mock_dynamo_adapter:
            mock_dynamo_adapter.return_value.get_evidence_by_id.return_value = mock_evidence

            # Party belongs to different case
            mock_party.case_id = "different_case_789"

            service = EvidenceService(mock_db)
            service.member_repo.has_access = MagicMock(return_value=True)
            service.party_repo.get_by_id = MagicMock(return_value=mock_party)

            request = SpeakerMappingUpdateRequest(
                speaker_mapping={
                    "나": SpeakerMappingItem(party_id="party_001", party_name="김동우")
                }
            )

            with pytest.raises(ValidationError) as exc_info:
                service.update_speaker_mapping("evt_test_123", mock_user_id, request)

            assert "이 사건에 속하지 않습니다" in str(exc_info.value)

    def test_update_speaker_mapping_too_many_speakers(
        self,
        mock_db,
        mock_evidence,
        mock_party,
        mock_user_id
    ):
        """Return 400 when more than 10 speakers"""
        with patch('app.services.evidence_service.DynamoEvidenceAdapter') as mock_dynamo_adapter:
            mock_dynamo_adapter.return_value.get_evidence_by_id.return_value = mock_evidence

            service = EvidenceService(mock_db)
            service.member_repo.has_access = MagicMock(return_value=True)
            service.party_repo.get_by_id = MagicMock(return_value=mock_party)

            # Create 11 speakers
            speaker_mapping = {
                f"화자{i}": SpeakerMappingItem(party_id="party_001", party_name="김동우")
                for i in range(11)
            }

            request = SpeakerMappingUpdateRequest(speaker_mapping=speaker_mapping)

            with pytest.raises(ValidationError) as exc_info:
                service.update_speaker_mapping("evt_test_123", mock_user_id, request)

            assert "10명" in str(exc_info.value)

    def test_audit_log_contains_evidence_id(
        self,
        mock_db,
        mock_evidence,
        mock_party,
        mock_user_id
    ):
        """Verify audit log is recorded with correct evidence ID"""
        with patch('app.services.evidence_service.DynamoEvidenceAdapter') as mock_dynamo_adapter, \
             patch('app.services.evidence_service.AuditAdapter') as mock_audit_adapter:
            mock_dynamo_adapter.return_value.get_evidence_by_id.return_value = mock_evidence
            mock_dynamo_adapter.return_value.update_evidence_speaker_mapping.return_value = True

            service = EvidenceService(mock_db)
            service.member_repo.has_access = MagicMock(return_value=True)
            service.party_repo.get_by_id = MagicMock(return_value=mock_party)

            request = SpeakerMappingUpdateRequest(
                speaker_mapping={
                    "나": SpeakerMappingItem(party_id="party_001", party_name="김동우")
                }
            )

            service.update_speaker_mapping("evt_test_123", mock_user_id, request)

            # Verify audit log was called with correct parameters
            mock_audit_adapter.return_value.log_audit_event.assert_called_once()
            call_args = mock_audit_adapter.return_value.log_audit_event.call_args
            assert call_args.kwargs["object_id"] == "evt_test_123"
            assert call_args.kwargs["user_id"] == mock_user_id


import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, date

from app.services.consultation_service import ConsultationService
from app.db.schemas.consultation import ConsultationCreate
from app.db.models.enums import ConsultationType
from app.db.models import User, Case, CaseMember, CaseMemberRole
from app.middleware import NotFoundError, PermissionError


class TestConsultationService:
    @pytest.fixture
    def mock_db(self):
        return MagicMock()

    @pytest.fixture
    def mock_user(self):
        user = User(id="user1", name="Test User")
        return user

    @pytest.fixture
    def mock_case(self):
        case = Case(id="case1", title="Test Case")
        return case

    def test_create_consultation_success(self, mock_db, mock_user, mock_case):
        with patch('app.services.consultation_service.ConsultationRepository') as mock_repo, \
             patch('app.services.consultation_service.CaseRepository') as mock_case_repo, \
             patch('app.services.consultation_service.AuditService') as mock_audit_service, \
             patch('app.services.consultation_service.index_consultation_document') as mock_index:

            mock_case_repo.return_value.get_by_id.return_value = mock_case
            mock_case_repo.return_value.is_user_member_of_case.return_value = True
            
            mock_consultation = MagicMock()
            mock_consultation.id = "consult1"
            mock_consultation.case_id = "case1"
            mock_consultation.date = date(2025, 1, 1)
            mock_consultation.time = "10:00"
            mock_consultation.type = ConsultationType.PHONE
            mock_consultation.summary = "Test Summary"
            mock_consultation.notes = "Test Notes"
            mock_consultation.created_by = "user1"
            mock_consultation.creator = mock_user
            mock_consultation.participants = []
            mock_consultation.evidence_links = []
            mock_consultation.created_at = datetime.now()
            mock_consultation.updated_at = datetime.now()

            mock_repo.return_value.create.return_value = mock_consultation

            service = ConsultationService(mock_db)
            service.repo = mock_repo.return_value
            service.case_repo = mock_case_repo.return_value
            service.audit_service = mock_audit_service.return_value

            data = ConsultationCreate(
                date=date(2025, 1, 1),
                time="10:00",
                type=ConsultationType.PHONE,
                summary="Test Summary",
                notes="Test Notes",
                participants=[]
            )

            result = service.create_consultation("case1", data, "user1")

            assert result.id == "consult1"
            assert result.summary == "Test Summary"
            mock_repo.return_value.create.assert_called_once()
            mock_audit_service.return_value.log.assert_called_once()
            mock_index.assert_called_once()


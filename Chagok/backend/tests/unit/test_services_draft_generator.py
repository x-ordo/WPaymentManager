"""
Unit tests for Draft Generator (app/services/draft/generator.py)
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone

from app.services.draft.generator import DraftGenerator
from app.db.schemas import DraftPreviewRequest, DraftExportFormat


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return MagicMock()


@pytest.fixture
def mock_case():
    """Create a mock case object"""
    case = MagicMock()
    case.id = "case_001"
    case.title = "테스트 이혼 소송"
    case.description = "가정폭력 사건"
    return case


@pytest.fixture
def mock_draft_request():
    """Create a default draft preview request"""
    return DraftPreviewRequest(
        sections=["청구취지", "청구원인"],
        language="ko",
        style="formal"
    )


class TestDraftGeneratorInit:
    """Tests for DraftGenerator initialization"""

    def test_init_creates_repositories(self, mock_db):
        """Should create case and member repositories"""
        generator = DraftGenerator(mock_db)

        assert generator.db == mock_db
        assert generator.case_repo is not None
        assert generator.member_repo is not None


class TestGenerateDraftPreview:
    """Tests for generate_draft_preview method"""

    @patch('app.services.draft.generator.generate_chat_completion')
    @patch('app.services.draft.generator.search_evidence_by_semantic')
    @patch('app.services.draft.generator.get_evidence_by_case')
    @patch('app.services.draft.generator.CaseMemberRepository')
    @patch('app.services.draft.generator.CaseRepository')
    def test_generates_draft_successfully(
        self,
        MockCaseRepo,
        MockMemberRepo,
        mock_get_evidence,
        mock_search,
        mock_completion,
        mock_db,
        mock_case,
        mock_draft_request
    ):
        """Should generate draft preview successfully"""
        # Setup mocks
        mock_case_repo = MagicMock()
        mock_case_repo.get_by_id.return_value = mock_case
        MockCaseRepo.return_value = mock_case_repo

        mock_member_repo = MagicMock()
        mock_member_repo.has_access.return_value = True
        MockMemberRepo.return_value = mock_member_repo

        mock_get_evidence.return_value = [{"id": "ev_001", "status": "done"}]
        mock_search.return_value = [{"id": "ev_001", "content": "Test content", "labels": []}]
        mock_completion.return_value = "Generated draft text"

        # Execute
        generator = DraftGenerator(mock_db)
        result = generator.generate_draft_preview(
            case_id="case_001",
            request=mock_draft_request,
            user_id="user_001"
        )

        # Verify
        assert result.case_id == "case_001"
        assert result.draft_text == "Generated draft text"
        assert result.generated_at is not None

    @patch('app.services.draft.generator.CaseMemberRepository')
    @patch('app.services.draft.generator.CaseRepository')
    def test_raises_not_found_when_case_missing(
        self,
        MockCaseRepo,
        MockMemberRepo,
        mock_db,
        mock_draft_request
    ):
        """Should raise NotFoundError when case doesn't exist"""
        mock_case_repo = MagicMock()
        mock_case_repo.get_by_id.return_value = None
        MockCaseRepo.return_value = mock_case_repo

        generator = DraftGenerator(mock_db)

        with pytest.raises(Exception) as exc_info:
            generator.generate_draft_preview(
                case_id="nonexistent",
                request=mock_draft_request,
                user_id="user_001"
            )

        assert "Case" in str(exc_info.value) or "not found" in str(exc_info.value).lower()

    @patch('app.services.draft.generator.CaseMemberRepository')
    @patch('app.services.draft.generator.CaseRepository')
    def test_raises_permission_error_when_no_access(
        self,
        MockCaseRepo,
        MockMemberRepo,
        mock_db,
        mock_case,
        mock_draft_request
    ):
        """Should raise PermissionError when user has no access"""
        mock_case_repo = MagicMock()
        mock_case_repo.get_by_id.return_value = mock_case
        MockCaseRepo.return_value = mock_case_repo

        mock_member_repo = MagicMock()
        mock_member_repo.has_access.return_value = False
        MockMemberRepo.return_value = mock_member_repo

        generator = DraftGenerator(mock_db)

        with pytest.raises(Exception) as exc_info:
            generator.generate_draft_preview(
                case_id="case_001",
                request=mock_draft_request,
                user_id="user_001"
            )

        assert "access" in str(exc_info.value).lower() or "permission" in str(exc_info.value).lower()

    @patch('app.services.draft.generator.get_evidence_by_case')
    @patch('app.services.draft.generator.CaseMemberRepository')
    @patch('app.services.draft.generator.CaseRepository')
    def test_raises_validation_error_when_no_evidence(
        self,
        MockCaseRepo,
        MockMemberRepo,
        mock_get_evidence,
        mock_db,
        mock_case,
        mock_draft_request
    ):
        """Should raise ValidationError when case has no evidence"""
        mock_case_repo = MagicMock()
        mock_case_repo.get_by_id.return_value = mock_case
        MockCaseRepo.return_value = mock_case_repo

        mock_member_repo = MagicMock()
        mock_member_repo.has_access.return_value = True
        MockMemberRepo.return_value = mock_member_repo

        mock_get_evidence.return_value = []  # No evidence

        generator = DraftGenerator(mock_db)

        with pytest.raises(Exception) as exc_info:
            generator.generate_draft_preview(
                case_id="case_001",
                request=mock_draft_request,
                user_id="user_001"
            )

        assert "증거" in str(exc_info.value) or "evidence" in str(exc_info.value).lower()


class TestPerformRagSearch:
    """Tests for _perform_rag_search method"""

    @patch('app.services.draft.generator.search_evidence_by_semantic')
    @patch('app.services.draft.generator.CaseMemberRepository')
    @patch('app.services.draft.generator.CaseRepository')
    def test_uses_specialized_query_for_청구원인(
        self,
        MockCaseRepo,
        MockMemberRepo,
        mock_search,
        mock_db
    ):
        """Should use specialized query when 청구원인 is in sections"""
        mock_search.return_value = []

        generator = DraftGenerator(mock_db)
        generator._perform_rag_search("case_001", ["청구원인"])

        # Verify specialized query was used with top_k=10
        call_args = mock_search.call_args
        assert "이혼" in call_args[1]["query"]
        assert call_args[1]["top_k"] == 10

    @patch('app.services.draft.generator.search_evidence_by_semantic')
    @patch('app.services.draft.generator.CaseMemberRepository')
    @patch('app.services.draft.generator.CaseRepository')
    def test_uses_section_names_for_other_sections(
        self,
        MockCaseRepo,
        MockMemberRepo,
        mock_search,
        mock_db
    ):
        """Should use section names as query for non-청구원인 sections"""
        mock_search.return_value = []

        generator = DraftGenerator(mock_db)
        generator._perform_rag_search("case_001", ["청구취지", "결론"])

        # Verify section names were used with top_k=5
        call_args = mock_search.call_args
        assert call_args[1]["top_k"] == 5


class TestExportDraft:
    """Tests for export_draft method"""

    @patch('app.services.draft.generator.generate_docx')
    @patch('app.services.draft.generator.generate_chat_completion')
    @patch('app.services.draft.generator.search_evidence_by_semantic')
    @patch('app.services.draft.generator.get_evidence_by_case')
    @patch('app.services.draft.generator.CaseMemberRepository')
    @patch('app.services.draft.generator.CaseRepository')
    def test_exports_docx_format(
        self,
        MockCaseRepo,
        MockMemberRepo,
        mock_get_evidence,
        mock_search,
        mock_completion,
        mock_generate_docx,
        mock_db,
        mock_case
    ):
        """Should export as DOCX when format is DOCX"""
        # Setup mocks
        mock_case_repo = MagicMock()
        mock_case_repo.get_by_id.return_value = mock_case
        MockCaseRepo.return_value = mock_case_repo

        mock_member_repo = MagicMock()
        mock_member_repo.has_access.return_value = True
        MockMemberRepo.return_value = mock_member_repo

        mock_get_evidence.return_value = [{"id": "ev_001", "status": "done"}]
        mock_search.return_value = []
        mock_completion.return_value = "Draft text"

        from io import BytesIO
        mock_buffer = BytesIO(b"test docx content")
        mock_generate_docx.return_value = (mock_buffer, "test.docx", "application/docx")

        # Execute
        generator = DraftGenerator(mock_db)
        result = generator.export_draft(
            case_id="case_001",
            user_id="user_001",
            export_format=DraftExportFormat.DOCX
        )

        # Verify
        mock_generate_docx.assert_called_once()
        assert result[1] == "test.docx"

    @patch('app.services.draft.generator.generate_pdf')
    @patch('app.services.draft.generator.generate_chat_completion')
    @patch('app.services.draft.generator.search_evidence_by_semantic')
    @patch('app.services.draft.generator.get_evidence_by_case')
    @patch('app.services.draft.generator.CaseMemberRepository')
    @patch('app.services.draft.generator.CaseRepository')
    def test_exports_pdf_format(
        self,
        MockCaseRepo,
        MockMemberRepo,
        mock_get_evidence,
        mock_search,
        mock_completion,
        mock_generate_pdf,
        mock_db,
        mock_case
    ):
        """Should export as PDF when format is PDF"""
        # Setup mocks
        mock_case_repo = MagicMock()
        mock_case_repo.get_by_id.return_value = mock_case
        MockCaseRepo.return_value = mock_case_repo

        mock_member_repo = MagicMock()
        mock_member_repo.has_access.return_value = True
        MockMemberRepo.return_value = mock_member_repo

        mock_get_evidence.return_value = [{"id": "ev_001", "status": "done"}]
        mock_search.return_value = []
        mock_completion.return_value = "Draft text"

        from io import BytesIO
        mock_buffer = BytesIO(b"test pdf content")
        mock_generate_pdf.return_value = (mock_buffer, "test.pdf", "application/pdf")

        # Execute
        generator = DraftGenerator(mock_db)
        result = generator.export_draft(
            case_id="case_001",
            user_id="user_001",
            export_format=DraftExportFormat.PDF
        )

        # Verify
        mock_generate_pdf.assert_called_once()
        assert result[1] == "test.pdf"

    @patch('app.services.draft.generator.CaseMemberRepository')
    @patch('app.services.draft.generator.CaseRepository')
    def test_export_raises_not_found_when_case_missing(
        self,
        MockCaseRepo,
        MockMemberRepo,
        mock_db
    ):
        """Should raise NotFoundError when case doesn't exist"""
        mock_case_repo = MagicMock()
        mock_case_repo.get_by_id.return_value = None
        MockCaseRepo.return_value = mock_case_repo

        generator = DraftGenerator(mock_db)

        with pytest.raises(Exception) as exc_info:
            generator.export_draft(
                case_id="nonexistent",
                user_id="user_001",
                export_format=DraftExportFormat.DOCX
            )

        assert "Case" in str(exc_info.value) or "not found" in str(exc_info.value).lower()

    @patch('app.services.draft.generator.CaseMemberRepository')
    @patch('app.services.draft.generator.CaseRepository')
    def test_export_raises_permission_error_when_no_access(
        self,
        MockCaseRepo,
        MockMemberRepo,
        mock_db,
        mock_case
    ):
        """Should raise PermissionError when user has no access"""
        mock_case_repo = MagicMock()
        mock_case_repo.get_by_id.return_value = mock_case
        MockCaseRepo.return_value = mock_case_repo

        mock_member_repo = MagicMock()
        mock_member_repo.has_access.return_value = False
        MockMemberRepo.return_value = mock_member_repo

        generator = DraftGenerator(mock_db)

        with pytest.raises(Exception) as exc_info:
            generator.export_draft(
                case_id="case_001",
                user_id="user_001",
                export_format=DraftExportFormat.DOCX
            )

        assert "access" in str(exc_info.value).lower() or "permission" in str(exc_info.value).lower()

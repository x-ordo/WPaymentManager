"""
Unit tests for Party Graph schemas (app/schemas/party.py)
Tests validation, enums, and model behavior
"""

import pytest
from datetime import date, datetime
from pydantic import ValidationError

from app.schemas.party import (
    PartyType,
    RelationshipType,
    LinkType,
    Position,
    PartyNodeCreate,
    PartyNodeUpdate,
    PartyNodeResponse,
    RelationshipCreate,
    RelationshipUpdate,
    RelationshipResponse,
    EvidenceLinkCreate,
    EvidenceLinkResponse,
    PartyGraphResponse,
    PartyListResponse,
    RelationshipListResponse,
    EvidenceLinkListResponse,
)


class TestEnums:
    """Tests for enum types"""

    def test_party_type_values(self):
        """Should have expected party types"""
        assert PartyType.PLAINTIFF == "plaintiff"
        assert PartyType.DEFENDANT == "defendant"
        assert PartyType.THIRD_PARTY == "third_party"
        assert PartyType.CHILD == "child"
        assert PartyType.FAMILY == "family"

    def test_relationship_type_values(self):
        """Should have expected relationship types"""
        assert RelationshipType.MARRIAGE == "marriage"
        assert RelationshipType.AFFAIR == "affair"
        assert RelationshipType.PARENT_CHILD == "parent_child"
        assert RelationshipType.SIBLING == "sibling"
        assert RelationshipType.IN_LAW == "in_law"
        assert RelationshipType.COHABIT == "cohabit"

    def test_link_type_values(self):
        """Should have expected link types"""
        assert LinkType.MENTIONS == "mentions"
        assert LinkType.PROVES == "proves"
        assert LinkType.INVOLVES == "involves"
        assert LinkType.CONTRADICTS == "contradicts"


class TestPosition:
    """Tests for Position schema"""

    def test_default_position(self):
        """Should have default coordinates"""
        pos = Position()
        assert pos.x == 0
        assert pos.y == 0

    def test_custom_position(self):
        """Should accept custom coordinates"""
        pos = Position(x=100.5, y=200.5)
        assert pos.x == 100.5
        assert pos.y == 200.5


class TestPartyNodeCreate:
    """Tests for PartyNodeCreate schema"""

    def test_valid_party_node(self):
        """Should create valid party node"""
        node = PartyNodeCreate(
            type=PartyType.PLAINTIFF,
            name="김철수"
        )
        assert node.type == PartyType.PLAINTIFF
        assert node.name == "김철수"
        assert node.position.x == 0
        assert node.position.y == 0

    def test_party_node_with_all_fields(self):
        """Should accept all optional fields"""
        node = PartyNodeCreate(
            type=PartyType.DEFENDANT,
            name="이영희",
            alias="이○○",
            birth_year=1985,
            occupation="회사원",
            position=Position(x=100, y=200),
            metadata={"notes": "주요 피고"}
        )
        assert node.alias == "이○○"
        assert node.birth_year == 1985
        assert node.occupation == "회사원"
        assert node.position.x == 100

    def test_name_validation_min_length(self):
        """Should reject empty name"""
        with pytest.raises(ValidationError):
            PartyNodeCreate(type=PartyType.PLAINTIFF, name="")

    def test_birth_year_validation(self):
        """Should validate birth year range"""
        # Valid
        node = PartyNodeCreate(
            type=PartyType.PLAINTIFF,
            name="테스트",
            birth_year=2000
        )
        assert node.birth_year == 2000

        # Invalid - too early
        with pytest.raises(ValidationError):
            PartyNodeCreate(
                type=PartyType.PLAINTIFF,
                name="테스트",
                birth_year=1800
            )


class TestPartyNodeUpdate:
    """Tests for PartyNodeUpdate schema"""

    def test_all_fields_optional(self):
        """Should allow empty update"""
        update = PartyNodeUpdate()
        assert update.name is None
        assert update.alias is None

    def test_partial_update(self):
        """Should allow partial update"""
        update = PartyNodeUpdate(name="새이름", occupation="변호사")
        assert update.name == "새이름"
        assert update.occupation == "변호사"
        assert update.birth_year is None


class TestPartyNodeResponse:
    """Tests for PartyNodeResponse schema"""

    def test_response_model(self):
        """Should create valid response"""
        now = datetime.utcnow()
        response = PartyNodeResponse(
            id="party_123",
            case_id="case_456",
            type=PartyType.PLAINTIFF,
            name="김철수",
            position=Position(x=0, y=0),
            created_at=now,
            updated_at=now
        )
        assert response.id == "party_123"
        assert response.case_id == "case_456"


class TestRelationshipCreate:
    """Tests for RelationshipCreate schema"""

    def test_valid_relationship(self):
        """Should create valid relationship"""
        rel = RelationshipCreate(
            source_party_id="party_1",
            target_party_id="party_2",
            type=RelationshipType.MARRIAGE
        )
        assert rel.source_party_id == "party_1"
        assert rel.target_party_id == "party_2"

    def test_relationship_with_dates(self):
        """Should accept date fields"""
        rel = RelationshipCreate(
            source_party_id="party_1",
            target_party_id="party_2",
            type=RelationshipType.MARRIAGE,
            start_date=date(2010, 5, 1),
            end_date=date(2020, 3, 15),
            notes="혼인기간"
        )
        assert rel.start_date == date(2010, 5, 1)
        assert rel.notes == "혼인기간"

    def test_self_reference_validation(self):
        """Should reject self-referencing relationship"""
        with pytest.raises(ValidationError) as exc_info:
            RelationshipCreate(
                source_party_id="party_1",
                target_party_id="party_1",
                type=RelationshipType.MARRIAGE
            )
        assert "same" in str(exc_info.value).lower()


class TestRelationshipUpdate:
    """Tests for RelationshipUpdate schema"""

    def test_all_fields_optional(self):
        """Should allow empty update"""
        update = RelationshipUpdate()
        assert update.type is None

    def test_partial_update(self):
        """Should allow partial update"""
        update = RelationshipUpdate(
            type=RelationshipType.AFFAIR,
            notes="불륜관계로 변경"
        )
        assert update.type == RelationshipType.AFFAIR


class TestRelationshipResponse:
    """Tests for RelationshipResponse schema"""

    def test_response_model(self):
        """Should create valid response"""
        now = datetime.utcnow()
        response = RelationshipResponse(
            id="rel_123",
            case_id="case_456",
            source_party_id="party_1",
            target_party_id="party_2",
            type=RelationshipType.MARRIAGE,
            created_at=now,
            updated_at=now
        )
        assert response.id == "rel_123"


class TestEvidenceLinkCreate:
    """Tests for EvidenceLinkCreate schema"""

    def test_valid_link_with_party(self):
        """Should create link with party"""
        link = EvidenceLinkCreate(
            evidence_id="ev_001",
            party_id="party_1"
        )
        assert link.evidence_id == "ev_001"
        assert link.link_type == LinkType.MENTIONS  # default

    def test_valid_link_with_relationship(self):
        """Should create link with relationship"""
        link = EvidenceLinkCreate(
            evidence_id="ev_001",
            relationship_id="rel_1",
            link_type=LinkType.PROVES
        )
        assert link.relationship_id == "rel_1"
        assert link.link_type == LinkType.PROVES

    def test_link_both_targets_optional(self):
        """Should allow link with both party and relationship"""
        link = EvidenceLinkCreate(
            evidence_id="ev_001",
            party_id="party_1",
            relationship_id="rel_1"
        )
        assert link.party_id == "party_1"
        assert link.relationship_id == "rel_1"


class TestEvidenceLinkResponse:
    """Tests for EvidenceLinkResponse schema"""

    def test_response_model(self):
        """Should create valid response"""
        now = datetime.utcnow()
        response = EvidenceLinkResponse(
            id="link_123",
            case_id="case_456",
            evidence_id="ev_001",
            party_id="party_1",
            link_type=LinkType.MENTIONS,
            created_at=now
        )
        assert response.id == "link_123"


class TestPartyGraphResponse:
    """Tests for PartyGraphResponse schema"""

    def test_empty_graph(self):
        """Should create empty graph"""
        graph = PartyGraphResponse()
        assert graph.nodes == []
        assert graph.relationships == []

    def test_graph_with_data(self):
        """Should create graph with nodes and relationships"""
        now = datetime.utcnow()
        nodes = [
            PartyNodeResponse(
                id="party_1",
                case_id="case_1",
                type=PartyType.PLAINTIFF,
                name="원고",
                position=Position(),
                created_at=now,
                updated_at=now
            )
        ]
        relationships = [
            RelationshipResponse(
                id="rel_1",
                case_id="case_1",
                source_party_id="party_1",
                target_party_id="party_2",
                type=RelationshipType.MARRIAGE,
                created_at=now,
                updated_at=now
            )
        ]
        graph = PartyGraphResponse(nodes=nodes, relationships=relationships)
        assert len(graph.nodes) == 1
        assert len(graph.relationships) == 1


class TestListResponses:
    """Tests for list response schemas"""

    def test_party_list_response(self):
        """Should create party list response"""
        response = PartyListResponse(items=[], total=0)
        assert response.items == []
        assert response.total == 0

    def test_relationship_list_response(self):
        """Should create relationship list response"""
        response = RelationshipListResponse(items=[], total=0)
        assert response.items == []
        assert response.total == 0

    def test_evidence_link_list_response(self):
        """Should create evidence link list response"""
        response = EvidenceLinkListResponse(items=[], total=0)
        assert response.items == []
        assert response.total == 0

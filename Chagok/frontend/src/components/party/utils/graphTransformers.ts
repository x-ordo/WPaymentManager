/**
 * Graph Transformation Utilities
 * Converts backend party data to React Flow format
 */

import type { PartyNode as PartyNodeData, PartyRelationship } from '@/types/party';
import type { Evidence } from '@/lib/api/evidence';
import type { PartyNodeType, PartyNodeData as FlowNodeData } from '../PartyNode';
import type { PartyEdgeType, PartyEdgeData } from '../PartyEdge';

/**
 * Evidence item interface for EvidenceLinkModal
 */
export interface EvidenceItem {
    id: string;
    summary?: string;
    filename?: string;
    type: string;
    timestamp: string;
    labels?: string[];
}

/**
 * Convert backend party nodes to React Flow node format
 */
export function toFlowNodes(parties: PartyNodeData[]): PartyNodeType[] {
    return parties.map((party) => ({
        id: party.id,
        type: 'party' as const,
        position: party.position || { x: 0, y: 0 },
        data: {
            id: party.id,
            name: party.name,
            type: party.type,
            alias: party.alias,
            occupation: party.occupation,
            birth_year: party.birth_year,
            // 012-precedent-integration: T048-T050 자동 추출 필드 전달
            is_auto_extracted: party.is_auto_extracted,
            extraction_confidence: party.extraction_confidence,
            source_evidence_id: party.source_evidence_id,
        },
    }));
}

/**
 * Convert backend relationships to React Flow edge format
 */
export function toFlowEdges(relationships: PartyRelationship[]): PartyEdgeType[] {
    return relationships.map((rel) => ({
        id: rel.id,
        source: rel.source_party_id,
        target: rel.target_party_id,
        type: 'relationship' as const,
        data: {
            type: rel.type,
            start_date: rel.start_date,
            end_date: rel.end_date,
            notes: rel.notes,
            // 012-precedent-integration: T048-T050 자동 추출 필드 전달
            is_auto_extracted: rel.is_auto_extracted,
            extraction_confidence: rel.extraction_confidence,
            evidence_text: rel.evidence_text,
        },
    }));
}

/**
 * Convert backend Evidence to modal EvidenceItem format
 */
export function toEvidenceItem(evidence: Evidence): EvidenceItem {
    return {
        id: evidence.id,
        summary: evidence.ai_summary,
        filename: evidence.filename,
        type: evidence.type,
        timestamp: evidence.timestamp || evidence.created_at,
        labels: evidence.labels,
    };
}

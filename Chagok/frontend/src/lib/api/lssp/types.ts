/**
 * LSSP (Legal Strategy & Structured Pleading) API Types
 */

// =============================================================================
// Legal Grounds
// =============================================================================

export interface LegalGroundLimitation {
  type?: string;
  known_within_months?: number;
  occurred_within_years?: number;
  needs_legal_review?: boolean;
}

export interface LegalGround {
  code: string;
  name_ko: string;
  elements: string[];
  limitation?: LegalGroundLimitation;
  notes?: string;
  version: string;
  civil_code_ref?: string;
  typical_evidence_types: string[];
}

// =============================================================================
// Keypoints
// =============================================================================

export interface Keypoint {
  id: string;
  case_id: string;
  content: string;
  source_type: 'ai_extracted' | 'user_added' | 'merged';
  confidence_score: number | null;
  temporal_order: number | null;
  is_disputed: boolean;
  user_verified: boolean;
  created_at: string;
  updated_at: string;
  legal_grounds?: LegalGround[];
  evidence_extracts?: EvidenceExtract[];
}

export interface KeypointCreateRequest {
  content: string;
  source_type?: 'ai_extracted' | 'user_added' | 'merged';
  confidence_score?: number;
  temporal_order?: number;
  is_disputed?: boolean;
  user_verified?: boolean;
  legal_ground_ids?: string[];
}

export interface KeypointUpdateRequest {
  content?: string;
  confidence_score?: number;
  temporal_order?: number;
  is_disputed?: boolean;
  user_verified?: boolean;
}

export interface KeypointListResponse {
  keypoints: Keypoint[];
  total: number;
}

// =============================================================================
// Evidence Extracts
// =============================================================================

export interface EvidenceExtract {
  id: string;
  evidence_id: string;
  chunk_index: number;
  content: string;
  embedding_id: string | null;
  page_number: number | null;
  timestamp_start: number | null;
  timestamp_end: number | null;
  created_at: string;
}

// =============================================================================
// Draft Templates & Blocks
// =============================================================================

export interface DraftTemplate {
  id: string;
  template_code: string;
  name: string;
  description: string | null;
  document_type: string;
  version: string;
  is_active: boolean;
  created_at: string;
}

export interface DraftBlock {
  id: string;
  block_code: string;
  name: string;
  description: string | null;
  default_content: string;
  required_variables: string[];
  order_hint: number;
  created_at: string;
}

export interface DraftTemplateWithBlocks extends DraftTemplate {
  blocks: DraftBlock[];
}

// =============================================================================
// Drafts
// =============================================================================

export interface Draft {
  id: string;
  case_id: string;
  template_id: string;
  title: string;
  status: 'generating' | 'draft' | 'review' | 'final';
  version: number;
  created_at: string;
  updated_at: string;
  template?: DraftTemplate;
  block_instances?: DraftBlockInstance[];
}

export interface DraftBlockInstance {
  id: string;
  draft_id: string;
  block_id: string;
  content: string;
  order_index: number;
  is_modified: boolean;
  created_at: string;
  updated_at: string;
  block?: DraftBlock;
  citations?: DraftCitation[];
}

export interface DraftCitation {
  id: string;
  block_instance_id: string;
  keypoint_id: string | null;
  extract_id: string | null;
  citation_text: string;
  position_start: number;
  position_end: number;
  created_at: string;
}

export interface DraftCreateRequest {
  template_id: string;
  title: string;
}

export interface DraftBlockUpdateRequest {
  content: string;
}

export interface DraftListResponse {
  drafts: Draft[];
  total: number;
}

// =============================================================================
// AI Pipeline
// =============================================================================

export interface KeypointExtractionRequest {
  evidence_ids?: string[];
  force_reprocess?: boolean;
}

export interface KeypointExtractionResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  keypoints_created: number;
  message: string;
}

export interface DraftGenerationRequest {
  template_id: string;
  title?: string;
  selected_keypoint_ids?: string[];
  selected_ground_ids?: string[];
}

export interface DraftGenerationResponse {
  draft_id: string;
  status: 'generating' | 'draft';
  message: string;
}

export interface CaseLegalGroundSummaryResponse {
  grounds: Array<{
    ground: LegalGround;
    keypoint_count: number;
    verified_count: number;
    evidence_strength: 'strong' | 'moderate' | 'weak' | 'none';
  }>;
  total_keypoints: number;
  verified_keypoints: number;
}

// =============================================================================
// Pipeline (v2.10)
// =============================================================================

export interface PipelineRule {
  rule_id: number;
  version: string;
  evidence_type: string;
  kind: string;
  name: string;
  pattern: string;
  flags: string;
  value_template: Record<string, unknown>;
  ground_tags: string[];
  base_confidence: number;
  base_materiality: number;
  is_enabled: boolean;
  created_at: string;
}

export interface Candidate {
  candidate_id: number;
  case_id: string;
  evidence_id: string;
  extract_id: string | null;
  run_id: number | null;
  rule_id: number | null;
  kind: string;
  content: string;
  value: Record<string, unknown>;
  ground_tags: string[];
  confidence: number;
  materiality: number;
  source_span: { start: number; end: number } | null;
  status: 'CANDIDATE' | 'ACCEPTED' | 'REJECTED' | 'MERGED';
  reviewer_id: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  rule_name?: string;
}

export interface ExtractionRun {
  run_id: number;
  case_id: string;
  evidence_id: string;
  extractor: string;
  version: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR';
  started_at: string;
  finished_at: string | null;
  candidate_count: number;
  error_message: string | null;
}

export interface PipelineStats {
  total_runs: number;
  total_candidates: number;
  pending_candidates: number;
  accepted_candidates: number;
  rejected_candidates: number;
  promoted_keypoints: number;
}

export interface CandidateUpdateRequest {
  status?: 'CANDIDATE' | 'ACCEPTED' | 'REJECTED';
  content?: string;
  kind?: string;
  ground_tags?: string[];
  rejection_reason?: string;
}

export interface PromoteCandidatesRequest {
  candidate_ids: number[];
  merge_similar?: boolean;
}

export interface PromoteCandidatesResponse {
  promoted_count: number;
  keypoint_ids: string[];
  merged_groups: number[];
}

export interface ExtractCandidatesRequest {
  mode?: 'rule_based' | 'ai_based' | 'hybrid';
  evidence_type?: string;
  text_content?: string;
}

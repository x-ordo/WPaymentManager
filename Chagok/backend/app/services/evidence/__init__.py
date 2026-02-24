"""
Evidence service modules.
"""

from app.services.evidence.upload_handler import EvidenceUploadHandler, get_content_type
from app.services.evidence.evidence_query import EvidenceQueryService, parse_article_840_tags
from app.services.evidence.processing_handler import EvidenceProcessingHandler
from app.services.evidence.review_handler import EvidenceReviewHandler
from app.services.evidence.speaker_mapping_handler import (
    SpeakerMappingHandler,
    validate_speaker_mapping,
    MAX_SPEAKERS,
    MAX_SPEAKER_LABEL_LENGTH,
)
from app.services.evidence.deletion_handler import EvidenceDeletionHandler

__all__ = [
    "EvidenceUploadHandler",
    "EvidenceQueryService",
    "EvidenceProcessingHandler",
    "EvidenceReviewHandler",
    "SpeakerMappingHandler",
    "EvidenceDeletionHandler",
    "get_content_type",
    "parse_article_840_tags",
    "validate_speaker_mapping",
    "MAX_SPEAKERS",
    "MAX_SPEAKER_LABEL_LENGTH",
]

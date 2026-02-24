"""
Evidence utility functions
Common utilities for evidence ID handling and normalization
"""

import uuid
from typing import Optional, Set

from app.middleware import ValidationError


ALLOWED_EVIDENCE_EXTENSIONS: Set[str] = {
    "jpg",
    "jpeg",
    "png",
    "gif",
    "pdf",
    "txt",
    "csv",
    "json",
    "mp3",
    "wav",
    "m4a",
    "mp4",
    "avi",
    "mov",
    "mkv",
}


def generate_evidence_id() -> str:
    """
    Generate a unique evidence ID with standard prefix format.

    Returns:
        str: Evidence ID in format "ev_{12-char-hex}"

    Example:
        >>> generate_evidence_id()
        'ev_a1b2c3d4e5f6'
    """
    return f"ev_{uuid.uuid4().hex[:12]}"


def extract_filename_from_s3_key(s3_key: str) -> str:
    """
    Extract the original filename from an S3 key.

    Handles the evidence temp ID prefix format: ev_xxxx_filename.ext

    Args:
        s3_key: S3 object key (e.g., "cases/case_123/raw/ev_temp123_document.pdf")

    Returns:
        str: Original filename without the evidence temp ID prefix

    Example:
        >>> extract_filename_from_s3_key("cases/case_123/raw/ev_temp123_document.pdf")
        'document.pdf'
        >>> extract_filename_from_s3_key("cases/case_123/raw/document.pdf")
        'document.pdf'
    """
    filename = s3_key.split("/")[-1]

    # Remove temp_id prefix if present (format: ev_xxxx_filename.ext)
    if filename.startswith("ev_") and "_" in filename[3:]:
        filename = filename.split("_", 2)[-1]

    return filename


def validate_evidence_filename(
    filename: str,
    allowed_extensions: Optional[Set[str]] = None
) -> str:
    """
    Validate evidence filename and return its extension.

    Raises ValidationError for invalid filenames or disallowed extensions.
    """
    if not filename or not filename.strip():
        raise ValidationError("Filename is required")

    lowered = filename.lower()

    if "\x00" in filename or "%00" in lowered:
        raise ValidationError("Invalid filename")

    if "/" in filename or "\\" in filename:
        raise ValidationError("Invalid filename")

    if ".." in filename or "%2e" in lowered or "%2f" in lowered or "%5c" in lowered or filename.startswith("."):
        raise ValidationError("Invalid filename")

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    allowlist = allowed_extensions or ALLOWED_EVIDENCE_EXTENSIONS

    if not extension or extension not in allowlist:
        raise ValidationError("File type not allowed")

    return extension

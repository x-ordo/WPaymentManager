from abc import ABC, abstractmethod
from typing import Any, Dict


class FileStoragePort(ABC):
    """Port interface for file storage operations."""

    @abstractmethod
    def generate_upload_url(
        self,
        bucket: str,
        key: str,
        content_type: str,
        expires_in: int = 300
    ) -> Dict[str, Any]:
        """Generate a presigned upload URL."""

    @abstractmethod
    def generate_download_url(
        self,
        bucket: str,
        key: str,
        expires_in: int = 300
    ) -> str:
        """Generate a presigned download URL."""

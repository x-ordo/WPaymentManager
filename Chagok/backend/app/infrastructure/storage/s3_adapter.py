from typing import Any, Dict, Callable

from app.domain.ports.file_storage_port import FileStoragePort
from app.utils.s3 import generate_presigned_upload_url, generate_presigned_download_url


class S3Adapter(FileStoragePort):
    """FileStoragePort implementation backed by S3 utilities."""

    def __init__(
        self,
        upload_url_func: Callable[..., Dict[str, Any]] = generate_presigned_upload_url,
        download_url_func: Callable[..., str] = generate_presigned_download_url
    ) -> None:
        self._upload_url = upload_url_func
        self._download_url = download_url_func

    def generate_upload_url(
        self,
        bucket: str,
        key: str,
        content_type: str,
        expires_in: int = 300
    ) -> Dict[str, Any]:
        return self._upload_url(
            bucket=bucket,
            key=key,
            content_type=content_type,
            expires_in=expires_in
        )

    def generate_download_url(
        self,
        bucket: str,
        key: str,
        expires_in: int = 300
    ) -> str:
        return self._download_url(bucket=bucket, key=key, expires_in=expires_in)

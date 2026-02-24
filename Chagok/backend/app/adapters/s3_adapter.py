from typing import Dict, Any
from app.ports.storage import S3Port
from app.utils import s3 as s3_utils


class S3Adapter(S3Port):
    def generate_presigned_upload_url(
        self,
        bucket: str,
        key: str,
        content_type: str,
        expires_in: int = 300
    ) -> Dict[str, Any]:
        return s3_utils.generate_presigned_upload_url(
            bucket=bucket,
            key=key,
            content_type=content_type,
            expires_in=expires_in
        )

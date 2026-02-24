import boto3
from src.ports.storage import ObjectStoragePort


class S3StorageAdapter(ObjectStoragePort):
    def __init__(self, s3_client=None):
        self._client = s3_client or boto3.client('s3')

    def download_file(self, bucket_name: str, object_key: str, destination: str) -> None:
        self._client.download_file(bucket_name, object_key, destination)

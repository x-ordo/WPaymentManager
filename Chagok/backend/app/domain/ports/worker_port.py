from abc import ABC, abstractmethod
from typing import Dict


class WorkerPort(ABC):
    """Port interface for async worker invocation."""

    @abstractmethod
    def invoke(self, bucket: str, s3_key: str, evidence_id: str, case_id: str) -> Dict:
        """Invoke the async worker to process evidence."""

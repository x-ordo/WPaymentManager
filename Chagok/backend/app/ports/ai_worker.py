from typing import Protocol, Dict, Any


class AiWorkerPort(Protocol):
    def invoke_ai_worker(
        self,
        bucket: str,
        s3_key: str,
        evidence_id: str,
        case_id: str
    ) -> Dict[str, Any]:
        ...

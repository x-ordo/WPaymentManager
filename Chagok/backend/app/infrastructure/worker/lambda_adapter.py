from typing import Dict, Callable

from app.domain.ports.worker_port import WorkerPort
from app.utils.lambda_client import invoke_ai_worker


class LambdaAdapter(WorkerPort):
    """WorkerPort implementation using Lambda invocation utilities."""

    def __init__(self, invoke_func: Callable[..., Dict] = invoke_ai_worker) -> None:
        self._invoke = invoke_func

    def invoke(self, bucket: str, s3_key: str, evidence_id: str, case_id: str) -> Dict:
        return self._invoke(
            bucket=bucket,
            s3_key=s3_key,
            evidence_id=evidence_id,
            case_id=case_id
        )

from typing import Dict, Any
from app.ports.ai_worker import AiWorkerPort
from app.utils.lambda_client import invoke_ai_worker


class AiWorkerAdapter(AiWorkerPort):
    def invoke_ai_worker(
        self,
        bucket: str,
        s3_key: str,
        evidence_id: str,
        case_id: str
    ) -> Dict[str, Any]:
        return invoke_ai_worker(
            bucket=bucket,
            s3_key=s3_key,
            evidence_id=evidence_id,
            case_id=case_id
        )

from typing import Dict, List, Optional, Callable

from app.domain.ports.metadata_store_port import MetadataStorePort
from app.utils.dynamo import (
    get_evidence_by_case,
    clear_case_evidence,
    put_evidence_metadata,
    get_case_fact_summary,
    put_case_fact_summary,
    update_case_fact_summary,
    backup_and_regenerate_fact_summary
)


class DynamoDBAdapter(MetadataStorePort):
    """MetadataStorePort implementation backed by DynamoDB utilities."""

    def __init__(
        self,
        get_evidence_func: Callable[..., List[Dict]] = get_evidence_by_case,
        clear_case_evidence_func: Callable[..., int] = clear_case_evidence,
        put_evidence_func: Callable[..., Dict] = put_evidence_metadata,
        get_case_summary_func: Callable[..., Optional[Dict]] = get_case_fact_summary,
        put_case_summary_func: Callable[..., Dict] = put_case_fact_summary,
        update_case_summary_func: Callable[..., bool] = update_case_fact_summary,
        backup_regenerate_func: Callable[..., Dict] = backup_and_regenerate_fact_summary
    ) -> None:
        self._get_evidence = get_evidence_func
        self._clear_case_evidence = clear_case_evidence_func
        self._put_evidence = put_evidence_func
        self._get_case_summary = get_case_summary_func
        self._put_case_summary = put_case_summary_func
        self._update_case_summary = update_case_summary_func
        self._backup_regenerate = backup_regenerate_func

    def get_evidence_by_case(self, case_id: str) -> List[Dict]:
        return self._get_evidence(case_id)

    def put_evidence(self, evidence_data: Dict) -> Dict:
        return self._put_evidence(evidence_data)

    def get_case_fact_summary(self, case_id: str) -> Optional[Dict]:
        return self._get_case_summary(case_id)

    def put_case_fact_summary(self, summary_data: Dict) -> Dict:
        return self._put_case_summary(summary_data)

    def update_case_fact_summary(
        self,
        case_id: str,
        modified_summary: str,
        modified_by: str
    ) -> bool:
        return self._update_case_summary(case_id, modified_summary, modified_by)

    def backup_and_regenerate_fact_summary(self, case_id: str, summary_data: Dict) -> Dict:
        return self._backup_regenerate(case_id, summary_data)

    def clear_case_evidence(self, case_id: str) -> int:
        return self._clear_case_evidence(case_id)

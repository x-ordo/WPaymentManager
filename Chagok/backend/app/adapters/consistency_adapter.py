from app.ports.consistency import ConsistencyPort
from app.utils.consistency import get_consistency_manager


class ConsistencyAdapter(ConsistencyPort):
    def delete_evidence_with_index(self, case_id: str, evidence_id: str) -> bool:
        consistency_manager = get_consistency_manager()
        return consistency_manager.delete_evidence_with_index(
            case_id=case_id,
            evidence_id=evidence_id
        )

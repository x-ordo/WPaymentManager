from typing import Protocol


class ConsistencyPort(Protocol):
    def delete_evidence_with_index(self, case_id: str, evidence_id: str) -> bool:
        ...

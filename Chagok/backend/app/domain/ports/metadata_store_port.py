from abc import ABC, abstractmethod
from typing import Dict, List, Optional


class MetadataStorePort(ABC):
    """Port interface for evidence and case summary storage."""

    @abstractmethod
    def get_evidence_by_case(self, case_id: str) -> List[Dict]:
        """Fetch evidence metadata for a case."""

    @abstractmethod
    def put_evidence(self, evidence_data: Dict) -> Dict:
        """Store evidence metadata."""

    @abstractmethod
    def get_case_fact_summary(self, case_id: str) -> Optional[Dict]:
        """Fetch stored case fact summary."""

    @abstractmethod
    def put_case_fact_summary(self, summary_data: Dict) -> Dict:
        """Store a case fact summary."""

    @abstractmethod
    def update_case_fact_summary(
        self,
        case_id: str,
        modified_summary: str,
        modified_by: str
    ) -> bool:
        """Update a case fact summary."""

    @abstractmethod
    def backup_and_regenerate_fact_summary(self, case_id: str, summary_data: Dict) -> Dict:
        """Backup and replace a case fact summary."""

    @abstractmethod
    def clear_case_evidence(self, case_id: str) -> int:
        """Delete all evidence metadata for a case."""

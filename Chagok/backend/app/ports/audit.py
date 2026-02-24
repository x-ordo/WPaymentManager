from typing import Protocol, Optional
from sqlalchemy.orm import Session
from app.db.models import AuditLog
from app.db.schemas import AuditAction


class AuditPort(Protocol):
    def log_audit_event(
        self,
        db: Session,
        user_id: str,
        action: AuditAction,
        object_id: Optional[str] = None
    ) -> AuditLog:
        ...

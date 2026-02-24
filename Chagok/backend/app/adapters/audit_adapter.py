from typing import Optional
from sqlalchemy.orm import Session
from app.db.models import AuditLog
from app.db.schemas import AuditAction
from app.ports.audit import AuditPort
from app.utils.audit import log_audit_event


class AuditAdapter(AuditPort):
    def log_audit_event(
        self,
        db: Session,
        user_id: str,
        action: AuditAction,
        object_id: Optional[str] = None
    ) -> AuditLog:
        return log_audit_event(
            db=db,
            user_id=user_id,
            action=action,
            object_id=object_id
        )

from datetime import datetime
from typing import Dict, Optional
from uuid import uuid4

from app.schemas import IntakeData, IntakeRecord


class IntakeStore:
    """In-memory intake store for the MVP."""

    def __init__(self) -> None:
        self._store: Dict[str, IntakeRecord] = {}

    def create(self, payload: IntakeData, user_id: Optional[str] = None) -> IntakeRecord:
        record = IntakeRecord(
            id=str(uuid4()),
            user_id=user_id,
            payload=payload,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self._store[record.id] = record
        return record

    def get(self, intake_id: str) -> Optional[IntakeRecord]:
        return self._store.get(intake_id)

    def list(self) -> Dict[str, IntakeRecord]:
        return self._store

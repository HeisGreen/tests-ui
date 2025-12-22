from app.database import get_db
from app.models import Document
from app.schemas import DocumentResponse
import json

db = next(get_db())
doc = db.query(Document).first()
if doc:
    print('Raw uploaded_at:', doc.uploaded_at)
    print('Type:', type(doc.uploaded_at))
    resp = DocumentResponse.model_validate(doc)
    print('Model dump:', resp.model_dump())
    print('JSON serialized:', json.dumps(resp.model_dump(), default=str))

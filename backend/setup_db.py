"""
Database setup script
Run this script to create the database tables.
Alternatively, tables are created automatically when the FastAPI app starts.
"""
from app.database import engine, Base
from app.models import (
    User, UserProfile, Recommendation, Document, ChecklistProgress, ChecklistCache,
    TravelAgentProfile, Conversation, Message
)
from app.migrations import ensure_role_column

if __name__ == "__main__":
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    ensure_role_column(engine)
    print("Database tables created successfully!")
    print("\nTables created:")
    print("  - users (with role field)")
    print("  - user_profiles")
    print("  - recommendations")
    print("  - documents")
    print("  - checklist_progress")
    print("  - checklist_cache")
    print("  - travel_agent_profiles (NEW)")
    print("  - conversations (NEW)")
    print("  - messages (NEW)")
    print("\nIf you already have data, rerunning this script now adds the 'role' column automatically.")

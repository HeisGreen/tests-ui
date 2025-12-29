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

if __name__ == "__main__":
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
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
    print("\nNote: If you have existing data, you may need to:")
    print("  1. Add 'role' column to existing users table (defaults to 'USER')")
    print("  2. Run: ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'USER';")

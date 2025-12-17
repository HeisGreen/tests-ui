"""
Database setup script
Run this script to create the database tables.
Alternatively, tables are created automatically when the FastAPI app starts.
"""
from app.database import engine, Base
from app.models import User

if __name__ == "__main__":
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

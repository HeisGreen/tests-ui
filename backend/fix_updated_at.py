"""
Fix the updated_at column to have a default value
"""
from sqlalchemy import text
from app.database import engine

def fix_updated_at():
    """Add default value to updated_at column"""
    with engine.connect() as conn:
        try:
            # Set default value for updated_at
            conn.execute(text("ALTER TABLE documents ALTER COLUMN updated_at SET DEFAULT NOW();"))
            conn.commit()
            print("✓ Set default value for updated_at column")
        except Exception as e:
            print(f"✗ Error: {e}")
            conn.rollback()
        
        print("\nFix completed!")

if __name__ == "__main__":
    fix_updated_at()

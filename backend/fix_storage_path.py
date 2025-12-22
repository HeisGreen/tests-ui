"""
Fix the storage_path column issue in documents table
"""
from sqlalchemy import text
from app.database import engine

def fix_storage_path():
    """Make storage_path nullable or drop it since we're using file_path"""
    with engine.connect() as conn:
        # Check if storage_path column exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'documents' 
                AND column_name = 'storage_path'
            );
        """))
        column_exists = result.scalar()
        
        if column_exists:
            print("Found storage_path column. Making it nullable...")
            try:
                # First, make it nullable
                conn.execute(text("ALTER TABLE documents ALTER COLUMN storage_path DROP NOT NULL;"))
                conn.commit()
                print("  ✓ Made storage_path nullable")
                
                # Optionally, you can drop it entirely since we're using file_path
                # Uncomment the next two lines if you want to remove it:
                # conn.execute(text("ALTER TABLE documents DROP COLUMN storage_path;"))
                # conn.commit()
                # print("  ✓ Dropped storage_path column")
                
            except Exception as e:
                print(f"  ✗ Error: {e}")
                conn.rollback()
        else:
            print("storage_path column doesn't exist. No action needed.")
        
        print("\nFix completed!")

if __name__ == "__main__":
    fix_storage_path()

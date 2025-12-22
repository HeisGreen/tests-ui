"""
Migration script to add the documents table and update existing schema
Run this if you get "column documents.type does not exist" error
"""
from sqlalchemy import text
from app.database import engine

def migrate_documents_table():
    """Add documents table if it doesn't exist, or add missing columns"""
    with engine.connect() as conn:
        # Check if documents table exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'documents'
            );
        """))
        table_exists = result.scalar()
        
        if not table_exists:
            print("Creating documents table...")
            conn.execute(text("""
                CREATE TABLE documents (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    name VARCHAR NOT NULL,
                    type VARCHAR,
                    file_url VARCHAR NOT NULL,
                    file_path VARCHAR NOT NULL,
                    size VARCHAR,
                    status VARCHAR NOT NULL DEFAULT 'pending',
                    visa_id INTEGER,
                    description TEXT,
                    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            conn.execute(text("CREATE INDEX ix_documents_user_id ON documents(user_id);"))
            conn.commit()
            print("Documents table created successfully!")
        else:
            print("Documents table exists. Checking for missing columns...")
            # Check and add missing columns
            columns_to_add = {
                'type': 'VARCHAR',
                'file_url': 'VARCHAR NOT NULL',
                'file_path': 'VARCHAR NOT NULL',
                'size': 'VARCHAR',
                'status': "VARCHAR NOT NULL DEFAULT 'pending'",
                'visa_id': 'INTEGER',
                'description': 'TEXT',
                'uploaded_at': 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
                'updated_at': 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
            }
            
            for column_name, column_def in columns_to_add.items():
                result = conn.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND table_name = 'documents' 
                        AND column_name = '{column_name}'
                    );
                """))
                column_exists = result.scalar()
                
                if not column_exists:
                    print(f"Adding column: {column_name}...")
                    try:
                        conn.execute(text(f"ALTER TABLE documents ADD COLUMN {column_name} {column_def};"))
                        conn.commit()
                        print(f"  ✓ Added column: {column_name}")
                    except Exception as e:
                        print(f"  ✗ Error adding column {column_name}: {e}")
                        conn.rollback()
                else:
                    print(f"  ✓ Column {column_name} already exists")
        
        print("\nMigration completed!")

if __name__ == "__main__":
    migrate_documents_table()

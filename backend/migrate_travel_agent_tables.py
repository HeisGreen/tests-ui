"""
Migration script to add travel agent feature tables and update users table
Run this if you have existing data and need to add the new tables/columns
"""
from sqlalchemy import text
from app.database import engine

def migrate_travel_agent_tables():
    """Add travel agent tables and update users table with role column"""
    with engine.connect() as conn:
        # Add role column to users table if it doesn't exist
        print("Checking users table for role column...")
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND column_name = 'role'
            );
        """))
        role_exists = result.scalar()
        
        if not role_exists:
            print("Adding 'role' column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN role VARCHAR DEFAULT 'USER' NOT NULL;
            """))
            conn.commit()
            print("✓ Role column added to users table")
        else:
            print("✓ Role column already exists")
        
        # Create travel_agent_profiles table
        print("\nChecking for travel_agent_profiles table...")
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'travel_agent_profiles'
            );
        """))
        table_exists = result.scalar()
        
        if not table_exists:
            print("Creating travel_agent_profiles table...")
            conn.execute(text("""
                CREATE TABLE travel_agent_profiles (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
                    onboarding_data JSONB,
                    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            conn.execute(text("CREATE INDEX ix_travel_agent_profiles_user_id ON travel_agent_profiles(user_id);"))
            conn.execute(text("CREATE INDEX ix_travel_agent_profiles_is_verified ON travel_agent_profiles(is_verified);"))
            conn.commit()
            print("✓ travel_agent_profiles table created")
        else:
            print("✓ travel_agent_profiles table already exists")
        
        # Create conversations table
        print("\nChecking for conversations table...")
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'conversations'
            );
        """))
        table_exists = result.scalar()
        
        if not table_exists:
            print("Creating conversations table...")
            conn.execute(text("""
                CREATE TABLE conversations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    agent_id INTEGER NOT NULL REFERENCES users(id),
                    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            conn.execute(text("CREATE INDEX ix_conversations_user_id ON conversations(user_id);"))
            conn.execute(text("CREATE INDEX ix_conversations_agent_id ON conversations(agent_id);"))
            conn.execute(text("CREATE INDEX ix_conversations_last_message_at ON conversations(last_message_at);"))
            conn.commit()
            print("✓ conversations table created")
        else:
            print("✓ conversations table already exists")
        
        # Create messages table
        print("\nChecking for messages table...")
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'messages'
            );
        """))
        table_exists = result.scalar()
        
        if not table_exists:
            print("Creating messages table...")
            conn.execute(text("""
                CREATE TABLE messages (
                    id SERIAL PRIMARY KEY,
                    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
                    sender_id INTEGER NOT NULL REFERENCES users(id),
                    content TEXT NOT NULL,
                    is_read BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            conn.execute(text("CREATE INDEX ix_messages_conversation_id ON messages(conversation_id);"))
            conn.execute(text("CREATE INDEX ix_messages_sender_id ON messages(sender_id);"))
            conn.execute(text("CREATE INDEX ix_messages_is_read ON messages(is_read);"))
            conn.execute(text("CREATE INDEX ix_messages_created_at ON messages(created_at);"))
            conn.commit()
            print("✓ messages table created")
        else:
            print("✓ messages table already exists")
        
        print("\n✅ Migration completed successfully!")
        print("\nAll travel agent feature tables are ready to use.")

if __name__ == "__main__":
    try:
        migrate_travel_agent_tables()
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()


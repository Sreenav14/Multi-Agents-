from sqlalchemy import text
from app.db.session import engine

# Add chat_id column to runs table
with engine.connect() as conn:
    # Check if column exists first
    result = conn.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='runs' AND column_name='chat_id'
    """))
    
    if result.fetchone() is None:
        # Column doesn't exist, add it
        conn.execute(text("ALTER TABLE runs ADD COLUMN chat_id INTEGER"))
        conn.execute(text("""
            ALTER TABLE runs 
            ADD CONSTRAINT fk_runs_chat_id 
            FOREIGN KEY (chat_id) REFERENCES chats(id)
        """))
        conn.commit()
        print("✅ Added chat_id column to runs table")
    else:
        print("✅ chat_id column already exists")
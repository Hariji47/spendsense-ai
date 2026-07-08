import sqlite3
import os
import sys

# We also need passlib and bcrypt to hash a default user password
try:
    from passlib.context import CryptContext
except ImportError:
    print("passlib not installed, please pip install passlib[bcrypt] first")
    sys.exit(1)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db_path = os.path.join(os.path.dirname(__file__), "spendsense.db")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR UNIQUE NOT NULL,
            hashed_password VARCHAR NOT NULL,
            full_name VARCHAR NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Check if a user exists, if not, create one
    cursor.execute("SELECT id FROM users WHERE email='user@spendsense.ai'")
    user = cursor.fetchone()
    
    if not user:
        hashed_pw = pwd_context.hash("password")
        cursor.execute("INSERT INTO users (email, hashed_password, full_name) VALUES (?, ?, ?)", 
                       ('user@spendsense.ai', hashed_pw, 'Demo User'))
        user_id = cursor.lastrowid
        print(f"Created default user: user@spendsense.ai / password (id: {user_id})")
    else:
        user_id = user[0]
        print(f"Default user already exists (id: {user_id})")
        
    # 2. Alter transactions table
    try:
        cursor.execute("ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id)")
        print("Added user_id to transactions table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("user_id already exists in transactions")
        else:
            print(f"Error altering transactions: {e}")
            
    # Assign existing transactions to this user
    cursor.execute("UPDATE transactions SET user_id = ? WHERE user_id IS NULL", (user_id,))
    
    # 3. Alter settings table
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN user_id INTEGER REFERENCES users(id)")
        print("Added user_id to settings table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("user_id already exists in settings")
        else:
            print(f"Error altering settings: {e}")
            
    # Assign existing settings to this user
    cursor.execute("UPDATE settings SET user_id = ? WHERE user_id IS NULL", (user_id,))
    
    conn.commit()
    print("Migration completed successfully.")
    
except Exception as e:
    print(f"Migration failed: {e}")
finally:
    conn.close()

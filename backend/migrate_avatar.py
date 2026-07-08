import sqlite3

def upgrade():
    conn = sqlite3.connect('spendsense.db')
    cursor = conn.cursor()
    
    print("Checking if profile_picture column exists...")
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'profile_picture' not in columns:
        print("Adding profile_picture column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN profile_picture VARCHAR DEFAULT NULL")
    
    conn.commit()
    conn.close()
    print("Migration successful.")

if __name__ == "__main__":
    upgrade()

import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "spendsense.db")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE settings ADD COLUMN yearly_budget FLOAT DEFAULT 600000.0")
    conn.commit()
    print("Migration successful.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Column already exists. Migration skipped.")
    else:
        print(f"Migration failed: {e}")
finally:
    conn.close()

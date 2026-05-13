import sqlite3
import os

db_path = r"c:\Users\DELL\OneDrive\Desktop\Stock\backend\stockmanager.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in database:", [t[0] for t in tables])
    
    if ('users',) in tables:
        cursor.execute("PRAGMA table_info(users);")
        columns = cursor.fetchall()
        print("Columns in 'users' table:", [c[1] for c in columns])
    else:
        print("'users' table does NOT exist!")
    conn.close()

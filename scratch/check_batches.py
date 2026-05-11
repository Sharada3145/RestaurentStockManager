import sqlite3
import os

db_path = 'backend/stockmanager.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='daily_stock_batches';")
    if not cursor.fetchone():
        print("Table daily_stock_batches does not exist")
    else:
        cursor.execute("SELECT * FROM daily_stock_batches")
        rows = cursor.fetchall()
        print(f"Total batches: {len(rows)}")
        for row in rows:
            print(row)
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

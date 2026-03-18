"""
Grant admin role to a user by their email address in the SQLite database.
Run this script from the backend/ directory:

  venv\Scripts\python.exe scripts/grant_admin.py your@email.com
"""

import sys
import sqlite3
import os

def grant_admin(email: str):
    db_path = os.path.abspath("data/hscode.db")
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    
    # Find the user
    row = conn.execute("SELECT id, email, role FROM users WHERE email = ?", (email,)).fetchone()
    if not row:
        print(f"No user found with email: {email}")
        print("Available users:")
        for u in conn.execute("SELECT email, role FROM users").fetchall():
            print(f"  - {u[0]} (role: {u[1]})")
        conn.close()
        return

    user_id, db_email, current_role = row
    if current_role == "admin":
        print(f"✅ {db_email} is already an admin.")
        conn.close()
        return

    conn.execute("UPDATE users SET role = 'admin' WHERE id = ?", (user_id,))
    conn.commit()
    print(f"✅ Granted admin role to {db_email}")
    conn.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/grant_admin.py your@email.com")
        sys.exit(1)
    grant_admin(sys.argv[1])

"""
Fix admin@example.com: promote the real Firebase user row to admin,
delete the fake seeded row that has firebase_uid='admin'.
"""
import sqlite3

DB_PATH = "data/hscode.db"
EMAIL = "admin@example.com"
FAKE_UID = "admin"

db = sqlite3.connect(DB_PATH)

# Show current state
rows = db.execute("SELECT email, role, firebase_uid FROM users WHERE email=?", (EMAIL,)).fetchall()
print("Before:")
for r in rows:
    print(f"  email={r[0]!r:30} role={r[1]!r:10} firebase_uid={r[2]!r}")

# Promote all real rows (non-fake uid) to admin
affected = db.execute(
    "UPDATE users SET role='admin' WHERE email=? AND firebase_uid != ?",
    (EMAIL, FAKE_UID)
).rowcount
print(f"\nPromoted {affected} real Firebase row(s) to admin.")

# Delete the fake seeded row
deleted = db.execute(
    "DELETE FROM users WHERE email=? AND firebase_uid=?",
    (EMAIL, FAKE_UID)
).rowcount
print(f"Deleted {deleted} fake seeded row(s).")

db.commit()

# Confirm
rows = db.execute("SELECT email, role, firebase_uid FROM users WHERE email=?", (EMAIL,)).fetchall()
print("\nAfter:")
for r in rows:
    print(f"  email={r[0]!r:30} role={r[1]!r:10} firebase_uid={r[2]!r}")

db.close()
print("\nDone.")

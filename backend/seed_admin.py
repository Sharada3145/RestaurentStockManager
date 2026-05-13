from backend.database import SessionLocal
from backend.models import User
from backend.utils.auth import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@stockiq.com").first()
        if not admin:
            admin = User(
                email="admin@stockiq.com",
                password_hash=get_password_hash("admin123"),
                name="Executive Admin",
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("Admin user created successfully!")
        else:
            # Update password just in case
            admin.password_hash = get_password_hash("admin123")
            admin.role = "admin"
            db.commit()
            print("Admin user updated successfully!")
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()

#!/usr/bin/env python3
"""
Script to create an admin user for the LCJ system
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_root = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_root))

from sqlalchemy.orm import Session
from core.database_singleton import get_db_session
from auth_service.app.models.user import User
from auth_service.app.utils.jwt import get_password_hash
import uuid

def create_admin_user():
    """Create admin user with credentials admin@admin.com / admin@123"""
    
    # Create database session using context manager
    with get_db_session() as db:
        try:
            # Check if admin user already exists
            existing_admin = db.query(User).filter(User.email == "admin@admin.com").first()
            if existing_admin:
                print("Admin user already exists!")
                print(f"Email: {existing_admin.email}")
                print(f"Role: {existing_admin.role}")
                print(f"Active: {existing_admin.is_active}")
                return existing_admin
            
            # Create new admin user
            admin_user = User(
                id=uuid.uuid4(),
                email="admin@admin.com",
                username="admin",
                password_hash=get_password_hash("admin@123"),
                is_active=True,
                is_verified=True,  # Skip email verification for admin
                role="admin",
                providers=["password"]
            )
            
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            print("✅ Admin user created successfully!")
            print(f"Email: {admin_user.email}")
            print(f"Password: admin@123")
            print(f"Role: {admin_user.role}")
            print(f"User ID: {admin_user.id}")
            
            return admin_user
            
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            db.rollback()
            raise

if __name__ == "__main__":
    print("Creating admin user...")
    create_admin_user()
    print("Done!")


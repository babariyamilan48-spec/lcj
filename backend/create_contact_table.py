#!/usr/bin/env python3
"""
Script to create the contact table in the database
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_root = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_root))

from sqlalchemy import text
from contact_service.app.models.contact import Base
from core.database_fixed import db_manager
# engine = db_manager.engine

def create_contact_table():
    """Create the contact table"""
    try:
        print("Creating contact table...")
        
        # Create the table using SQLAlchemy
        Base.metadata.create_all(bind=engine)
        
        print("✓ Contact table created successfully!")
        
        # Verify the table was created
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name = 'contacts'"))
            if result.fetchone():
                print("✓ Contact table verified in database")
            else:
                print("✗ Contact table not found in database")
                
    except Exception as e:
        print(f"✗ Error creating contact table: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Contact Table Creation Script")
    print("=" * 40)
    
    success = create_contact_table()
    
    if success:
        print("\n✓ Contact service database setup completed successfully!")
    else:
        print("\n✗ Contact service database setup failed!")
        sys.exit(1)

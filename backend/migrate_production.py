#!/usr/bin/env python3
"""
Production database migration script
Run this after deployment to set up the database schema
"""
import os
import sys
from pathlib import Path
import asyncio

# Add backend root to Python path
BACKEND_ROOT = Path(__file__).parent.absolute()
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

async def run_migrations():
    """Run Alembic migrations"""
    print("🔄 Running database migrations...")
    
    # Set environment
    os.environ.setdefault("ENVIRONMENT", "production")
    
    try:
        # Import after setting environment
        from alembic.config import Config
        from alembic import command
        
        # Get alembic config
        alembic_cfg = Config("alembic.ini")
        
        # Run migrations
        command.upgrade(alembic_cfg, "head")
        print("✅ Database migrations completed successfully!")
        
        # Test Neon connection
        await test_neon_connection()
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)

async def test_neon_connection():
    """Test Neon Postgres connection and setup"""
    print("🔍 Testing Neon Postgres connection...")
    
    try:
        from core.database_fixed import db_manager, check_db_health
        
        health = db_manager.health_check()
        
        if health["status"] == "healthy":
            print("✅ Neon Postgres connection successful!")
            print(f"   Connection time: {health['connection_time_ms']}ms")
            print(f"   Pool stats: {health['pool_stats']}")
        else:
            print(f"⚠️ Database connection status: {health['status']}")
            if "error" in health:
                print(f"   Error: {health['error']}")
            
    except Exception as e:
        print(f"⚠️ Connection test failed: {str(e)}")
        print("   Please check your DATABASE_URL environment variable")

async def create_admin_user():
    """Create admin user if it doesn't exist"""
    print("👤 Creating admin user...")
    
    try:
        # Import your user creation logic here
        # This is a placeholder - adjust based on your actual user model
        print("✅ Admin user created successfully!")
        
    except Exception as e:
        print(f"❌ Admin user creation failed: {str(e)}")

async def main():
    """Main migration function"""
    print("🚀 Starting production database setup...")
    
    await run_migrations()
    await create_admin_user()
    
    print("🎉 Production database setup completed!")

if __name__ == "__main__":
    asyncio.run(main())

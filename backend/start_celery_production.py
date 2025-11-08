#!/usr/bin/env python3
"""
Production Celery worker startup script for Render deployment
"""
import os
import sys
from pathlib import Path

# Add backend root to Python path
BACKEND_ROOT = Path(__file__).parent.absolute()
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

def main():
    """Start the Celery worker in production mode"""
    # Set environment
    os.environ.setdefault("ENVIRONMENT", "production")
    
    print("🚀 Starting Celery Worker in production mode...")
    print(f"🌍 Environment: {os.environ.get('ENVIRONMENT', 'production')}")
    print(f"🔗 Broker URL: {os.environ.get('CELERY_BROKER_URL', 'Not set')}")
    
    # Import Celery app
    from core.celery_app import celery_app
    
    # Start worker with production settings
    celery_app.worker_main([
        'worker',
        '--loglevel=info',
        '--concurrency=2',
        '--max-tasks-per-child=1000',
        '--time-limit=300',
        '--soft-time-limit=240'
    ])

if __name__ == "__main__":
    main()

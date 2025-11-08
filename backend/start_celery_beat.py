#!/usr/bin/env python3
"""
Celery beat scheduler startup script for Life Changing Journey backend.
This script starts Celery beat for scheduled tasks (if needed in the future).
"""

import os
import sys
import subprocess
from pathlib import Path

def start_celery_beat():
    """Start Celery beat scheduler in production mode"""
    
    # Add the backend directory to Python path
    backend_dir = Path(__file__).parent
    sys.path.insert(0, str(backend_dir))
    
    # Set environment variables
    os.environ.setdefault("ENVIRONMENT", "production")
    if not os.getenv('PYTHONPATH'):
        os.environ['PYTHONPATH'] = str(backend_dir)
    
    print("🚀 Starting Celery Beat Scheduler in production mode...")
    print(f"🌍 Environment: {os.environ.get('ENVIRONMENT', 'production')}")
    print(f"🔗 Broker URL: {os.environ.get('CELERY_BROKER_URL', 'Not set')}")
    
    # Import and start beat scheduler directly
    from core.celery_app import celery_app
    
    try:
        # Start the Celery beat scheduler with production settings
        celery_app.start([
            'celery',
            'beat',
            '--loglevel=info',
            '--schedule=/tmp/celerybeat-schedule',
            '--pidfile=/tmp/celerybeat.pid'
        ])
    except KeyboardInterrupt:
        print("\nStopping Celery beat scheduler...")
    except Exception as e:
        print(f"Error starting Celery beat: {e}")
        sys.exit(1)

if __name__ == '__main__':
    start_celery_beat()

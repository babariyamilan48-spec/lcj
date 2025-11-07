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
    """Start Celery beat scheduler"""
    
    # Add the backend directory to Python path
    backend_dir = Path(__file__).parent
    sys.path.insert(0, str(backend_dir))
    
    # Set environment variables if not already set
    if not os.getenv('PYTHONPATH'):
        os.environ['PYTHONPATH'] = str(backend_dir)
    
    # Celery beat command
    cmd = [
        'celery',
        '-A', 'core.celery_app:celery_app',
        'beat',
        '--loglevel=info',
        '--schedule=/tmp/celerybeat-schedule',
        '--pidfile=/tmp/celerybeat.pid'
    ]
    
    print("Starting Celery beat scheduler...")
    print(f"Command: {' '.join(cmd)}")
    print("Press Ctrl+C to stop the scheduler")
    
    try:
        # Start the Celery beat scheduler
        subprocess.run(cmd, cwd=backend_dir)
    except KeyboardInterrupt:
        print("\nStopping Celery beat scheduler...")
    except Exception as e:
        print(f"Error starting Celery beat: {e}")
        sys.exit(1)

if __name__ == '__main__':
    start_celery_beat()

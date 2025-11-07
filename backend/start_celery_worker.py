#!/usr/bin/env python3
"""
Celery worker startup script for Life Changing Journey backend.
This script starts Celery workers to process background tasks.
"""

import os
import sys
import subprocess
from pathlib import Path

def start_celery_worker():
    """Start Celery worker with appropriate configuration"""
    
    # Add the backend directory to Python path
    backend_dir = Path(__file__).parent
    sys.path.insert(0, str(backend_dir))
    
    # Set environment variables if not already set
    if not os.getenv('PYTHONPATH'):
        os.environ['PYTHONPATH'] = str(backend_dir)
    
    # Celery worker command (optimized for Windows)
    cmd = [
        'python', '-m', 'celery',
        '-A', 'core.celery_app:celery_app',
        'worker',
        '--loglevel=info',
        '--concurrency=2',  # Reduced for Windows stability
        '--pool=solo',      # Use solo pool for Windows compatibility
        '--queues=default,ai_reports,pdf_generation',
        '--hostname=worker@%h',
        '--without-gossip',
        '--without-mingle',
        '--without-heartbeat'
    ]
    
    print("Starting Celery worker...")
    print(f"Command: {' '.join(cmd)}")
    print("Press Ctrl+C to stop the worker")
    
    try:
        # Start the Celery worker
        subprocess.run(cmd, cwd=backend_dir)
    except KeyboardInterrupt:
        print("\nStopping Celery worker...")
    except Exception as e:
        print(f"Error starting Celery worker: {e}")
        sys.exit(1)

if __name__ == '__main__':
    start_celery_worker()

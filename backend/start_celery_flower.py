#!/usr/bin/env python3
"""
Celery Flower monitoring startup script for Life Changing Journey backend.
This script starts Flower web UI for monitoring Celery tasks.
"""

import os
import sys
import subprocess
from pathlib import Path

def start_celery_flower():
    """Start Celery Flower monitoring interface"""
    
    # Add the backend directory to Python path
    backend_dir = Path(__file__).parent
    sys.path.insert(0, str(backend_dir))
    
    # Set environment variables if not already set
    if not os.getenv('PYTHONPATH'):
        os.environ['PYTHONPATH'] = str(backend_dir)
    
    # Celery flower command
    cmd = [
        'celery',
        '-A', 'core.celery_app:celery_app',
        'flower',
        '--port=5555',
        '--broker=redis://localhost:6379/0',
        '--basic_auth=admin:admin123',  # Change these credentials in production
        '--url_prefix=flower'
    ]
    
    print("Starting Celery Flower monitoring interface...")
    print(f"Command: {' '.join(cmd)}")
    print("Flower will be available at: http://localhost:5555/flower")
    print("Default credentials: admin / admin123")
    print("Press Ctrl+C to stop Flower")
    
    try:
        # Start Celery Flower
        subprocess.run(cmd, cwd=backend_dir)
    except KeyboardInterrupt:
        print("\nStopping Celery Flower...")
    except Exception as e:
        print(f"Error starting Celery Flower: {e}")
        print("Note: You may need to install flower: pip install flower")
        sys.exit(1)

if __name__ == '__main__':
    start_celery_flower()

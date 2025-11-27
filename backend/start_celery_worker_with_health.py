#!/usr/bin/env python3
"""
Start both Celery worker AND health check server.
This allows the Celery worker to be accessible via HTTP for health checks.
Uses separate processes to avoid blocking.
"""

import os
import sys
import subprocess
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))

if __name__ == '__main__':
    print("=" * 60)
    print("Starting Celery Worker with Health Check Server")
    print("=" * 60)
    
    # Start health server as a separate subprocess
    print("🚀 Starting Health Check Server...")
    health_process = subprocess.Popen(
        [sys.executable, 'celery_health_server.py'],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    print(f"✅ Health server started (PID: {health_process.pid})")
    
    # Give health server time to start
    import time
    time.sleep(2)
    
    # Start Celery worker in main process
    print("🚀 Starting Celery Worker...")
    
    # Set environment variables
    if not os.getenv('PYTHONPATH'):
        os.environ['PYTHONPATH'] = str(BACKEND_DIR)
    
    # Celery worker command
    cmd = [
        sys.executable, '-m', 'celery',
        '-A', 'core.celery_app:celery_app',
        'worker',
        '--loglevel=info',
        '--concurrency=2',
        '--pool=solo',
        '--queues=default,ai_reports,pdf_generation',
        '--hostname=worker@%h',
        '--without-gossip',
        '--without-mingle',
        '--without-heartbeat'
    ]
    
    print(f"Command: {' '.join(cmd)}")
    print("=" * 60)
    
    try:
        # Start Celery worker (this will block)
        subprocess.run(cmd, cwd=BACKEND_DIR)
    except KeyboardInterrupt:
        print("\n⏹️  Stopping services...")
        health_process.terminate()
        health_process.wait()
    except Exception as e:
        print(f"❌ Error starting Celery worker: {e}")
        health_process.terminate()
        sys.exit(1)

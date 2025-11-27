#!/usr/bin/env python3
"""
Start both Celery worker AND health check server.
This allows the Celery worker to be accessible via HTTP for health checks.
"""

import os
import sys
import subprocess
import threading
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))

def start_health_server():
    """Start the FastAPI health check server in a separate thread"""
    print("🚀 Starting Celery Health Check Server...")
    try:
        # Import and run the health server
        from celery_health_server import app
        import uvicorn
        
        port = int(os.getenv("PORT", 10000))
        print(f"✅ Health server listening on port {port}")
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Error starting health server: {e}")
        sys.exit(1)

def start_celery_worker():
    """Start the Celery worker in the main thread"""
    print("🚀 Starting Celery Worker...")
    
    # Celery worker command
    cmd = [
        'python', '-m', 'celery',
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
    
    try:
        subprocess.run(cmd, cwd=BACKEND_DIR)
    except KeyboardInterrupt:
        print("\n⏹️  Stopping Celery worker...")
    except Exception as e:
        print(f"❌ Error starting Celery worker: {e}")
        sys.exit(1)

if __name__ == '__main__':
    print("=" * 60)
    print("Starting Celery Worker with Health Check Server")
    print("=" * 60)
    
    # Start health server in a background thread
    health_thread = threading.Thread(target=start_health_server, daemon=True)
    health_thread.start()
    
    # Give health server time to start
    import time
    time.sleep(2)
    
    # Start Celery worker in main thread
    start_celery_worker()

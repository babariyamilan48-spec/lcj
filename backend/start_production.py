#!/usr/bin/env python3
"""
Production server startup script for Render deployment
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add backend root to Python path
BACKEND_ROOT = Path(__file__).parent.absolute()
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

def main():
    """Start the production server"""
    # Set environment
    os.environ.setdefault("ENVIRONMENT", "production")
    
    # Import after setting environment
    from main import app
    
    # Get port from environment (Render sets PORT automatically)
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"
    
    print(f"🚀 Starting LCJ API Server in production mode...")
    print(f"📍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🌍 Environment: {os.environ.get('ENVIRONMENT', 'production')}")
    
    # Run with production settings
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True,
        use_colors=False,
        loop="asyncio"
    )

if __name__ == "__main__":
    main()

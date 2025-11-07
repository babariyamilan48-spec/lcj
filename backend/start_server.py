#!/usr/bin/env python3
"""
LCJ Career Assessment System - Unified Server Startup Script
This script starts all services on port 8000 for frontend integration.
"""

import os
import sys
import uvicorn

def main():
    # Ensure we're in the backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    print("🌟 Starting LCJ Career Assessment System - Unified API Server")
    print("=" * 60)
    print(f"📂 Backend Directory: {backend_dir}")
    print("🌐 Server URL: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("💚 Health Check: http://localhost:8000/health")
    print("=" * 60)
    print("🔧 Service Endpoints:")
    print("   • Authentication: /api/v1/auth")
    print("   • Questions: /api/v1/questions")
    print("   • Results: /api/v1/results")
    print("   • Contact: /api/v1/contact")
    print("=" * 60)
    print("🚀 Starting server... (Press Ctrl+C to stop)")
    print()
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

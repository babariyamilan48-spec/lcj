#!/usr/bin/env python3
"""
Lightweight FastAPI server for Celery worker health checks.
This runs on the Celery worker service to provide HTTP health endpoints.
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add backend directory to path
BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="Celery Worker Health Check",
    description="Health check endpoint for Celery worker",
    version="1.0.0"
)

# Add CORS middleware to handle OPTIONS requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for health checks
    allow_credentials=True,
    allow_methods=["GET", "HEAD", "OPTIONS"],  # Allow these methods
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """⚡ Ultra-fast health check endpoint"""
    return {
        "status": "healthy",
        "service": "celery-worker",
        "timestamp": datetime.now().isoformat()
    }


@app.head("/health")
async def health_check_head():
    """HEAD request support for load balancers"""
    return {}


@app.options("/health")
async def health_check_options():
    """OPTIONS request support for CORS preflight"""
    return {}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "healthy",
        "service": "celery-worker",
        "message": "Celery worker is running"
    }


@app.head("/")
async def root_head():
    """HEAD request support"""
    return {}


@app.options("/")
async def root_options():
    """OPTIONS request support for CORS preflight"""
    return {}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 10000))
    
    print(f"Starting Celery Health Check Server on port {port}...")
    print(f"Health check endpoint: http://localhost:{port}/health")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

#!/usr/bin/env python3
"""
Test Firebase credentials setup
Run this to diagnose Firebase configuration issues
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

# Load .env file
dotenv_path = find_dotenv(filename=".env", usecwd=True)
print(f"📁 Looking for .env at: {dotenv_path}")
if dotenv_path:
    print(f"✅ Found .env at: {dotenv_path}")
    load_dotenv(dotenv_path)
else:
    print("❌ .env file not found")

# Check environment variable
env_value = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
print(f"\n📋 GOOGLE_APPLICATION_CREDENTIALS value:")
if env_value:
    print(f"   First 100 chars: {env_value[:100]}")
    print(f"   Total length: {len(env_value)} chars")
else:
    print("   ❌ NOT SET")

# Check if it's a file path
if env_value:
    p = Path(env_value).resolve()
    print(f"\n📂 Checking if it's a file path:")
    print(f"   Path: {p}")
    print(f"   Exists: {p.exists()}")

# Check if it's JSON
if env_value:
    import json
    print(f"\n📄 Checking if it's JSON:")
    try:
        json_data = json.loads(env_value)
        print(f"   ✅ Valid JSON")
        print(f"   Type: {json_data.get('type')}")
        print(f"   Project ID: {json_data.get('project_id')}")
        print(f"   Client Email: {json_data.get('client_email')}")
    except json.JSONDecodeError as e:
        print(f"   ❌ Invalid JSON: {e}")

# Check backend/credential.json
backend_root = Path(__file__).resolve().parent
default_path = backend_root / "credential.json"
print(f"\n📂 Checking backend/credential.json:")
print(f"   Path: {default_path}")
print(f"   Exists: {default_path.exists()}")

# Try Firebase initialization
print(f"\n🔥 Testing Firebase initialization:")
try:
    from core.firebase import init_firebase_if_needed, _initialized
    init_firebase_if_needed()
    if _initialized:
        print("   ✅ Firebase initialized successfully!")
    else:
        print("   ❌ Firebase initialization failed")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "="*60)
print("SUMMARY:")
print("="*60)
if env_value and (env_value.startswith("{") or Path(env_value).exists()):
    print("✅ Credentials appear to be configured correctly")
else:
    print("❌ Credentials not properly configured")
    print("\nTo fix:")
    print("1. Add to backend/.env:")
    print("   GOOGLE_APPLICATION_CREDENTIALS={...paste entire JSON...}")
    print("2. Or create backend/credential.json with the JSON content")
    print("3. Restart the backend")

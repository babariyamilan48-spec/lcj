from __future__ import annotations

from pathlib import Path
import os
from typing import Optional, Dict, Any

from core.config.settings import settings

_firebase_available = True
try:
    import firebase_admin
    from firebase_admin import credentials, auth as fb_auth
except Exception:
    _firebase_available = False

_initialized = False

def _resolve_credentials_path() -> Path | None:
    import json
    
    # Prefer standard env var if provided
    env_value = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if env_value:
        # Check if it's a file path
        p = Path(env_value).resolve()
        if p.exists():
            return p
        
        # Check if it's JSON content directly
        try:
            json_data = json.loads(env_value)
            if isinstance(json_data, dict) and json_data.get("type") == "service_account":
                # It's valid JSON, write to temp file
                backend_root = Path(__file__).resolve().parent.parent
                temp_cred_path = backend_root / ".firebase_temp_creds.json"
                temp_cred_path.write_text(env_value)
                return temp_cred_path
        except (json.JSONDecodeError, ValueError):
            pass
    
    # Fallback to backend/credential.json
    backend_root = Path(__file__).resolve().parent.parent
    default_path = backend_root / "credential.json"
    return default_path if default_path.exists() else None

def init_firebase_if_needed() -> None:
    global _initialized
    if _initialized or not _firebase_available:
        return

    # Resolve credentials path from env or default location
    env_value = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    path = _resolve_credentials_path()
    if not path:
        error_msg = f"[FIREBASE] ❌ No credentials found. GOOGLE_APPLICATION_CREDENTIALS={env_value[:50] if env_value else 'NOT SET'}... or place backend/credential.json"
        try:
            print(error_msg)
            logger = __import__('logging').getLogger(__name__)
            logger.error(error_msg)
        except Exception:
            pass
        return  # no credentials present; stay uninitialized

    try:
        cred = credentials.Certificate(str(path))
        firebase_admin.initialize_app(cred)
        _initialized = True
        success_msg = f"[FIREBASE] ✅ Initialized with credentials at: {str(path)}"
        try:
            print(success_msg)
            logger = __import__('logging').getLogger(__name__)
            logger.info(success_msg)
        except Exception:
            pass
    except Exception as e:
        # Log the actual error
        error_msg = f"[FIREBASE] ❌ Initialization failed: {str(e)}"
        _initialized = False
        try:
            print(error_msg)
            logger = __import__('logging').getLogger(__name__)
            logger.error(error_msg)
        except Exception:
            pass

def verify_firebase_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    if not _firebase_available:
        return None
    init_firebase_if_needed()
    if not _initialized:
        return None
    try:
        # Allow 60 seconds clock skew for system clock differences
        # This is a common practice for distributed systems
        claims = fb_auth.verify_id_token(id_token, clock_skew_seconds=60)
        return claims
    except Exception as e:
        try:
            print(f"[FIREBASE] verify_id_token failed: {e}")
        except Exception:
            pass
        return None


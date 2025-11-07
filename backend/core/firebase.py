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
    # Prefer standard env var if provided
    env_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if env_path:
        p = Path(env_path).resolve()
        return p if p.exists() else None
    # Fallback to backend/credential.json
    backend_root = Path(__file__).resolve().parent.parent
    default_path = backend_root / "credential.json"
    return default_path if default_path.exists() else None

def init_firebase_if_needed() -> None:
    global _initialized
    if _initialized or not _firebase_available:
        return

    # Resolve credentials path from env or default location
    path = _resolve_credentials_path()
    if not path:
        try:
            print("[FIREBASE] No credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or place backend/credential.json")
        except Exception:
            pass
        return  # no credentials present; stay uninitialized

    try:
        cred = credentials.Certificate(str(path))
        firebase_admin.initialize_app(cred)
        _initialized = True
        try:
            print(f"[FIREBASE] Initialized with credentials at: {str(path)}")
        except Exception:
            pass
    except Exception:
        # Fail silently; verification will fallback
        _initialized = False
        try:
            print("[FIREBASE] Initialization failed. Check credentials file.")
        except Exception:
            pass

def verify_firebase_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    if not _firebase_available:
        return None
    init_firebase_if_needed()
    if not _initialized:
        return None
    try:
        claims = fb_auth.verify_id_token(id_token)
        return claims
    except Exception as e:
        try:
            print(f"[FIREBASE] verify_id_token failed: {e}")
        except Exception:
            pass
        return None


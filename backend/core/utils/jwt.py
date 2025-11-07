"""
Compatibility shim for decode_token used by other services.
Delegates to auth_service implementation if available.
"""

from typing import Optional, Dict, Any

try:
    # Prefer the auth service's JWT utilities
    from auth_service.app.utils.jwt import decode_token as _decode_token
except Exception:
    _decode_token = None

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    if _decode_token is not None:
        return _decode_token(token)
    # Minimal fallback: return None to indicate invalid/unavailable
    return None


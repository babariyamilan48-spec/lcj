import logging
from typing import Optional
import requests

from core.cache import cache
from core.config.settings import settings

logger = logging.getLogger(__name__)


def _is_enabled() -> bool:
    return bool(getattr(settings, "TELEGRAM_NOTIFICATIONS_ENABLED", False))


def _get_token() -> Optional[str]:
    return getattr(settings, "TELEGRAM_BOT_TOKEN", None)


def _get_chat_id() -> Optional[str]:
    return getattr(settings, "TELEGRAM_ADMIN_CHAT_ID", None)


def _is_authorized_chat(chat_id: str) -> bool:
    """Only allow admin chat ID to receive messages"""
    allowed = _get_chat_id()
    return str(chat_id) == str(allowed)


def _sent_key(dedupe_key: str) -> str:
    return f"telegram_sent:{dedupe_key}"


def send_admin_message(message: str, *, dedupe_key: Optional[str] = None, dedupe_ttl_seconds: int = 24 * 3600) -> bool:
    """Send a Telegram message to admin chat.

    This is admin-only and is controlled via env vars.

    Idempotency:
    - If `dedupe_key` is provided and exists in Redis, message will be skipped.

    Security:
    - Only the configured admin chat ID can receive messages.
    - Unauthorized chat IDs are blocked and logged.
    """
    try:
        logger.info(f"[TELEGRAM] Starting send_admin_message...")
        logger.info(f"[TELEGRAM] Enabled check: _is_enabled()={_is_enabled()}")

        if not _is_enabled():
            logger.warning("[TELEGRAM] Notifications disabled (TELEGRAM_NOTIFICATIONS_ENABLED is not true)")
            return False

        token = _get_token()
        chat_id = _get_chat_id()
        logger.info(f"[TELEGRAM] Token present: {bool(token)}, Chat ID present: {bool(chat_id)}")

        if not token or not chat_id:
            logger.warning("[TELEGRAM] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID")
            return False

        # Security: Only allow admin chat
        logger.info(f"[TELEGRAM] Checking auth: chat_id={chat_id}, allowed={_get_chat_id()}")
        if not _is_authorized_chat(chat_id):
            logger.warning(f"[TELEGRAM] Unauthorized chat access blocked: {chat_id}")
            return False

        if dedupe_key:
            logger.info(f"[TELEGRAM] Checking dedupe key: {dedupe_key}")
            try:
                existing = cache.get(_sent_key(dedupe_key))
                if existing:
                    logger.info(f"[TELEGRAM] Duplicate message skipped (dedupe key exists): {dedupe_key}")
                    return False
            except Exception as e:
                logger.warning(f"[TELEGRAM] Dedupe cache read failed: {e}")

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }
        logger.info(f"[TELEGRAM] Sending to chat_id={chat_id}, url={url[:50]}...")

        resp = requests.post(url, json=payload, timeout=5)
        ok = resp.status_code == 200
        if not ok:
            logger.warning(f"[TELEGRAM] Send failed: status={resp.status_code}, body={resp.text[:500]}")
            return False

        logger.info(f"[TELEGRAM] Message sent successfully!")

        if dedupe_key:
            try:
                cache.set(_sent_key(dedupe_key), True, ttl=dedupe_ttl_seconds)
                logger.info(f"[TELEGRAM] Dedupe key cached: {dedupe_key}")
            except Exception as e:
                logger.warning(f"[TELEGRAM] Dedupe cache write failed: {e}")

        return True

    except Exception as e:
        logger.error(f"[TELEGRAM] Send exception: {e}")
        import traceback
        logger.error(f"[TELEGRAM] Traceback: {traceback.format_exc()}")
        return False

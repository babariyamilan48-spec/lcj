from typing import Optional
from pydantic import EmailStr
from core.config.settings import settings

def _build_mail_conf():
    # Lazy import to avoid validating config at import time
    from fastapi_mail import ConnectionConfig

    username = getattr(settings, "SMTP_USER", None)
    password = getattr(settings, "SMTP_PASSWORD", None)
    mail_from = getattr(settings, "SMTP_FROM", username)
    if not username or not password or not mail_from:
        return None

    return ConnectionConfig(
        MAIL_USERNAME=username,
        MAIL_PASSWORD=password,
        MAIL_FROM=mail_from,
        MAIL_PORT=int(getattr(settings, "SMTP_PORT", 587) or 587),
        MAIL_SERVER=getattr(settings, "SMTP_HOST", "smtp.gmail.com"),
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
    )

async def send_email(subject: str, recipients: list[EmailStr], html: str) -> None:
    conf = _build_mail_conf()
    if conf is None:
        # Email not configured; print for visibility in dev
        try:
            print(f"[EMAIL] SMTP not configured. Skipping send to {recipients} (subject='{subject}')")
        except Exception:
            pass
        return None

    # Lazy import FastMail and MessageSchema
    from fastapi_mail import FastMail, MessageSchema

    message = MessageSchema(subject=subject, recipients=recipients, body=html, subtype="html")
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"[EMAIL] Sent '{subject}' to {recipients}")
    except Exception as e:
        print(f"[EMAIL] Failed to send '{subject}' to {recipients}: {e}")

def is_email_configured() -> bool:
    return bool(getattr(settings, "SMTP_USER", None) and getattr(settings, "SMTP_PASSWORD", None))

def otp_email_html(title: str, otp: str, note: Optional[str] = None) -> str:
    extra = f"<p style='color:#555;font-size:14px'>{note}</p>" if note else ""
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>{title}</title>
  <style>
    body {{ font-family: Arial, sans-serif; background:#f7fafc; padding:24px; }}
    .card {{ max-width:520px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }}
    h1 {{ font-size:20px; margin:0 0 12px; color:#1a202c; }}
    p  {{ color:#2d3748; line-height:1.6; }}
    .otp {{ font-size:28px; letter-spacing:4px; font-weight:bold; background:#edf2f7; padding:12px 16px; border-radius:6px; display:inline-block; margin:12px 0; }}
    .foot {{ font-size:12px; color:#718096; margin-top:16px; }}
  </style>
  </head>
<body>
  <div class='card'>
    <h1>{title}</h1>
    <p>Use the following one-time code:</p>
    <div class='otp'>{otp}</div>
    {extra}
    <p class='foot'>If you didn’t request this, you can safely ignore this email.</p>
  </div>
</body>
</html>
"""


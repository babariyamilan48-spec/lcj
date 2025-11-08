from typing import Optional
from pydantic import EmailStr
from core.config.settings import settings

def _build_mail_conf():
    # Lazy import to avoid validating config at import time
    from fastapi_mail import ConnectionConfig

    username = getattr(settings, "SMTP_USER", None)
    password = getattr(settings, "SMTP_PASSWORD", None)
    mail_from = getattr(settings, "SMTP_FROM", None)
    
    # If SMTP_FROM is not set, use SMTP_USER as fallback
    if not mail_from:
        mail_from = username
    
    # Validate that we have all required fields and that mail_from is a valid email
    if not username or not password or not mail_from:
        print(f"[EMAIL] Missing SMTP configuration: username={bool(username)}, password={bool(password)}, mail_from={bool(mail_from)}")
        return None
    
    # Basic email validation for mail_from
    if "@" not in str(mail_from):
        print(f"[EMAIL] Invalid MAIL_FROM address: '{mail_from}' - must be a valid email address")
        return None

    try:
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
    except Exception as e:
        print(f"[EMAIL] Failed to create mail configuration: {e}")
        return None

async def send_email(subject: str, recipients: list[EmailStr], html: str) -> bool:
    """
    Send email to recipients. Returns True if sent successfully, False otherwise.
    """
    conf = _build_mail_conf()
    if conf is None:
        # Email not configured; print for visibility in dev
        try:
            print(f"[EMAIL] ❌ SMTP not configured. Cannot send email to {recipients} (subject='{subject}')")
            print("[EMAIL] 💡 Please configure SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in your .env file")
        except Exception:
            pass
        return False

    # Lazy import FastMail and MessageSchema
    from fastapi_mail import FastMail, MessageSchema

    message = MessageSchema(subject=subject, recipients=recipients, body=html, subtype="html")
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"[EMAIL] ✅ Successfully sent '{subject}' to {recipients}")
        return True
    except Exception as e:
        print(f"[EMAIL] ❌ Failed to send '{subject}' to {recipients}: {e}")
        print(f"[EMAIL] 💡 Check your SMTP configuration and credentials")
        return False

def is_email_configured() -> bool:
    username = getattr(settings, "SMTP_USER", None)
    password = getattr(settings, "SMTP_PASSWORD", None)
    mail_from = getattr(settings, "SMTP_FROM", None) or username
    
    print(f"[EMAIL_CONFIG] SMTP_USER: {bool(username)} ({'***' if username else 'None'})")
    print(f"[EMAIL_CONFIG] SMTP_PASSWORD: {bool(password)} ({'***' if password else 'None'})")
    print(f"[EMAIL_CONFIG] SMTP_FROM: {bool(mail_from)} ({mail_from if mail_from else 'None'})")
    
    # Check if all required fields are present and mail_from is valid
    if not username or not password or not mail_from:
        print(f"[EMAIL_CONFIG] Missing required fields")
        return False
    
    # Basic email validation for mail_from
    is_valid = "@" in str(mail_from)
    print(f"[EMAIL_CONFIG] Email validation result: {is_valid}")
    return is_valid

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


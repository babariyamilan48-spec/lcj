from typing import Optional
from pydantic import EmailStr
from core.config.settings import settings
import asyncio

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
        smtp_port = int(getattr(settings, "SMTP_PORT", 587) or 587)
        smtp_host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
        
        # Configure SSL/TLS based on port
        if smtp_port == 465:
            # Use SSL for port 465
            mail_starttls = False
            mail_ssl_tls = True
        else:
            # Use STARTTLS for port 587 (default)
            mail_starttls = True
            mail_ssl_tls = False
        
        print(f"[EMAIL] Configuring SMTP: {smtp_host}:{smtp_port} (STARTTLS={mail_starttls}, SSL={mail_ssl_tls})")
        
        return ConnectionConfig(
            MAIL_USERNAME=username,
            MAIL_PASSWORD=password,
            MAIL_FROM=mail_from,
            MAIL_PORT=smtp_port,
            MAIL_SERVER=smtp_host,
            MAIL_STARTTLS=mail_starttls,
            MAIL_SSL_TLS=mail_ssl_tls,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
            TIMEOUT=60,  # Increase timeout to 60 seconds
        )
    except Exception as e:
        print(f"[EMAIL] Failed to create mail configuration: {e}")
        return None

async def send_email_with_config(subject: str, recipients: list[EmailStr], html: str, config: dict) -> bool:
    """
    Send email with a specific configuration.
    """
    from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
    
    try:
        smtp_port = config['port']
        smtp_host = config['host']
        
        # Configure SSL/TLS based on port
        if smtp_port == 465:
            mail_starttls = False
            mail_ssl_tls = True
        else:
            mail_starttls = True
            mail_ssl_tls = False
        
        username = getattr(settings, "SMTP_USER", None)
        password = getattr(settings, "SMTP_PASSWORD", None)
        mail_from = getattr(settings, "SMTP_FROM", None) or username
        
        print(f"[EMAIL] Trying {smtp_host}:{smtp_port} (STARTTLS={mail_starttls}, SSL={mail_ssl_tls})")
        
        conn_config = ConnectionConfig(
            MAIL_USERNAME=username,
            MAIL_PASSWORD=password,
            MAIL_FROM=mail_from,
            MAIL_PORT=smtp_port,
            MAIL_SERVER=smtp_host,
            MAIL_STARTTLS=mail_starttls,
            MAIL_SSL_TLS=mail_ssl_tls,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
            TIMEOUT=config.get('timeout', 60),
        )
        
        message = MessageSchema(subject=subject, recipients=recipients, body=html, subtype="html")
        fm = FastMail(conn_config)
        
        # Add timeout to the send operation
        await asyncio.wait_for(fm.send_message(message), timeout=config.get('timeout', 60))
        print(f"[EMAIL] ✅ Successfully sent '{subject}' to {recipients} via {smtp_host}:{smtp_port}")
        return True
        
    except asyncio.TimeoutError:
        print(f"[EMAIL] ⏱️ Timeout sending via {config['host']}:{config['port']}")
        return False
    except Exception as e:
        print(f"[EMAIL] ❌ Failed via {config['host']}:{config['port']}: {e}")
        return False

async def send_email(subject: str, recipients: list[EmailStr], html: str) -> bool:
    """
    Send email to recipients with fallback configurations. Returns True if sent successfully, False otherwise.
    """
    # Check if email is configured
    username = getattr(settings, "SMTP_USER", None)
    password = getattr(settings, "SMTP_PASSWORD", None)
    mail_from = getattr(settings, "SMTP_FROM", None) or username
    
    if not username or not password or not mail_from:
        print(f"[EMAIL] ❌ SMTP not configured. Cannot send email to {recipients} (subject='{subject}')")
        print("[EMAIL] 💡 Please configure SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in your .env file")
        return False
    
    # Try multiple SMTP configurations in order of preference
    smtp_configs = [
        {
            'name': 'Gmail STARTTLS (Port 587)',
            'host': getattr(settings, "SMTP_HOST", "smtp.gmail.com"),
            'port': int(getattr(settings, "SMTP_PORT", 587) or 587),
            'timeout': 60
        },
        {
            'name': 'Gmail SSL (Port 465)',
            'host': 'smtp.gmail.com',
            'port': 465,
            'timeout': 60
        }
    ]
    
    # If user specified a custom port, try that first
    custom_port = int(getattr(settings, "SMTP_PORT", 587) or 587)
    if custom_port not in [587, 465]:
        smtp_configs.insert(0, {
            'name': f'Custom SMTP (Port {custom_port})',
            'host': getattr(settings, "SMTP_HOST", "smtp.gmail.com"),
            'port': custom_port,
            'timeout': 60
        })
    
    for config in smtp_configs:
        print(f"[EMAIL] Attempting to send via {config['name']}...")
        success = await send_email_with_config(subject, recipients, html, config)
        if success:
            return True
        print(f"[EMAIL] Failed with {config['name']}, trying next configuration...")
    
    print(f"[EMAIL] ❌ All SMTP configurations failed for {recipients} (subject='{subject}')")
    print("[EMAIL] 💡 Troubleshooting tips:")
    print("[EMAIL]   1. Make sure you're using a Gmail App Password, not your regular password")
    print("[EMAIL]   2. Check if your firewall/antivirus is blocking SMTP connections")
    print("[EMAIL]   3. Try setting SMTP_PORT=465 in your .env file for SSL connection")
    print("[EMAIL]   4. Verify your Gmail account has 2-Factor Authentication enabled")
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


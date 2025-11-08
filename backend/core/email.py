from typing import Optional, Union, List
from pydantic import EmailStr
from core.config.settings import settings
import resend

# Set the Resend API key
resend.api_key = "re_aXRBPZW2_29gK1DM3oeB2vkbxFM4TMtLt"

async def send_email(subject: str, recipients: Union[List[EmailStr], List[str]], html: str) -> bool:
    """
    Send email to recipients using Resend API. Returns True if sent successfully, False otherwise.
    """
    # Check if Resend is configured
    if not resend.api_key:
        print(f"[EMAIL] ❌ Resend API key not configured. Cannot send email to {recipients} (subject='{subject}')")
        print("[EMAIL] 💡 Please configure RESEND_API_KEY in your .env file")
        return False
    
    # Get the sender email from settings or use default
    mail_from = getattr(settings, "MAIL_FROM", "Life Journey <onboarding@resend.dev>")
    
    try:
        # Convert EmailStr objects to strings for Resend API
        recipient_emails = [str(email) for email in recipients]
        
        print(f"[EMAIL] Sending email via Resend API...")
        print(f"[EMAIL] From: {mail_from}")
        print(f"[EMAIL] To: {recipient_emails}")
        print(f"[EMAIL] Subject: {subject}")
        
        # Send email using Resend API
        r = resend.Emails.send({
            "from": mail_from,
            "to": recipient_emails,
            "subject": subject,
            "html": html
        })
        
        print(f"[EMAIL] ✅ Successfully sent '{subject}' to {recipient_emails} via Resend")
        print(f"[EMAIL] Response: {r}")
        return True
        
    except Exception as e:
        print(f"[EMAIL] ❌ Failed to send email via Resend: {e}")
        return False

def is_email_configured() -> bool:
    """
    Check if Resend email is properly configured.
    """
    api_key_configured = bool(resend.api_key)
    mail_from = getattr(settings, "MAIL_FROM", "Life Journey <onboarding@resend.dev>")
    
    print(f"[EMAIL_CONFIG] RESEND_API_KEY: {api_key_configured} ({'***' if api_key_configured else 'None'})")
    print(f"[EMAIL_CONFIG] MAIL_FROM: {mail_from}")
    
    # Basic email validation for mail_from
    is_valid = "@" in str(mail_from) and api_key_configured
    print(f"[EMAIL_CONFIG] Email configuration valid: {is_valid}")
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


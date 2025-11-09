from typing import Optional, Union, List
from pydantic import EmailStr
from core.config.settings import settings
from sib_api_v3_sdk import Configuration, ApiClient
from sib_api_v3_sdk.api.transactional_emails_api import TransactionalEmailsApi
from sib_api_v3_sdk.models import SendSmtpEmail, SendSmtpEmailTo
import os

async def send_email(subject: str, recipients: Union[List[EmailStr], List[str]], html: str) -> bool:
    """
    Send email to recipients using Sendinblue API. Returns True if sent successfully, False otherwise.
    """
    # Get API key from environment or settings
    api_key = os.getenv("SENDINBLUE_API_KEY") or settings.SENDINBLUE_API_KEY
    
    # Check if Sendinblue is configured
    if not api_key:
        print(f"[EMAIL] ❌ Sendinblue API key not configured. Cannot send email to {recipients} (subject='{subject}')")
        print("[EMAIL] 💡 Please configure SENDINBLUE_API_KEY in your .env file")
        return False
    
    # Get the sender email from settings
    mail_from = settings.MAIL_FROM
    
    try:
        # Configure API key
        configuration = Configuration()
        configuration.api_key['api-key'] = api_key
        
        # Create API instance
        api_instance = TransactionalEmailsApi(ApiClient(configuration))
        
        # Convert EmailStr objects to strings for Sendinblue API
        recipient_emails = [str(email) for email in recipients]
        
        print(f"[EMAIL] Sending email via Sendinblue API...")
        print(f"[EMAIL] From: {mail_from}")
        print(f"[EMAIL] To: {recipient_emails}")
        print(f"[EMAIL] Subject: {subject}")
        
        # Extract sender name and email
        if '<' in mail_from and '>' in mail_from:
            sender_name = mail_from.split('<')[0].strip()
            sender_email = mail_from.split('<')[1].rstrip('>')
        else:
            sender_name = "Life Journey"
            sender_email = mail_from
        
        # Prepare email data
        email = SendSmtpEmail(
            to=[SendSmtpEmailTo(email=email_addr) for email_addr in recipient_emails],
            sender={"name": sender_name, "email": sender_email},
            subject=subject,
            html_content=html
        )
        
        # Send email
        response = api_instance.send_transac_email(email)
        
        print(f"[EMAIL] ✅ Successfully sent '{subject}' to {recipient_emails} via Sendinblue")
        print(f"[EMAIL] Response: {response}")
        return True
        
    except Exception as e:
        print(f"[EMAIL] ❌ Failed to send email via Sendinblue: {e}")
        return False

def is_email_configured() -> bool:
    """
    Check if Sendinblue email is properly configured.
    """
    api_key = os.getenv("SENDINBLUE_API_KEY") or settings.SENDINBLUE_API_KEY
    api_key_configured = bool(api_key)
    mail_from = settings.MAIL_FROM
    
    print(f"[EMAIL_CONFIG] SENDINBLUE_API_KEY: {api_key_configured} ({'***' if api_key_configured else 'None'})")
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


from typing import Optional, Union, List
from pydantic import EmailStr
from core.config.settings import settings
from sib_api_v3_sdk import Configuration, ApiClient
from sib_api_v3_sdk.api.transactional_emails_api import TransactionalEmailsApi
from sib_api_v3_sdk.models import SendSmtpEmail, SendSmtpEmailTo
import os

def send_email(subject: str, recipients: Union[List[EmailStr], List[str]], html: str) -> bool:
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
            to=[{"email": email} for email in recipient_emails],
            html_content=html,
            sender={"name": sender_name, "email": sender_email},
            subject=subject
        )

        # Send the email
        api_instance.send_transac_email(email)
        print(f"[EMAIL] ✅ Email sent successfully to {recipient_emails}")
        return True

    except Exception as e:
        print(f"[EMAIL] ❌ Failed to send email: {str(e)}")
        return False

# Alias for backward compatibility
send_email_sync = send_email

def is_email_configured() -> bool:
    """
    Check if Sendinblue email is properly configured.
    """
    api_key = os.getenv("SENDINBLUE_API_KEY") or getattr(settings, "SENDINBLUE_API_KEY", None)
    mail_from = getattr(settings, "MAIL_FROM", None)

    if not api_key:
        print("[EMAIL] ❌ Sendinblue API key not configured")
        return False
    if not mail_from:
        print("[EMAIL] ❌ MAIL_FROM not configured in settings")
        return False
    return True

def otp_email_html(title: str, otp: str, note: Optional[str] = None) -> str:
    """
    Generate HTML for OTP email.
    """
    note_html = f"<p style='color: #666;'>{note}</p>" if note else ""

    return f"""
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <div style='background-color: #4CAF50; padding: 20px; color: white; text-align: center;'>
            <h1>{title}</h1>
        </div>
        <div style='padding: 20px;'>
            <p>Your One Time Password (OTP) is:</p>
            <div style='font-size: 24px; font-weight: bold; letter-spacing: 5px;
                        margin: 20px 0; padding: 15px; background-color: #f5f5f5;
                        text-align: center; border-radius: 5px;'>
                {otp}
            </div>
            {note_html}
            <p style='font-size: 12px; color: #888; margin-top: 30px;'>
                This is an automated message, please do not reply to this email.
            </p>
        </div>
    </div>
    """
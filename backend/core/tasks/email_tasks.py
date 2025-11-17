"""
Background tasks for sending emails asynchronously.
"""
from celery import shared_task
import logging
from typing import Optional
from core.email import send_email_async, otp_email_html

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_verification_email(self, recipient: str, otp_code: str, subject: str, note: Optional[str] = None):
    """
    Background task to send verification email with OTP code.
    """
    try:
        logger.info(f"Sending verification email to {recipient}")
        
        # Generate the email HTML
        html = otp_email_html(
            title=subject,
            otp=otp_code,
            note=note
        )
        
        # Send the email asynchronously
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        success = loop.run_until_complete(
            send_email_async(subject, [recipient], html)
        )
        
        if success:
            logger.info(f"Successfully sent verification email to {recipient}")
        else:
            logger.error(f"Failed to send verification email to {recipient}")
            
        return success
        
    except Exception as e:
        logger.error(f"Error sending verification email to {recipient}: {str(e)}")
        logger.exception("Verification email error:")
        
        # Retry the task with exponential backoff
        raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))
    finally:
        if 'loop' in locals() and loop is not None:
            loop.close()

"""
Razorpay Payment Gateway Service
Handles order creation, payment verification, and transaction management
"""

import logging
import hashlib
import hmac
from typing import Dict, Optional, Tuple
from datetime import datetime
import razorpay
from core.config.settings import settings

logger = logging.getLogger(__name__)


class RazorpayService:
    """Service for Razorpay payment operations"""

    def __init__(self):
        """Initialize Razorpay client with environment-based credentials"""
        self.env = settings.RAZORPAY_ENV
        self.key_id, self.key_secret = self._get_credentials()
        
        if not self.key_id or not self.key_secret:
            logger.warning(f"⚠️ Razorpay credentials not configured for {self.env} environment")
        
        self.client = razorpay.Client(auth=(self.key_id, self.key_secret)) if self.key_id else None
        self.payment_amount = settings.RAZORPAY_PAYMENT_AMOUNT

    def _get_credentials(self) -> Tuple[Optional[str], Optional[str]]:
        """
        Get Razorpay credentials based on environment
        
        Returns:
            Tuple of (key_id, key_secret)
        """
        if self.env == "live":
            return settings.RAZORPAY_LIVE_KEY_ID, settings.RAZORPAY_LIVE_KEY_SECRET
        else:  # test environment
            return settings.RAZORPAY_TEST_KEY_ID, settings.RAZORPAY_TEST_KEY_SECRET

    def create_order(
        self,
        amount: int,
        currency: str = "INR",
        receipt: Optional[str] = None,
        notes: Optional[Dict] = None
    ) -> Dict:
        """
        Create a Razorpay order
        
        Args:
            amount: Amount in paise (e.g., 50000 = ₹500)
            currency: Currency code (default: INR)
            receipt: Receipt ID (optional)
            notes: Additional notes/metadata (optional)
        
        Returns:
            Order response from Razorpay
        
        Raises:
            Exception: If order creation fails
        """
        if not self.client:
            raise ValueError("Razorpay client not initialized. Check credentials.")
        
        try:
            order_data = {
                "amount": amount,
                "currency": currency,
                "receipt": receipt or f"receipt_{datetime.utcnow().timestamp()}",
            }
            
            if notes:
                order_data["notes"] = notes
            
            order = self.client.order.create(data=order_data)
            logger.info(f"✅ Order created: {order['id']} for amount {amount} {currency}")
            return order
        
        except Exception as e:
            logger.error(f"❌ Error creating Razorpay order: {str(e)}")
            raise

    def verify_signature(
        self,
        order_id: str,
        payment_id: str,
        signature: str
    ) -> bool:
        """
        Verify Razorpay payment signature
        
        Args:
            order_id: Razorpay order ID
            payment_id: Razorpay payment ID
            signature: Payment signature from Razorpay
        
        Returns:
            True if signature is valid, False otherwise
        """
        if not self.key_secret:
            logger.error("❌ Razorpay key secret not configured")
            return False
        
        try:
            # Create the string to verify
            verify_string = f"{order_id}|{payment_id}"
            
            # Generate HMAC SHA256 signature
            generated_signature = hmac.new(
                self.key_secret.encode(),
                verify_string.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            is_valid = generated_signature == signature
            
            if is_valid:
                logger.info(f"✅ Signature verified for payment {payment_id}")
            else:
                logger.warning(f"⚠️ Signature verification failed for payment {payment_id}")
            
            return is_valid
        
        except Exception as e:
            logger.error(f"❌ Error verifying signature: {str(e)}")
            return False

    def fetch_payment(self, payment_id: str) -> Dict:
        """
        Fetch payment details from Razorpay
        
        Args:
            payment_id: Razorpay payment ID
        
        Returns:
            Payment details from Razorpay
        """
        if not self.client:
            raise ValueError("Razorpay client not initialized")
        
        try:
            payment = self.client.payment.fetch(payment_id)
            logger.info(f"✅ Fetched payment details for {payment_id}")
            return payment
        
        except Exception as e:
            logger.error(f"❌ Error fetching payment {payment_id}: {str(e)}")
            raise

    def fetch_order(self, order_id: str) -> Dict:
        """
        Fetch order details from Razorpay
        
        Args:
            order_id: Razorpay order ID
        
        Returns:
            Order details from Razorpay
        """
        if not self.client:
            raise ValueError("Razorpay client not initialized")
        
        try:
            order = self.client.order.fetch(order_id)
            logger.info(f"✅ Fetched order details for {order_id}")
            return order
        
        except Exception as e:
            logger.error(f"❌ Error fetching order {order_id}: {str(e)}")
            raise

    def get_key_id(self) -> str:
        """Get current Razorpay Key ID for frontend"""
        if not self.key_id:
            raise ValueError("Razorpay Key ID not configured")
        return self.key_id

    def get_environment(self) -> str:
        """Get current Razorpay environment (test/live)"""
        return self.env


# Singleton instance
_razorpay_service: Optional[RazorpayService] = None


def get_razorpay_service() -> RazorpayService:
    """Get or create Razorpay service instance"""
    global _razorpay_service
    if _razorpay_service is None:
        _razorpay_service = RazorpayService()
    return _razorpay_service

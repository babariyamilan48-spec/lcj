"""
Pydantic schemas for payment operations
"""

from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class CreateOrderRequest(BaseModel):
    """Request to create a Razorpay order"""
    user_id: UUID = Field(..., description="User ID")
    amount: Optional[int] = Field(None, description="Amount in paise (optional, uses default if not provided)")
    plan_type: str = Field(..., description="Type of plan (test or counseling)")
    coupon_code: Optional[str] = Field(None, description="Optional coupon code to override amount")
    force_new: Optional[bool] = Field(False, description="Force creating a new Razorpay order instead of reusing an existing created order")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "amount": 50000,
                "plan_type": "counseling",
                "coupon_code": "LCJ1",
                "force_new": False
            }
        }


class CreateOrderResponse(BaseModel):
    """Response with Razorpay order details"""
    order_id: str = Field(..., description="Razorpay Order ID")
    amount: int = Field(..., description="Amount in paise")
    currency: str = Field(..., description="Currency code")
    razorpay_key_id: str = Field(..., description="Razorpay Key ID for frontend")
    environment: str = Field(..., description="Environment (test/live)")
    plan_type: str = Field(..., description="Type of plan")
    coupon_applied: bool = Field(False, description="Whether a coupon was applied")
    applied_coupon_code: Optional[str] = Field(None, description="Coupon code applied (if any)")
    paid: bool = Field(False, description="Whether user is already paid; short-circuit")

    class Config:
        json_schema_extra = {
            "example": {
                "order_id": "order_1234567890",
                "amount": 50000,
                "currency": "INR",
                "razorpay_key_id": "rzp_test_1234567890",
                "environment": "test",
                "plan_type": "counseling",
                "coupon_applied": True,
                "applied_coupon_code": "LCJ1"
            }
        }


class VerifyPaymentRequest(BaseModel):
    """Request to verify payment signature"""
    user_id: UUID = Field(..., description="User ID")
    order_id: str = Field(..., description="Razorpay Order ID")
    payment_id: str = Field(..., description="Razorpay Payment ID")
    signature: str = Field(..., description="Payment signature from Razorpay")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "order_id": "order_1234567890",
                "payment_id": "pay_1234567890",
                "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
            }
        }


class VerifyPaymentResponse(BaseModel):
    """Response after payment verification"""
    success: bool = Field(..., description="Payment verification success")
    message: str = Field(..., description="Status message")
    payment_completed: bool = Field(..., description="User payment completion status")
    payment_id: Optional[str] = Field(None, description="Razorpay Payment ID")
    paid: bool = Field(True, description="Whether payment is marked paid")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Payment verified successfully",
                "payment_completed": True,
                "payment_id": "pay_1234567890"
            }
        }


class PaymentStatusResponse(BaseModel):
    """Response for payment status check"""
    payment_completed: bool = Field(..., description="Whether user has completed payment")
    plan_type: Optional[str] = Field(None, description="User's current plan type")
    last_payment_date: Optional[datetime] = Field(None, description="Date of last successful payment")
    payment_id: Optional[str] = Field(None, description="Last successful payment ID")

    class Config:
        json_schema_extra = {
            "example": {
                "payment_completed": True,
                "last_payment_date": "2024-01-15T10:30:00Z",
                "payment_id": "pay_1234567890"
            }
        }


class PaymentRecord(BaseModel):
    """Payment transaction record"""
    id: UUID = Field(..., description="Payment record ID")
    user_id: UUID = Field(..., description="User ID")
    order_id: str = Field(..., description="Razorpay Order ID")
    payment_id: Optional[str] = Field(None, description="Razorpay Payment ID")
    amount: int = Field(..., description="Amount in paise")
    currency: str = Field(..., description="Currency code")
    status: str = Field(..., description="Payment status (created/paid/failed)")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "550e8400-e29b-41d4-a716-446655440001",
                "order_id": "order_1234567890",
                "payment_id": "pay_1234567890",
                "amount": 50000,
                "currency": "INR",
                "status": "paid",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:35:00Z"
            }
        }

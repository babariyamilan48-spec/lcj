"""
Payment endpoints for Razorpay integration
Handles order creation, payment verification, and status checks
"""

import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from core.database_fixed import get_db, get_db_session
from core.services.razorpay_service import get_razorpay_service
from auth_service.app.models.user import User, Payment
from auth_service.app.deps.auth import get_current_user
from auth_service.app.schemas.payment import (
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    PaymentStatusResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payment", tags=["Payment"])


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(
    request: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a Razorpay order for payment
    
    - **amount**: Optional amount in paise (uses default if not provided)
    
    Returns order details for frontend checkout
    
    Requires: Authentication token (user must be logged in)
    """
    try:
        # ✅ Use authenticated user (no need to query)
        if not current_user:
            logger.warning("Unauthorized payment request - no authenticated user")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated. Please log in first."
            )
        
        user = current_user
        logger.info(f"Payment request from authenticated user: {user.id}")
        
        # Check if user already completed payment
        if user.payment_completed:
            logger.info(f"User {user.id} already completed payment")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already completed for this user"
            )
        
        # Get Razorpay service
        razorpay_service = get_razorpay_service()
        
        # Use provided amount or default
        amount = request.amount or razorpay_service.payment_amount
        
        # Create order
        # Receipt must be <= 40 characters for Razorpay
        user_id_str = str(user.id)
        receipt = user_id_str[:40]  # Truncate to 40 chars max
        
        try:
            order = razorpay_service.create_order(
                amount=amount,
                currency="INR",
                receipt=receipt,
                notes={
                    "user_id": user_id_str,
                    "email": user.email,
                    "username": user.username or "N/A"
                }
            )
        except Exception as razorpay_error:
            logger.error(f"❌ Razorpay API error: {str(razorpay_error)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Payment gateway temporarily unavailable. Please try again."
            )
        
        # Store order in database
        payment_record = Payment(
            user_id=user.id,
            order_id=order["id"],
            amount=amount,
            currency="INR",
            status="created"
        )
        db.add(payment_record)
        db.commit()  # ✅ Explicitly commit to ensure order is saved
        
        logger.info(f"✅ Order created for user {user.id}: {order['id']}")
        
        return CreateOrderResponse(
            order_id=order["id"],
            amount=amount,
            currency="INR",
            razorpay_key_id=razorpay_service.get_key_id(),
            environment=razorpay_service.get_environment()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment order"
        )


@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(
    request: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verify payment signature and mark user as payment completed
    
    - **order_id**: Razorpay Order ID
    - **payment_id**: Razorpay Payment ID
    - **signature**: Payment signature from Razorpay
    
    Returns verification result and updates user payment status
    
    Requires: Authentication token (user must be logged in)
    """
    try:
        # ✅ Use authenticated user
        if not current_user:
            logger.warning("Unauthorized payment verification - no authenticated user")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated. Please log in first."
            )
        
        user = current_user
        logger.info(f"Payment verification from authenticated user: {user.id}")
        
        # Get Razorpay service
        razorpay_service = get_razorpay_service()
        
        # Verify signature
        is_valid = razorpay_service.verify_signature(
            request.order_id,
            request.payment_id,
            request.signature
        )
        
        if not is_valid:
            logger.warning(f"⚠️ Invalid signature for payment {request.payment_id}")
            
            # Update payment record with failed status
            payment = db.query(Payment).filter(
                Payment.order_id == request.order_id
            ).first()
            if payment:
                payment.status = "failed"
                payment.error_message = "Invalid signature"
                db.commit()  # ✅ Explicitly commit
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment signature verification failed"
            )
        
        # Find payment record
        payment = db.query(Payment).filter(
            Payment.order_id == request.order_id
        ).first()
        
        if not payment:
            logger.warning(f"⚠️ Payment record not found for order {request.order_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found"
            )
        
        # Update payment record
        payment.payment_id = request.payment_id
        payment.status = "paid"
        payment.signature = request.signature
        
        # Mark user as payment completed
        user.payment_completed = True
        
        # ✅ Explicitly commit to ensure changes are saved
        db.commit()
        
        logger.info(f"✅ Payment verified for user {user.id}: {request.payment_id}")
        
        return VerifyPaymentResponse(
            success=True,
            message="Payment verified successfully",
            payment_completed=True,
            payment_id=request.payment_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error verifying payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify payment"
        )


@router.get("/status", response_model=PaymentStatusResponse)
async def check_payment_status(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """
    ⚡ OPTIMIZED: Check if user has completed payment - Target: <100ms
    
    - **user_id**: UUID of the user (query parameter)
    
    Returns payment completion status
    """
    try:
        # ✅ OPTIMIZED: Single query to get user + last payment in one go
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # ✅ OPTIMIZED: Get last successful payment with single targeted query
        last_payment = db.query(Payment).filter(
            Payment.user_id == user_id,
            Payment.status == "paid"
        ).order_by(desc(Payment.created_at)).first()
        
        # Build response with minimal data
        response = PaymentStatusResponse(
            payment_completed=user.payment_completed,
            last_payment_date=last_payment.updated_at if last_payment else None,
            payment_id=last_payment.payment_id if last_payment else None
        )
        
        # ✅ CRITICAL FIX: Explicitly close session to prevent leaks
        # FastAPI dependency should handle this, but explicit close ensures cleanup
        if db and db.is_active:
            db.close()
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error checking payment status: {str(e)}")
        # ✅ CRITICAL FIX: Explicitly close session on error
        if db and db.is_active:
            try:
                db.close()
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check payment status"
        )


@router.get("/history")
async def get_payment_history(
    user_id: UUID = Query(None, description="User ID (optional, uses current user if not provided)"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of records"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get payment history for a user
    
    - **user_id**: UUID of the user (optional, defaults to current user)
    - **limit**: Maximum number of records to return (default: 10)
    
    Returns list of payment transactions
    """
    try:
        # Use provided user_id or default to current user
        target_user_id = user_id or current_user.id
        
        # Verify user exists
        user = db.query(User).filter(User.id == target_user_id).first()
        if not user:
            logger.warning(f"⚠️ User not found: {target_user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get payment history
        payments = db.query(Payment).filter(
            Payment.user_id == target_user_id
        ).order_by(desc(Payment.created_at)).limit(limit).all()
        
        return {
            "user_id": str(target_user_id),
            "total_payments": len(payments),
            "payments": [
                {
                    "id": str(p.id),
                    "order_id": p.order_id,
                    "payment_id": p.payment_id,
                    "amount": p.amount,
                    "currency": p.currency,
                    "status": p.status,
                    "created_at": p.created_at.isoformat(),
                    "updated_at": p.updated_at.isoformat()
                }
                for p in payments
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching payment history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment history"
        )

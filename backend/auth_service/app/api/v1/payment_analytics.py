"""
Payment Analytics Endpoints for Admin Dashboard
Provides comprehensive payment statistics and analytics
"""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from core.database_fixed import get_db, get_db_session
from auth_service.app.deps.auth import get_current_admin_user
from auth_service.app.models.user import User, Payment
from core.app_factory import resp

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payment", tags=["Payment Analytics"])


@router.get("/analytics")
async def get_payment_analytics(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze")
):
    """
    Get comprehensive payment analytics (Admin only)
    
    Returns:
    - Total revenue and payment counts
    - Daily, monthly, and yearly revenue trends
    - Payment status breakdown
    """
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Total statistics
        total_payments = db.query(Payment).count()
        successful_payments = db.query(Payment).filter(Payment.status == "paid").count()
        failed_payments = db.query(Payment).filter(Payment.status == "failed").count()
        pending_payments = db.query(Payment).filter(Payment.status == "created").count()
        
        # Total revenue
        total_revenue_result = db.query(func.sum(Payment.amount)).filter(
            Payment.status == "paid",
            Payment.created_at >= start_date
        ).scalar()
        total_revenue = total_revenue_result or 0
        
        # Daily revenue
        daily_revenue = db.query(
            func.date(Payment.created_at).label('date'),
            func.sum(Payment.amount).label('amount'),
            func.count(Payment.id).label('count')
        ).filter(
            Payment.status == "paid",
            Payment.created_at >= start_date
        ).group_by(
            func.date(Payment.created_at)
        ).order_by('date').all()
        
        daily_revenue_data = [
            {
                "date": str(item.date),
                "amount": item.amount or 0,
                "count": item.count or 0
            }
            for item in daily_revenue
        ]
        
        # Monthly revenue
        monthly_revenue = db.query(
            func.to_char(Payment.created_at, 'YYYY-MM').label('month'),
            func.sum(Payment.amount).label('amount'),
            func.count(Payment.id).label('count')
        ).filter(
            Payment.status == "paid",
            Payment.created_at >= start_date
        ).group_by(
            func.to_char(Payment.created_at, 'YYYY-MM')
        ).order_by('month').all()
        
        monthly_revenue_data = [
            {
                "month": item.month,
                "amount": item.amount or 0,
                "count": item.count or 0
            }
            for item in monthly_revenue
        ]
        
        # Yearly revenue
        yearly_revenue = db.query(
            func.to_char(Payment.created_at, 'YYYY').label('year'),
            func.sum(Payment.amount).label('amount'),
            func.count(Payment.id).label('count')
        ).filter(
            Payment.status == "paid",
            Payment.created_at >= start_date
        ).group_by(
            func.to_char(Payment.created_at, 'YYYY')
        ).order_by('year').all()
        
        yearly_revenue_data = [
            {
                "year": item.year,
                "amount": item.amount or 0,
                "count": item.count or 0
            }
            for item in yearly_revenue
        ]
        
        analytics = {
            "total_revenue": total_revenue,
            "total_payments": total_payments,
            "successful_payments": successful_payments,
            "failed_payments": failed_payments,
            "pending_payments": pending_payments,
            "daily_revenue": daily_revenue_data,
            "monthly_revenue": monthly_revenue_data,
            "yearly_revenue": yearly_revenue_data,
            "success_rate": round((successful_payments / total_payments * 100) if total_payments > 0 else 0, 2)
        }
        
        logger.info("Payment analytics computed successfully")
        return resp(analytics, message="Payment analytics retrieved successfully")
        
    except Exception as e:
        logger.error(f"Error computing payment analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compute payment analytics"
        )


@router.get("/history")
async def get_payment_history(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    status_filter: str = Query(None, description="Filter by status (paid/failed/created)")
):
    """
    Get payment transaction history (Admin only)
    
    Returns paginated list of all payment transactions
    """
    try:
        query = db.query(Payment)
        
        # Apply status filter
        if status_filter and status_filter in ['paid', 'failed', 'created']:
            query = query.filter(Payment.status == status_filter)
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * per_page
        payments = query.order_by(desc(Payment.created_at)).offset(offset).limit(per_page).all()
        
        # Convert to response format
        payments_data = [
            {
                "id": str(payment.id),
                "user_id": str(payment.user_id),
                "order_id": payment.order_id,
                "payment_id": payment.payment_id,
                "amount": payment.amount,
                "currency": payment.currency,
                "status": payment.status,
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "updated_at": payment.updated_at.isoformat() if payment.updated_at else None,
            }
            for payment in payments
        ]
        
        result = {
            "data": payments_data,
            "total": total_count,
            "page": page,
            "per_page": per_page,
            "total_pages": (total_count + per_page - 1) // per_page
        }
        
        logger.info(f"Payment history retrieved: {len(payments)} records")
        return resp(result, message="Payment history retrieved successfully")
        
    except Exception as e:
        logger.error(f"Error retrieving payment history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment history"
        )

"""
Optimized Admin Endpoints with proper database session management
All endpoints properly handle database sessions and errors
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database_dependencies_singleton import get_db
from auth_service.app.deps.auth import get_current_admin_user
from auth_service.app.models.user import User
from auth_service.app.services.admin_service import AdminService
from core.app_factory import resp

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/users", response_model=List[dict])
async def get_all_users(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by email or username"),
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_verified: Optional[bool] = Query(None, description="Filter by verified status")
):
    """
    Get all users with pagination and filtering (Admin only)
    
    Query Parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 50, max: 100)
    - search: Search by email or username
    - role: Filter by role (admin/user)
    - is_active: Filter by active status
    - is_verified: Filter by verified status
    """
    try:
        users_data, total_count = AdminService.get_all_users(
            db=db,
            page=page,
            per_page=per_page,
            search=search,
            role=role,
            is_active=is_active,
            is_verified=is_verified
        )
        
        return users_data
        
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users"
        )


@router.post("/users", response_model=dict)
async def create_user(
    user_data: dict,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new user (Admin only)
    
    Request Body:
    {
        "email": "user@example.com",
        "password": "securepassword",
        "username": "optional_username",
        "role": "user",  # or "admin"
        "is_active": true,
        "is_verified": false
    }
    """
    try:
        # Extract and validate data
        email = user_data.get('email', '').strip()
        password = user_data.get('password', '').strip()
        username = user_data.get('username', '').strip() or None
        role = user_data.get('role', 'user')
        is_active = user_data.get('is_active', True)
        is_verified = user_data.get('is_verified', False)
        
        # Validate required fields
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required"
            )
        
        if not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required"
            )
        
        # Create user
        new_user = AdminService.create_user(
            db=db,
            email=email,
            password=password,
            username=username,
            role=role,
            is_active=is_active,
            is_verified=is_verified
        )
        
        return resp(new_user, message="User created successfully")
        
    except ValueError as e:
        logger.warning(f"Validation error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.patch("/users/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    user_data: dict,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update user status or role (Admin only)
    
    Path Parameters:
    - user_id: UUID of the user to update
    
    Request Body (all optional):
    {
        "is_active": true,
        "role": "admin",  # or "user"
        "password": "newpassword"  # optional
    }
    """
    try:
        # Extract data
        is_active = user_data.get('is_active')
        role = user_data.get('role')
        password = user_data.get('password')
        
        # Update user
        updated_user = AdminService.update_user(
            db=db,
            user_id=user_id,
            is_active=is_active,
            role=role,
            password=password
        )
        
        return resp(updated_user, message="User updated successfully")
        
    except ValueError as e:
        logger.warning(f"Validation error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.delete("/users/{user_id}", response_model=dict)
async def delete_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete a user (Admin only)
    
    Path Parameters:
    - user_id: UUID of the user to delete
    """
    try:
        AdminService.delete_user(db=db, user_id=user_id)
        return resp(message="User deleted successfully")
        
    except ValueError as e:
        logger.warning(f"Validation error deleting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )


@router.get("/analytics/users", response_model=dict)
async def get_user_analytics(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get user analytics (Admin only)
    
    Returns:
    {
        "total_users": 100,
        "active_users": 85,
        "verified_users": 70,
        "admin_users": 2,
        "recent_registrations": 15,
        "role_distribution": [
            {"role": "user", "count": 98},
            {"role": "admin", "count": 2}
        ]
    }
    """
    try:
        analytics = AdminService.get_user_analytics(db=db)
        return resp(analytics, message="Analytics retrieved successfully")
        
    except Exception as e:
        logger.error(f"Error computing analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compute analytics"
        )


@router.get("/health", response_model=dict)
async def admin_health_check(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Health check endpoint for admin service (Admin only)
    Verifies database connectivity
    """
    try:
        # Simple query to verify database is working
        user_count = db.query(User).count()
        
        return resp({
            "status": "healthy",
            "service": "admin",
            "database": "connected",
            "user_count": user_count
        }, message="Admin service is healthy")
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )

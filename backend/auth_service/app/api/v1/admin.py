from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from core.database_fixed import get_db, get_db_session
from auth_service.app.deps.auth import get_current_admin_user
from auth_service.app.models.user import User
from auth_service.app.schemas.user import UserOut
from core.app_factory import resp

router = APIRouter()

@router.get("/users")
async def get_all_users(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    is_verified: Optional[bool] = Query(None)
):
    """Get all users with pagination and filtering (Admin only)"""
    
    query = db.query(User)
    
    # Apply filters
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) |
            (User.username.ilike(f"%{search}%"))
        )
    
    if role:
        query = query.filter(User.role == role)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if is_verified is not None:
        query = query.filter(User.is_verified == is_verified)
    
    # Get total count
    total_count = query.count()
    
    # Apply pagination
    offset = (page - 1) * per_page
    users = query.order_by(desc(User.created_at)).offset(offset).limit(per_page).all()
    
    # Convert to response format
    users_data = []
    for user in users:
        users_data.append({
            "id": str(user.id),  # Convert UUID to string
            "email": user.email,
            "full_name": user.username or user.email.split('@')[0],  # Use username or email prefix as full_name
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "last_login": None,  # User model doesn't have last_login field
            "avatar": user.avatar,
            "providers": user.providers
        })
    
    # Return users array directly (AdminPanel expects array, not object with users key)
    return users_data

@router.post("/users")
async def create_user(
    user_data: dict,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new user (Admin only)"""
    
    # Extract data from request
    email = user_data.get('email')
    username = user_data.get('username')
    password = user_data.get('password')
    role = user_data.get('role', 'user')
    is_active = user_data.get('is_active', True)
    is_verified = user_data.get('is_verified', False)
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Validate role
    if role not in ['admin', 'user']:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'")
    
    # Create new user
    from auth_service.app.utils.jwt import get_password_hash
    
    new_user = User(
        email=email,
        username=username or email.split('@')[0],
        password_hash=get_password_hash(password),
        role=role,
        is_active=is_active,
        is_verified=is_verified,
        providers=["password"]
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": str(new_user.id),
        "email": new_user.email,
        "username": new_user.username,
        "role": new_user.role,
        "is_active": new_user.is_active,
        "is_verified": new_user.is_verified,
        "message": "User created successfully with the provided password."
    }

@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    user_data: dict,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user status or role (Admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Extract data from request
    is_active = user_data.get('is_active')
    role = user_data.get('role')
    password = user_data.get('password')
    
    # Skip self-protection checks for now since authentication is disabled
    # if str(user.id) == str(current_admin.id) and is_active is False:
    #     raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    # if str(user.id) == str(current_admin.id) and role and role != user.role:
    #     raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    if is_active is not None:
        user.is_active = is_active
    
    if role is not None:
        if role not in ['admin', 'user']:
            raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'")
        user.role = role
    
    # Update password if provided
    if password and password.strip():
        from auth_service.app.utils.jwt import get_password_hash
        user.password_hash = get_password_hash(password)
    
    db.commit()
    db.refresh(user)
    
    return resp({
        "id": str(user.id),
        "email": user.email,
        "full_name": user.username or user.email.split('@')[0],
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified
    }, message="User updated successfully")

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (Admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Skip self-protection check for now since authentication is disabled
    # if str(user.id) == str(current_admin.id):
    #     raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Delete user
    db.delete(user)
    db.commit()
    
    return resp(message="User deleted successfully")

@router.get("/analytics/users")
async def get_user_analytics(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get user analytics (Admin only)"""
    
    # Total users
    total_users = db.query(User).count()
    
    # Active users
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Verified users
    verified_users = db.query(User).filter(User.is_verified == True).count()
    
    # Admin users
    admin_users = db.query(User).filter(User.role == 'admin').count()
    
    # Recent registrations (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_registrations = db.query(User).filter(User.created_at >= thirty_days_ago).count()
    
    # Role distribution
    role_stats = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    role_distribution = [{"role": role, "count": count} for role, count in role_stats]
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "verified_users": verified_users,
        "admin_users": admin_users,
        "recent_registrations": recent_registrations,
        "role_distribution": role_distribution
    }

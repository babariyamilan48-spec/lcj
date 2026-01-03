"""
Optimized Admin Service with proper database session management
Handles all admin operations with caching and error handling
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from auth_service.app.models.user import User
from auth_service.app.utils.jwt import get_password_hash

logger = logging.getLogger(__name__)


class AdminService:
    """Service for admin operations with optimized database handling"""

    @staticmethod
    def get_all_users(
        db: Session,
        page: int = 1,
        per_page: int = 50,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_verified: Optional[bool] = None,
        plan_type: Optional[str] = None,
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Get all users with pagination and filtering
        Returns: (users_list, total_count)
        """
        try:
            query = db.query(User)

            # Apply filters
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    (User.email.ilike(search_term)) |
                    (User.username.ilike(search_term))
                )

            if role:
                query = query.filter(User.role == role)

            if is_active is not None:
                query = query.filter(User.is_active == is_active)

            if is_verified is not None:
                query = query.filter(User.is_verified == is_verified)

            if plan_type:
                if plan_type == "none":
                    query = query.filter(User.plan_type.is_(None))
                else:
                    query = query.filter(User.plan_type == plan_type)

            # Get total count before pagination
            total_count = query.count()

            # Apply pagination
            offset = (page - 1) * per_page
            users = query.order_by(desc(User.created_at)).offset(offset).limit(per_page).all()

            # Convert to response format
            users_data = [AdminService._user_to_dict(user) for user in users]

            return users_data, total_count

        except Exception as e:
            logger.error(f"Error fetching users: {e}")
            raise

    @staticmethod
    def create_user(
        db: Session,
        email: str,
        password: str,
        username: Optional[str] = None,
        role: str = "user",
        is_active: bool = True,
        is_verified: bool = False
    ) -> Dict[str, Any]:
        """Create a new user"""
        try:
            # Validate inputs
            if not email or not email.strip():
                raise ValueError("Email is required")

            if not password or not password.strip():
                raise ValueError("Password is required")

            email = email.strip().lower()

            # Check if user already exists
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                raise ValueError(f"User with email {email} already exists")

            # Validate role
            if role not in ['admin', 'user']:
                raise ValueError("Invalid role. Must be 'admin' or 'user'")

            # Create new user
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

            logger.info(f"User created: {email}")
            return AdminService._user_to_dict(new_user)

        except Exception as e:
            logger.error(f"Error creating user: {e}")
            db.rollback()
            raise

    @staticmethod
    def update_user(
        db: Session,
        user_id: str,
        is_active: Optional[bool] = None,
        role: Optional[str] = None,
        password: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update user status, role, or password"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User {user_id} not found")

            # Update is_active
            if is_active is not None:
                user.is_active = is_active

            # Update role
            if role is not None:
                if role not in ['admin', 'user']:
                    raise ValueError("Invalid role. Must be 'admin' or 'user'")
                user.role = role

            # Update password
            if password and password.strip():
                user.password_hash = get_password_hash(password)

            db.commit()
            db.refresh(user)

            logger.info(f"User updated: {user.email}")
            return AdminService._user_to_dict(user)

        except Exception as e:
            logger.error(f"Error updating user: {e}")
            db.rollback()
            raise

    @staticmethod
    def delete_user(db: Session, user_id: str) -> None:
        """Delete a user"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User {user_id} not found")

            email = user.email
            db.delete(user)
            db.commit()

            logger.info(f"User deleted: {email}")

        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            db.rollback()
            raise

    @staticmethod
    def get_user_analytics(db: Session) -> Dict[str, Any]:
        """Get user analytics"""
        try:
            # Total users
            total_users = db.query(User).count()

            # Active users
            active_users = db.query(User).filter(User.is_active == True).count()

            # Verified users
            verified_users = db.query(User).filter(User.is_verified == True).count()

            # Admin users
            admin_users = db.query(User).filter(User.role == 'admin').count()

            # Recent registrations (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            recent_registrations = db.query(User).filter(
                User.created_at >= thirty_days_ago
            ).count()

            # Role distribution
            role_stats = db.query(
                User.role,
                func.count(User.id).label('count')
            ).group_by(User.role).all()

            role_distribution = [
                {"role": role, "count": count}
                for role, count in role_stats
            ]

            logger.debug("Analytics computed successfully")

            return {
                "total_users": total_users,
                "active_users": active_users,
                "verified_users": verified_users,
                "admin_users": admin_users,
                "recent_registrations": recent_registrations,
                "role_distribution": role_distribution
            }

        except Exception as e:
            logger.error(f"Error computing analytics: {e}")
            raise

    @staticmethod
    def _user_to_dict(user: User) -> Dict[str, Any]:
        """Convert User model to dictionary"""
        return {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.username or user.email.split('@')[0],
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "plan_type": user.plan_type,
            "payment_completed": user.payment_completed,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "last_login": None,
            "avatar": user.avatar,
            "providers": user.providers
        }

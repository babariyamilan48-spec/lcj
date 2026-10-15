"""
Optimized Admin Service with proper database session management
Handles all admin operations with caching and error handling
"""
import logging
import random
import re
import string
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text

from auth_service.app.models.user import User, School
from auth_service.app.utils.jwt import get_password_hash
from question_service.app.models.test_result import TestResult
from core.cache import cache

logger = logging.getLogger(__name__)

# Sentinel for update_user: distinguishes "field not provided" from explicit None (unlink school)
_UNSET = object()


class AdminService:
    """Service for admin operations with optimized database handling"""

    @staticmethod
    def _invalidate_user_cache(user_id: str) -> None:
        """Best-effort cache invalidation for any user mutations."""
        cache_keys_to_clear = [
            f"user_session:{user_id}",
            f"user_profile:get_user_profile:{user_id}",
            f"fast_user_me:get_current_user_fast:{user_id}",
            f"user_results:{user_id}",
            f"user_analytics:{user_id}",
        ]

        for cache_key in cache_keys_to_clear:
            try:
                cache.delete(cache_key)
            except Exception as cache_error:
                logger.warning(f"Failed to clear cache {cache_key}: {cache_error}")

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
        payment_completed: Optional[bool] = None,
        has_completed_test: Optional[bool] = None,
        counseling_completed: Optional[bool] = None,
        school_id: Optional[str] = None,
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

            if payment_completed is not None:
                query = query.filter(User.payment_completed == payment_completed)

            if has_completed_test is not None:
                has_test_subquery = db.query(TestResult.user_id).filter(TestResult.is_completed == True)
                if has_completed_test:
                    query = query.filter(User.id.in_(has_test_subquery))
                else:
                    query = query.filter(~User.id.in_(has_test_subquery))

            if counseling_completed is not None:
                query = query.filter(User.counseling_completed == counseling_completed)

            if school_id is not None:
                if school_id == "none":
                    query = query.filter(User.school_id.is_(None))
                else:
                    query = query.filter(User.school_id == school_id)

            # Get total count before pagination
            total_count = query.count()

            # Apply pagination
            offset = (page - 1) * per_page
            users = query.order_by(desc(User.created_at)).offset(offset).limit(per_page).all()

            # ✅ Batch-fetch school names for the page (avoids N+1 queries)
            school_ids = {u.school_id for u in users if u.school_id}
            school_names: Dict[str, str] = {}
            if school_ids:
                for s in db.query(School).filter(School.id.in_(school_ids)).all():
                    school_names[str(s.id)] = s.name

            # Convert to response format
            users_data = [
                AdminService._user_to_dict(
                    user,
                    school_name=school_names.get(str(user.school_id)) if user.school_id else None,
                )
                for user in users
            ]

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
        password: Optional[str] = None,
        school_id: Any = _UNSET,
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

            # Update school link (school_id=None unlinks, sentinel = don't touch)
            if school_id is not _UNSET:
                if school_id is not None:
                    school = db.query(School).filter(School.id == school_id).first()
                    if not school:
                        raise ValueError(f"School {school_id} not found")
                user.school_id = school_id

            db.commit()
            db.refresh(user)

            AdminService._invalidate_user_cache(str(user.id))

            logger.info(f"User updated: {user.email}")
            school_name = None
            if user.school_id:
                linked_school = db.query(School).filter(School.id == user.school_id).first()
                school_name = linked_school.name if linked_school else None
            return AdminService._user_to_dict(user, school_name=school_name)

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
            deleted_user_id = str(user.id)
            db.delete(user)
            db.commit()

            AdminService._invalidate_user_cache(deleted_user_id)

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
    def update_counseling_status(
        db: Session,
        user_id: str,
        counseling_completed: bool
    ) -> User:
        """Update user's counseling status"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User {user_id} not found")

            user.counseling_completed = counseling_completed
            if counseling_completed:
                user.counseling_completed_at = datetime.utcnow()
            else:
                user.counseling_completed_at = None

            db.commit()
            db.refresh(user)

            AdminService._invalidate_user_cache(str(user.id))

            logger.info(f"Counseling status updated for user {user.email}: {counseling_completed}")
            return user

        except Exception as e:
            logger.error(f"Error updating counseling status: {e}")
            db.rollback()
            raise

    @staticmethod
    def _user_to_dict(user: User, school_name: Optional[str] = None) -> Dict[str, Any]:
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
            "counseling_completed": user.counseling_completed,
            "counseling_completed_at": user.counseling_completed_at.isoformat() if user.counseling_completed_at else None,
            "phone_number": user.phone_number,
            "school_id": str(user.school_id) if user.school_id else None,
            "school_name": school_name,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "last_login": None,
            "avatar": user.avatar,
            "providers": user.providers
        }

    # ------------------------------------------------------------------
    # Partner schools (free access for linked students)
    # ------------------------------------------------------------------

    @staticmethod
    def _generate_school_code(db: Session, name: str) -> str:
        """Generate a unique uppercase access code from the school name."""
        slug = re.sub(r"[^A-Za-z0-9]", "", name).upper()[:20] or "SCHOOL"
        for _ in range(50):
            suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
            code = f"{slug}-{suffix}"
            if not db.query(School).filter(School.code == code).first():
                return code
        raise ValueError("Could not generate a unique school code — try a different name")

    @staticmethod
    def school_to_dict(school: School, student_count: int = 0) -> Dict[str, Any]:
        return {
            "id": str(school.id),
            "name": school.name,
            "code": school.code,
            "is_active": school.is_active,
            "contact_email": school.contact_email,
            "student_count": student_count,
            "created_at": school.created_at.isoformat() if school.created_at else None,
            "updated_at": school.updated_at.isoformat() if school.updated_at else None,
        }

    @staticmethod
    def get_schools(db: Session) -> List[Dict[str, Any]]:
        """List all schools (active + inactive) with linked student counts."""
        rows = (
            db.query(School, func.count(User.id).label("student_count"))
            .outerjoin(User, User.school_id == School.id)
            .group_by(School.id)
            .order_by(desc(School.created_at))
            .all()
        )
        return [AdminService.school_to_dict(school, count) for school, count in rows]

    @staticmethod
    def create_school(db: Session, name: str, contact_email: Optional[str] = None) -> Dict[str, Any]:
        """Create a partner school with an auto-generated unique code."""
        try:
            name = (name or "").strip()
            if not name:
                raise ValueError("School name is required")

            code = AdminService._generate_school_code(db, name)
            school = School(name=name, code=code, contact_email=contact_email or None)
            db.add(school)
            db.commit()
            db.refresh(school)
            logger.info(f"School created: {name} ({code})")
            return AdminService.school_to_dict(school)
        except Exception as e:
            db.rollback()
            raise

    @staticmethod
    def update_school(db: Session, school_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        """Update a school — only fields present in `changes` are modified."""
        try:
            school = db.query(School).filter(School.id == school_id).first()
            if not school:
                raise ValueError(f"School {school_id} not found")

            if "name" in changes and changes["name"] is not None:
                new_name = changes["name"].strip()
                if not new_name:
                    raise ValueError("School name cannot be empty")
                school.name = new_name

            if "code" in changes and changes["code"] is not None:
                new_code = changes["code"].strip().upper()
                if not re.fullmatch(r"[A-Z0-9-]{4,40}", new_code):
                    raise ValueError("Code must be 4-40 characters: letters, digits, hyphens")
                existing = db.query(School).filter(School.code == new_code, School.id != school.id).first()
                if existing:
                    raise ValueError(f"Code {new_code} is already used by another school")
                school.code = new_code

            if "contact_email" in changes:
                school.contact_email = changes["contact_email"] or None

            if "is_active" in changes and changes["is_active"] is not None:
                school.is_active = bool(changes["is_active"])

            db.commit()
            db.refresh(school)
            logger.info(f"School updated: {school.name} ({school.code})")

            count = db.query(User).filter(User.school_id == school.id).count()
            return AdminService.school_to_dict(school, count)
        except Exception as e:
            db.rollback()
            raise

    @staticmethod
    def delete_school(db: Session, school_id: str, force: bool = False) -> Dict[str, Any]:
        """Delete a school. Blocked (ValueError) while students are linked unless force=True."""
        try:
            school = db.query(School).filter(School.id == school_id).first()
            if not school:
                raise ValueError(f"School {school_id} not found")

            student_count = db.query(User).filter(User.school_id == school.id).count()
            if student_count > 0 and not force:
                raise ValueError(
                    f"School has {student_count} linked students. "
                    f"Deactivate it instead, or retry with force=true to unlink them."
                )

            # Unlink students first (FK is ON DELETE SET NULL, but be explicit)
            db.query(User).filter(User.school_id == school.id).update(
                {User.school_id: None}, synchronize_session=False
            )
            db.delete(school)
            db.commit()
            logger.info(f"School deleted: {school.name} (students unlinked: {student_count})")
            return {"deleted": True, "unlinked_students": student_count}
        except Exception:
            db.rollback()
            raise

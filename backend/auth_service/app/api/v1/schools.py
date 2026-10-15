"""
Partner-school endpoints: active school dropdown + access-code redemption
Students of an active partner school get free test access (no payment).
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from core.config.settings import settings
from core.database_fixed import get_db
from core.rate_limit import limiter
from auth_service.app.models.user import User, School
from auth_service.app.deps.auth import get_current_user
from auth_service.app.schemas.school import (
    SchoolActiveOut,
    RedeemSchoolCodeRequest,
    RedeemSchoolCodeResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Schools"])


@router.get("/schools/active", response_model=list[SchoolActiveOut])
async def list_active_schools(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Public (logged-in) endpoint for the student dropdown.
    Returns only active schools — codes are never exposed here.
    Returns an empty list when the feature is toggled off (PARTNER_SCHOOL_ENABLED=false).
    """
    try:
        if not settings.PARTNER_SCHOOL_ENABLED:
            return []
        schools = (
            db.query(School)
            .filter(School.is_active == True)  # noqa: E712
            .order_by(School.name.asc())
            .all()
        )
        return [SchoolActiveOut(id=s.id, name=s.name) for s in schools]
    except Exception as e:
        logger.error(f"Error listing active schools: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load schools",
        )


@router.post("/school-code/redeem", response_model=RedeemSchoolCodeResponse)
@limiter.limit("5/minute")
async def redeem_school_code(
    request: Request,
    payload: RedeemSchoolCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Redeem a school access code to unlock free test access.

    - Select a school (from /schools/active) + enter its code.
    - Rate-limited to 5/min per IP to prevent code brute-forcing.
    - Idempotent if already linked to the same school.
    - 409 if linked to a *different* school (no silent switching).
    - 403 when PARTNER_SCHOOL_ENABLED=false (feature toggled off).
    """
    try:
        if not settings.PARTNER_SCHOOL_ENABLED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Partner school access is currently disabled",
            )

        school = db.query(School).filter(School.id == payload.school_id).first()
        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found",
            )

        if not school.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This school is not currently active",
            )

        code = (payload.code or "").strip().upper()
        if code != school.code.strip().upper():
            logger.warning(
                f"Wrong school code attempt by user {current_user.id} for school {school.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid access code for the selected school",
            )

        # Idempotent: already linked to this school
        if current_user.school_id == school.id:
            return RedeemSchoolCodeResponse(success=True, school_name=school.name)

        # No silent switching between schools
        if current_user.school_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Your account is already linked to a different school. Contact support to change it.",
            )

        current_user.school_id = school.id
        db.add(current_user)
        db.commit()
        logger.info(f"User {current_user.id} linked to school {school.id} ({school.name})")

        return RedeemSchoolCodeResponse(success=True, school_name=school.name)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error redeeming school code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to redeem school code",
        )

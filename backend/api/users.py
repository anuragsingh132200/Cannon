"""
Users API - Profile and Onboarding
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId
from typing import List

from db import get_database
from middleware import get_current_user
from models.user import (
    UserResponse, OnboardingData, UserProfile, GoalType, ExperienceLevel
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user's profile
    """
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        created_at=current_user["created_at"],
        is_paid=current_user.get("is_paid", False),
        subscription_status=current_user.get("subscription_status"),
        subscription_end_date=current_user.get("subscription_end_date"),
        onboarding=OnboardingData(**current_user.get("onboarding", {})),
        profile=UserProfile(**current_user.get("profile", {})),
        first_scan_completed=current_user.get("first_scan_completed", False),
        is_admin=current_user.get("is_admin", False)
    )


@router.post("/onboarding")
async def save_onboarding(
    data: OnboardingData,
    current_user: dict = Depends(get_current_user)
):
    """
    Save onboarding questionnaire answers
    """
    db = get_database()
    
    # Update onboarding data
    onboarding_data = data.model_dump()
    onboarding_data["completed"] = True
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {
            "$set": {
                "onboarding": onboarding_data,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Onboarding completed", "data": onboarding_data}


@router.put("/profile")
async def update_profile(
    profile: UserProfile,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user profile
    """
    db = get_database()
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {
            "$set": {
                "profile": profile.model_dump(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Profile updated"}


@router.get("/goals", response_model=List[str])
async def get_available_goals():
    """
    Get list of available improvement goals
    """
    return [goal.value for goal in GoalType]


@router.get("/experience-levels", response_model=List[str])
async def get_experience_levels():
    """
    Get list of experience levels
    """
    return [level.value for level in ExperienceLevel]

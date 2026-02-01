from typing import Any, Annotated
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserUpdate, PasswordChange, UserResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: Annotated[User, Depends(deps.get_current_user)],
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_in: UserUpdate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Any:
    """
    Update own user (email, full_name).
    """
    if user_in.email:
        # Check if email is already taken
        result = await db.execute(select(User).filter(User.email == user_in.email))
        existing_user = result.scalars().first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        current_user.email = user_in.email
    
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Any:
    """
    Upload user avatar.
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
        )
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB.",
        )
    
    # Generate filename and save
    import os
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.id}.{ext}"
    filepath = f"app/static/avatars/{filename}"
    
    # Save file
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # Update user avatar_url
    current_user.avatar_url = f"/static/avatars/{filename}"
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    password_in: PasswordChange,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Any:
    """
    Change user password.
    """
    if not verify_password(password_in.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password",
        )
    
    current_user.password_hash = get_password_hash(password_in.new_password)
    db.add(current_user)
    await db.commit()
    return {"message": "Password updated successfully"}

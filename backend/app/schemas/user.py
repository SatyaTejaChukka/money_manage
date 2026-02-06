from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.core.config import settings
from app.schemas.auth import UserBase

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    
class PasswordChange(BaseModel):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=settings.PASSWORD_MIN_LENGTH, max_length=128)

class UserResponse(UserBase):
    id: str
    is_active: bool
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True

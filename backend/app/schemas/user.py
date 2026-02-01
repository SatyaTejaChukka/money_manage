from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.auth import UserBase

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    
class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True

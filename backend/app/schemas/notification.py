from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    action_url: Optional[str] = None
    related_id: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: str
    user_id: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

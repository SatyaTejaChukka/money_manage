from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel
from app.schemas.budget import CategoryResponse

class SubscriptionBase(BaseModel):
    name: str
    amount: Decimal
    billing_cycle: str = "monthly"
    next_billing_date: Optional[datetime] = None
    is_active: bool = True
    category_id: Optional[str] = None

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    category_id: Optional[str] = None

class SubscriptionResponse(SubscriptionBase):
    id: str
    user_id: str
    usage_count: int
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

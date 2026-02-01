from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel

class SubscriptionBase(BaseModel):
    name: str
    amount: Decimal
    billing_cycle: str = "monthly"
    next_billing_date: Optional[datetime] = None
    active: bool = True

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(SubscriptionBase):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[datetime] = None
    active: Optional[bool] = None

class SubscriptionResponse(SubscriptionBase):
    id: str
    user_id: str
    usage_count: int

    class Config:
        from_attributes = True

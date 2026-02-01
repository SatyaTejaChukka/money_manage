from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel

class BillBase(BaseModel):
    name: str
    amount_estimated: Decimal
    due_day: int # 1-31
    frequency: str = "monthly"
    autopay_enabled: bool = False

class BillCreate(BillBase):
    pass

class BillUpdate(BillBase):
    name: Optional[str] = None
    amount_estimated: Optional[Decimal] = None
    due_day: Optional[int] = None
    frequency: Optional[str] = None
    autopay_enabled: Optional[bool] = None

class BillResponse(BillBase):
    id: str
    user_id: str
    last_paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True

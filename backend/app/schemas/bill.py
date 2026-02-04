from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel
from app.schemas.budget import CategoryResponse

class BillBase(BaseModel):
    name: str
    amount_estimated: Decimal
    due_day: int # 1-31
    frequency: str = "monthly"
    autopay_enabled: bool = False
    category_id: Optional[str] = None

class BillCreate(BillBase):
    pass

class BillUpdate(BaseModel):
    name: Optional[str] = None
    amount_estimated: Optional[Decimal] = None
    due_day: Optional[int] = None
    frequency: Optional[str] = None
    autopay_enabled: Optional[bool] = None
    category_id: Optional[str] = None

class BillResponse(BillBase):
    id: str
    user_id: str
    last_paid_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

from typing import Optional
from decimal import Decimal
from pydantic import BaseModel

class IncomeSourceBase(BaseModel):
    amount: Decimal
    frequency: str = "monthly"
    payday: Optional[str] = None
    active: bool = True

class IncomeSourceCreate(IncomeSourceBase):
    pass

class IncomeSourceUpdate(IncomeSourceBase):
    amount: Optional[Decimal] = None
    frequency: Optional[str] = None
    active: Optional[bool] = None

class IncomeSourceResponse(IncomeSourceBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True

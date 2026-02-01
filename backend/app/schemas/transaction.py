from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel
from app.schemas.budget import CategoryResponse

class TransactionBase(BaseModel):
    category_id: Optional[str] = None
    amount: Decimal
    type: str  # "INCOME" or "EXPENSE"
    description: Optional[str] = None
    occurred_at: Optional[datetime] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(TransactionBase):
    category_id: Optional[str] = None
    amount: Optional[Decimal] = None
    type: Optional[str] = None
    description: Optional[str] = None
    occurred_at: Optional[datetime] = None

class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel

class SavingsGoalBase(BaseModel):
    name: str
    target_amount: Decimal
    current_amount: Optional[Decimal] = 0
    monthly_contribution: Optional[Decimal] = 0
    target_date: Optional[datetime] = None
    priority: int = 5 

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalUpdate(SavingsGoalBase):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    current_amount: Optional[Decimal] = None
    monthly_contribution: Optional[Decimal] = None
    target_date: Optional[datetime] = None
    priority: Optional[int] = None
    is_completed: Optional[bool] = None

class SavingsGoalResponse(SavingsGoalBase):
    id: str
    user_id: str
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SavingsLogResponse(BaseModel):
    id: str
    goal_id: str
    amount: Decimal
    note: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class SavingsContribution(BaseModel):
    amount: Decimal
    note: Optional[str] = None

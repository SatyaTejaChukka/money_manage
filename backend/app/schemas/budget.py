from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str
    color: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None
    color: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: str
    user_id: str
    
    class Config:
        from_attributes = True

# --- Rule Schemas ---
class BudgetRuleBase(BaseModel):
    category_id: str
    allocation_type: str # "FIXED" or "PERCENT"
    allocation_value: Decimal
    monthly_limit: Optional[Decimal] = None

class BudgetRuleCreate(BudgetRuleBase):
    pass

class BudgetRuleUpdate(BudgetRuleBase):
    allocation_type: Optional[str] = None
    allocation_value: Optional[Decimal] = None
    monthly_limit: Optional[Decimal] = None

class BudgetRuleResponse(BudgetRuleBase):
    id: str
    user_id: str
    category: Optional[CategoryResponse] = None # For nested display if needed

    class Config:
        from_attributes = True

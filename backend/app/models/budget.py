from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from uuid import uuid4
from app.core.database import Base

class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, nullable=True)
    
    rules = relationship("BudgetRule", back_populates="category", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="category")

class BudgetRule(Base):
    __tablename__ = "budget_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, index=True, nullable=False)
    category_id = Column(String, ForeignKey("budget_categories.id"), nullable=False)
    allocation_type = Column(String, nullable=False) # FIXED or PERCENT
    allocation_value = Column(Numeric(14,2), nullable=False)
    monthly_limit = Column(Numeric(14,2), nullable=True)

    category = relationship("BudgetCategory", back_populates="rules")

from sqlalchemy import Column, String, Numeric, Boolean
from uuid import uuid4
from app.core.database import Base

class IncomeSource(Base):
    __tablename__ = "income_sources"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, index=True, nullable=False)
    amount = Column(Numeric(14,2), nullable=False)
    frequency = Column(String, default="monthly")
    payday = Column(String, nullable=True) # e.g., "1st", "Last"
    active = Column(Boolean, default=True)

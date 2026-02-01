from sqlalchemy import Column, String, Numeric, Integer, DateTime, Boolean
from uuid import uuid4
from datetime import datetime
from app.core.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    amount = Column(Numeric(14,2), nullable=False)
    billing_cycle = Column(String, default="monthly") # monthly, yearly
    next_billing_date = Column(DateTime, nullable=True)
    usage_count = Column(Integer, default=0) # For "Cost per usage" analysis
    active = Column(Boolean, default=True)

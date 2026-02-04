from sqlalchemy import Column, String, DateTime, Boolean, Text
from uuid import uuid4
from datetime import datetime
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False) # bill_reminder, bill_overdue, subscription_renewal, payment_success
    read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True) # Link to related transaction/bill
    related_id = Column(String, nullable=True) # ID of related bill/transaction
    created_at = Column(DateTime, default=datetime.utcnow)

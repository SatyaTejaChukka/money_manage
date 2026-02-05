from sqlalchemy import Column, String, Integer, DateTime
from uuid import uuid4
from datetime import datetime
from app.core.database import Base

class FinancialHealthScore(Base):
    """Store historical health score data for tracking trends"""
    __tablename__ = "health_scores"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, index=True, nullable=False)
    score = Column(Integer, nullable=False)  # 0-100
    
    # Component scores
    savings_score = Column(Integer, nullable=False)
    budget_adherence_score = Column(Integer, nullable=False)
    bill_punctuality_score = Column(Integer, nullable=False)
    
    calculated_at = Column(DateTime, default=datetime.utcnow)

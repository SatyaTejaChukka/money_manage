from pydantic import BaseModel
from datetime import datetime

class HealthScoreResponse(BaseModel):
    score: int  # Overall score 0-100
    savings_score: int
    budget_adherence_score: int
    bill_punctuality_score: int
    calculated_at: datetime
    grade: str  # A, B, C, D, F
    message: str  # Encouraging message based on score
    
    class Config:
        from_attributes = True

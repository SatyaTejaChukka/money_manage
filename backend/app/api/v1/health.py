from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.health_score import HealthScoreResponse
from app.services.health_score_calculator import HealthScoreCalculator

router = APIRouter()

@router.get("/score", response_model=HealthScoreResponse)
async def get_health_score(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the current financial health score for the authenticated user"""
    score_data = await HealthScoreCalculator.calculate_overall_score(db, current_user.id)
    return HealthScoreResponse(**score_data)

from typing import Any, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import uuid4

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.income import IncomeSource
from app.schemas.income import IncomeSourceCreate, IncomeSourceUpdate, IncomeSourceResponse

router = APIRouter()

@router.post("/", response_model=IncomeSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_income(
    income_in: IncomeSourceCreate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Create a new income source.
    """
    income = IncomeSource(
        id=str(uuid4()),
        user_id=current_user.id,
        **income_in.model_dump()
    )
    db.add(income)
    await db.commit()
    await db.refresh(income)
    return income

@router.get("/", response_model=List[IncomeSourceResponse])
async def read_incomes(
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Retrieve all income sources for the current user.
    """
    result = await db.execute(select(IncomeSource).filter(IncomeSource.user_id == current_user.id))
    incomes = result.scalars().all()
    return incomes

@router.put("/{income_id}", response_model=IncomeSourceResponse)
async def update_income(
    income_id: str,
    income_in: IncomeSourceUpdate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Update an income source.
    """
    result = await db.execute(
        select(IncomeSource).filter(IncomeSource.id == income_id, IncomeSource.user_id == current_user.id)
    )
    income = result.scalars().first()
    if not income:
        raise HTTPException(status_code=404, detail="Income source not found")

    update_data = income_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(income, field, value)

    db.add(income)
    await db.commit()
    await db.refresh(income)
    return income

@router.delete("/{income_id}", response_model=IncomeSourceResponse)
async def delete_income(
    income_id: str,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Delete an income source.
    """
    result = await db.execute(
        select(IncomeSource).filter(IncomeSource.id == income_id, IncomeSource.user_id == current_user.id)
    )
    income = result.scalars().first()
    if not income:
        raise HTTPException(status_code=404, detail="Income source not found")

    await db.delete(income)
    await db.commit()
    return income

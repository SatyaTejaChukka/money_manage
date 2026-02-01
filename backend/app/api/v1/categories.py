from typing import Any, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import uuid4

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.budget import BudgetCategory
from app.schemas.budget import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter()

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Create a new budget category.
    """
    # Check for duplicates? For now allow same names.
    category = BudgetCategory(
        id=str(uuid4()),
        user_id=current_user.id,
        **category_in.model_dump()
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.get("/", response_model=List[CategoryResponse])
async def read_categories(
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Retrieve all categories for the current user.
    """
    result = await db.execute(select(BudgetCategory).filter(BudgetCategory.user_id == current_user.id))
    categories = result.scalars().all()
    return categories

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_in: CategoryUpdate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Update a category.
    """
    result = await db.execute(
        select(BudgetCategory).filter(BudgetCategory.id == category_id, BudgetCategory.user_id == current_user.id)
    )
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/{category_id}", response_model=CategoryResponse)
async def delete_category(
    category_id: str,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Delete a category.
    """
    result = await db.execute(
        select(BudgetCategory).filter(BudgetCategory.id == category_id, BudgetCategory.user_id == current_user.id)
    )
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    await db.delete(category)
    await db.commit()
    return category

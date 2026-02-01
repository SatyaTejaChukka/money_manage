from typing import Any, Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.income import IncomeSource
from app.models.budget import BudgetRule, BudgetCategory
from app.models.transaction import Transaction
from app.schemas.budget import BudgetRuleCreate, BudgetRuleUpdate, BudgetRuleResponse
from app.services.budget_engine import BudgetEngine
from sqlalchemy.orm import selectinload

# Re-import other routes...
from uuid import uuid4
from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload

router = APIRouter()

# ... (Keep existing CRUD operations for Rules) ...

@router.post("/rules", response_model=BudgetRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_budget_rule(
    rule_in: BudgetRuleCreate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    # Check if category exists and belongs to user
    cat = await db.execute(select(BudgetCategory).filter(BudgetCategory.id == rule_in.category_id, BudgetCategory.user_id == current_user.id))
    if not cat.scalars().first():
        raise HTTPException(status_code=404, detail="Category not found")

    rule = BudgetRule(
        id=str(uuid4()),
        user_id=current_user.id,
        **rule_in.model_dump()
    )
    db.add(rule)
    await db.commit()
    
    # Reload with relationship (refresh doesn't load relations in async)
    result = await db.execute(
        select(BudgetRule)
        .options(selectinload(BudgetRule.category))
        .filter(BudgetRule.id == rule.id)
    )
    return result.scalars().first()

@router.get("/rules", response_model=list[BudgetRuleResponse])
async def read_budget_rules(
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    result = await db.execute(
        select(BudgetRule)
        .options(selectinload(BudgetRule.category))
        .filter(BudgetRule.user_id == current_user.id)
    )
    return result.scalars().all()

@router.put("/rules/{rule_id}", response_model=BudgetRuleResponse)
async def update_budget_rule(
    rule_id: str,
    rule_in: BudgetRuleUpdate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    result = await db.execute(select(BudgetRule).filter(BudgetRule.id == rule_id, BudgetRule.user_id == current_user.id))
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    for k, v in rule_in.model_dump(exclude_unset=True).items():
        setattr(rule, k, v)
    
    db.add(rule)
    await db.commit()
    
    # Reload with relationship
    result = await db.execute(
        select(BudgetRule)
        .options(selectinload(BudgetRule.category))
        .filter(BudgetRule.id == rule.id)
    )
    return result.scalars().first()

@router.delete("/rules/{rule_id}", response_model=BudgetRuleResponse)
async def delete_budget_rule(
    rule_id: str,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    # Need to load before deleting if we want to return it with relation, 
    # but usually delete just returns basic info or id. 
    # However, response_model is BudgetRuleResponse which expects category?
    # Actually, if we delete it, we can't easily fetch it.
    # We should probably load it, then delete it.
    
    result = await db.execute(
        select(BudgetRule)
        .options(selectinload(BudgetRule.category))
        .filter(BudgetRule.id == rule_id, BudgetRule.user_id == current_user.id)
    )
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    await db.delete(rule)
    await db.commit()
    return rule


@router.get("/summary")
async def get_budget_summary(
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    month: int = Query(default=datetime.utcnow().month),
    year: int = Query(default=datetime.utcnow().year)
) -> Any:
    """
    Calculate and return the budget summary dashboard data using Budget Engine.
    """
    # Fetch all necessary data
    # 1. Incomes
    incomes_res = await db.execute(select(IncomeSource).filter(IncomeSource.user_id == current_user.id))
    incomes = incomes_res.scalars().all()
    
    # 2. Rules
    rules_res = await db.execute(select(BudgetRule).filter(BudgetRule.user_id == current_user.id))
    rules = rules_res.scalars().all()
    
    # 3. Transactions (for the specific month)
    # Note: Logic to filter by month should ideally happen in DB query for performance, 
    # but for MVP filtering in python or fetching all and filtering is acceptable if volume is low.
    # Let's simple filter in DB:
    # This requires start/end date calculation
    # For now, let's fetch all (simple) or improve query.
    
    transactions_res = await db.execute(select(Transaction).filter(Transaction.user_id == current_user.id))
    transactions = transactions_res.scalars().all()
    
    # Calculate
    summary = BudgetEngine.calculate_monthly_overview(
        incomes=incomes,
        rules=rules,
        transactions=transactions,
        year=year,
        month=month
    )
    
    return summary

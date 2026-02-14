from typing import Any, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, case, extract
from datetime import datetime, timedelta

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.budget import BudgetCategory
from app.models.transaction import Transaction
from app.models.savings import SavingsGoal
from app.services.health_score import HealthScoreService
from app.services.financial_triage import FinancialTriageService
from app.services.autopilot import AutopilotService
from app.schemas.triage import FinancialTriageResponse
from pydantic import BaseModel
from decimal import Decimal

router = APIRouter()

class DashboardStats(BaseModel):
    total_balance: Decimal
    balance_change: float
    monthly_income: Decimal
    monthly_expenses: Decimal
    income_change: float
    expenses_change: float
    total_savings: Decimal
    health_score: dict
    recent_transactions: List[dict]
    spending_chart: List[dict]
    category_chart: List[dict]
    safe_to_spend_stats: dict

@router.get("/summary", response_model=DashboardStats)
async def get_dashboard_summary(
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    chart_range: str = Query(default="week", pattern="^(week|month)$")
) -> Any:
    """
    Get aggregated dashboard statistics.
    """
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Total Balance & Savings
    query_all = select(Transaction).filter(Transaction.user_id == current_user.id)
    result_all = await db.execute(query_all)
    all_transactions = result_all.scalars().all()
    
    total_income = sum(t.amount for t in all_transactions if t.type == 'INCOME')
    total_expenses = sum(t.amount for t in all_transactions if t.type == 'EXPENSE')
    total_balance = total_income - total_expenses
    
    # Calculate total savings from goals
    savings_query = select(func.sum(SavingsGoal.current_amount)).filter(SavingsGoal.user_id == current_user.id)
    savings_res = await db.execute(savings_query)
    total_savings = savings_res.scalar() or Decimal(0)

    # 2. Monthly Stats
    monthly_trans = [t for t in all_transactions if t.occurred_at >= start_of_month]
    monthly_income = sum(t.amount for t in monthly_trans if t.type == 'INCOME')
    monthly_expenses = sum(t.amount for t in monthly_trans if t.type == 'EXPENSE')

    # Previous Month Stats
    if now.month == 1:
        start_of_prev_month = now.replace(year=now.year-1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start_of_prev_month = now.replace(month=now.month-1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    prev_month_trans = [t for t in all_transactions if t.occurred_at >= start_of_prev_month and t.occurred_at < start_of_month]
    prev_income = sum(t.amount for t in prev_month_trans if t.type == 'INCOME')
    prev_expenses = sum(t.amount for t in prev_month_trans if t.type == 'EXPENSE')

    def calc_change(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return float((current - previous) / previous * 100)

    income_change = calc_change(monthly_income, prev_income)
    expenses_change = calc_change(monthly_expenses, prev_expenses)

    # Balance Trend
    prev_balance_res = await db.execute(select(Transaction).filter(Transaction.user_id == current_user.id, Transaction.occurred_at < start_of_month))
    prev_balance_trans = prev_balance_res.scalars().all()
    prev_balance_income = sum(t.amount for t in prev_balance_trans if t.type == 'INCOME')
    prev_balance_expenses = sum(t.amount for t in prev_balance_trans if t.type == 'EXPENSE')
    prev_total_balance = prev_balance_income - prev_balance_expenses
    
    balance_change = calc_change(total_balance, prev_total_balance)

    # Fetch all categories for mapping
    categories_res = await db.execute(select(BudgetCategory).filter(BudgetCategory.user_id == current_user.id))
    categories = categories_res.scalars().all()
    cat_name_map = {str(c.id): c.name for c in categories}

    # 4. Recent Transactions
    recent_transactions_query = (
        select(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.occurred_at.desc())
        .limit(5)
    )
    result_recent = await db.execute(recent_transactions_query)
    recent_transactions = result_recent.scalars().all()
    
    recent_mapped = [
        {
            "id": t.id,
            "title": t.description or "Unknown",
            "category": cat_name_map.get(str(t.category_id), "Uncategorized"), 
            "amount": t.amount if t.type == 'INCOME' else -t.amount,
            "date": t.occurred_at.strftime("%b %d") if t.occurred_at else "",
            "type": t.type.lower()
        }
        for t in recent_transactions
    ]

    # 5. Spending Chart
    chart_data = []
    days = []
    
    if chart_range == 'week':
        # Last 7 days
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            days.append(day.date())
    else:
        # Month view: Start of month to now
        curr = start_of_month
        while curr <= now:
            days.append(curr.date())
            curr += timedelta(days=1)
            
    for day in days:
        day_expenses = sum(
            t.amount 
            for t in all_transactions 
            if t.type == 'EXPENSE' and t.occurred_at.date() == day
        )
        
        if chart_range == 'week':
            label = day.strftime("%a")
        else:
            label = day.strftime("%b %d")
            
        chart_data.append({
            "name": label,
            "amount": float(day_expenses)
        })

    # 6. Category Chart (Expenses by Category for this month)
    category_chart = []
    cat_map = {}
    for t in monthly_trans:
        if t.type == 'EXPENSE':
            cat_id = str(t.category_id) if t.category_id else "Uncategorized"
            cat_map[cat_id] = cat_map.get(cat_id, 0) + t.amount

    for cat_id, amount in cat_map.items():
        category_chart.append({
            "name": cat_name_map.get(cat_id, "Uncategorized"), 
            "value": float(amount)
        })
    
    # Sort categories by value desc for insights
    category_chart.sort(key=lambda x: x['value'], reverse=True)

    # 3. Health Score (Calculated LAST to use category data)
    health_stats = HealthScoreService.calculate_score( 
        monthly_income, 
        monthly_expenses, 
        0, 
        0, 
        top_categories=category_chart 
    )

    # 7. Autopilot / Safe-to-Spend Stats + Salary Rule Engine
    safe_to_spend_stats = await AutopilotService.calculate_safe_to_spend(db, current_user.id)
    salary_rule_engine = await AutopilotService.calculate_salary_rule_split(db, current_user.id)
    safe_to_spend_stats["salary_rule_engine"] = salary_rule_engine

    return {
        "total_balance": total_balance,
        "balance_change": balance_change,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "income_change": income_change,
        "expenses_change": expenses_change,
        "total_savings": total_savings,
        "health_score": health_stats,
        "recent_transactions": recent_mapped,
        "spending_chart": chart_data,
        "category_chart": category_chart,
        "safe_to_spend_stats": safe_to_spend_stats
    }


@router.get("/triage", response_model=FinancialTriageResponse)
async def get_financial_triage(
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FinancialTriageResponse:
    """
    Return prioritized cleanup actions for the user's current financial situation.
    """
    return await FinancialTriageService.generate(db, current_user.id)

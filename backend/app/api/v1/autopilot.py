from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.services.autopilot import AutopilotService

router = APIRouter()


class DailySafeToSpendResponse(BaseModel):
    """Response model for daily safe-to-spend orb data"""

    daily_limit: float
    days_left_in_month: int
    monthly_safe_total: float
    percentage: float
    color_state: str  # "carefree" | "mindful" | "careful"
    status_message: str
    breakdown: dict


class TimelineEventResponse(BaseModel):
    """Response model for timeline events"""

    events: list[dict]
    today: str
    summary: dict


class SalaryRuleEngineResponse(BaseModel):
    salary_considered: float
    salary_source: str
    salary_candidates: dict
    rules_config: dict
    allocation: dict
    buckets: dict
    totals: dict
    status_message: str
    warnings: list[str]


class PaymentOrderListResponse(BaseModel):
    items: list[dict]


class PaymentPrepareResponse(BaseModel):
    created_count: int
    items: list[dict]


class PaymentApproveRequest(BaseModel):
    execute_now: bool = True


class PaymentCancelRequest(BaseModel):
    reason: str | None = None


@router.get("/safe-to-spend-daily", response_model=DailySafeToSpendResponse)
async def get_daily_safe_to_spend(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
):
    data = await AutopilotService.calculate_daily_safe_spend(db, current_user.id)
    return data


@router.get("/timeline", response_model=TimelineEventResponse)
async def get_timeline(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    days_past: int = Query(default=7, ge=0, le=90),
    days_future: int = Query(default=30, ge=1, le=365),
):
    """
    Get financial timeline - past transactions and future projections.
    
    Returns a chronological view of:
    - Past transactions (last 7 days by default)
    - Upcoming bills and subscriptions
    - Projected salary credits
    - Savings goal contributions
    - Month-end balance projection
    
    Query Parameters:
    - days_past: Number of days of history to show (default: 7)
    - days_future: Number of days ahead to project (default: 30)
    """
    data = await AutopilotService.get_timeline_events(
        db, current_user.id, days_past, days_future
    )
    return data


@router.get("/payments", response_model=PaymentOrderListResponse)
async def list_payment_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    status: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
):
    items = await AutopilotService.list_payment_orders(
        db,
        current_user.id,
        status=status,
        limit=limit,
    )
    return {"items": items}


@router.post("/payments/prepare", response_model=PaymentPrepareResponse)
async def prepare_payment_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    days_ahead: int = Query(default=settings.AUTOPILOT_PAYMENT_PREPARE_DAYS, ge=0, le=90),
):
    items = await AutopilotService.prepare_payment_orders(
        db,
        current_user.id,
        days_ahead=days_ahead,
    )
    return {"created_count": len(items), "items": items}


@router.post("/payments/{payment_id}/approve", response_model=dict)
async def approve_payment_order(
    payment_id: str,
    payload: PaymentApproveRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
):
    order = await AutopilotService.approve_payment_order(
        db,
        current_user.id,
        payment_id,
        execute_now=bool(payload.execute_now),
    )
    if not order:
        raise HTTPException(status_code=404, detail="Payment order not found")
    return {"item": order}


@router.post("/payments/{payment_id}/execute", response_model=dict)
async def execute_payment_order(
    payment_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
):
    order = await AutopilotService.execute_payment_order(
        db,
        current_user.id,
        payment_id,
    )
    if not order:
        raise HTTPException(status_code=404, detail="Payment order not found")
    return {"item": order}


@router.post("/payments/{payment_id}/cancel", response_model=dict)
async def cancel_payment_order(
    payment_id: str,
    payload: PaymentCancelRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
):
    order = await AutopilotService.cancel_payment_order(
        db,
        current_user.id,
        payment_id,
        reason=payload.reason,
    )
    if not order:
        raise HTTPException(status_code=404, detail="Payment order not found")
    return {"item": order}


@router.post("/payments/execute-due", response_model=dict)
async def execute_due_payments(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
):
    # Executes only current user's already-approved due payments.
    orders = await AutopilotService.list_payment_orders(db, current_user.id, status="approved", limit=200)
    executed = 0
    failed = 0
    from datetime import date
    today = date.today().isoformat()
    for order in orders:
        if order["due_on"] > today:
            continue
        result = await AutopilotService.execute_payment_order(db, current_user.id, order["id"])
        if not result:
            continue
        if result["status"] == "succeeded":
            executed += 1
        elif result["status"] == "failed":
            failed += 1
    return {"executed": executed, "failed": failed}


@router.get("/salary-rule-engine", response_model=SalaryRuleEngineResponse)
async def get_salary_rule_engine(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    salary_override: float | None = Query(default=None, ge=0),
    free_money_min_percent: float = Query(default=20.0, ge=0, le=80),
):
    """
    Auto-split salary by priority rules:
    1. Commitments first (bills/subscriptions)
    2. Goals by priority
    3. Reserve free-money floor
    """
    return await AutopilotService.calculate_salary_rule_split(
        db,
        current_user.id,
        salary_override=salary_override,
        free_money_min_percent=free_money_min_percent,
    )

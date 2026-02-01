from typing import Any, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import uuid4
from datetime import datetime

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.bill import Bill
from app.schemas.bill import BillCreate, BillUpdate, BillResponse

router = APIRouter()

@router.post("/", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
async def create_bill(
    bill_in: BillCreate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Create a new bill.
    """
    bill = Bill(
        id=str(uuid4()),
        user_id=current_user.id,
        **bill_in.model_dump()
    )
    db.add(bill)
    await db.commit()
    await db.refresh(bill)
    return bill

@router.get("/", response_model=List[BillResponse])
async def read_bills(
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Retrieve all bills.
    """
    result = await db.execute(select(Bill).filter(Bill.user_id == current_user.id))
    bills = result.scalars().all()
    return bills

@router.put("/{bill_id}", response_model=BillResponse)
async def update_bill(
    bill_id: str,
    bill_in: BillUpdate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Update a bill.
    """
    result = await db.execute(
        select(Bill).filter(Bill.id == bill_id, Bill.user_id == current_user.id)
    )
    bill = result.scalars().first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    update_data = bill_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bill, field, value)

    db.add(bill)
    await db.commit()
    await db.refresh(bill)
    return bill

@router.delete("/{bill_id}", response_model=BillResponse)
async def delete_bill(
    bill_id: str,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Delete a bill.
    """
    result = await db.execute(
        select(Bill).filter(Bill.id == bill_id, Bill.user_id == current_user.id)
    )
    bill = result.scalars().first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    await db.delete(bill)
    await db.commit()
    return bill

@router.post("/{bill_id}/mark-paid", response_model=BillResponse)
async def mark_bill_paid(
    bill_id: str,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Mark a bill as paid for the current cycle.
    """
    result = await db.execute(
        select(Bill).filter(Bill.id == bill_id, Bill.user_id == current_user.id)
    )
    bill = result.scalars().first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    bill.last_paid_at = datetime.utcnow()
    db.add(bill)
    await db.commit()
    await db.refresh(bill)
    return bill

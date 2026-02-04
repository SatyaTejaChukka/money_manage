from typing import Any, List, Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from uuid import uuid4
from datetime import datetime

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.bill import Bill
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse

router = APIRouter()

@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_in: TransactionCreate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Create a new transaction.
    """
    transaction_data = transaction_in.model_dump()
    if transaction_data.get('occurred_at'):
        transaction_data['occurred_at'] = transaction_data['occurred_at'].replace(tzinfo=None)

    transaction = Transaction(
        id=str(uuid4()),
        user_id=current_user.id,
        **transaction_data
    )
    # Ensure occurred_at is set if not provided
    if not transaction.occurred_at:
        transaction.occurred_at = datetime.utcnow()
        
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction, ['category'])
    return transaction

@router.get("/", response_model=List[TransactionResponse])
async def read_transactions(
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
    type: Optional[str] = None,
    search: Optional[str] = None
) -> Any:
    """
    Retrieve transactions with optional filtering.
    """
    query = select(Transaction).options(selectinload(Transaction.category)).filter(Transaction.user_id == current_user.id)
    
    if type:
        query = query.filter(Transaction.type == type)
        
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))
    
    query = query.offset(skip).limit(limit).order_by(Transaction.occurred_at.desc())
    
    result = await db.execute(query)
    transactions = result.scalars().all()
    return transactions

@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    transaction_in: TransactionUpdate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Update a transaction.
    """
    result = await db.execute(
        select(Transaction).options(selectinload(Transaction.category)).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
    )
    transaction = result.scalars().first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = transaction_in.model_dump(exclude_unset=True)
    if update_data.get('occurred_at'):
        update_data['occurred_at'] = update_data['occurred_at'].replace(tzinfo=None) # Make naive
        
    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction

@router.delete("/{transaction_id}", response_model=TransactionResponse)
async def delete_transaction(
    transaction_id: str,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Delete a transaction.
    """
    result = await db.execute(
        select(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
    )
    transaction = result.scalars().first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    await db.delete(transaction)
    await db.commit()
    return transaction

@router.post("/{transaction_id}/complete", response_model=TransactionResponse)
async def complete_transaction(
    transaction_id: str,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Mark a pending transaction as completed (paid).
    """
    result = await db.execute(
        select(Transaction).options(selectinload(Transaction.category)).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalars().first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.status != "pending":
        raise HTTPException(status_code=400, detail="Transaction is not pending")
    
    transaction.status = "completed"
    transaction.occurred_at = datetime.utcnow() # Update to actual payment time
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    # Update bill/subscription last_paid_at if linked
    if transaction.bill_id:
        bill_result = await db.execute(select(Bill).filter(Bill.id == transaction.bill_id))
        bill = bill_result.scalars().first()
        if bill:
            bill.last_paid_at = datetime.utcnow()
            db.add(bill)
            await db.commit()
    elif transaction.subscription_id:
        from app.models.subscription import Subscription
        sub_result = await db.execute(select(Subscription).filter(Subscription.id == transaction.subscription_id))
        sub = sub_result.scalars().first()
        if sub:
            from dateutil.relativedelta import relativedelta
            # Update next billing date based on cycle
            if sub.billing_cycle == "monthly":
                sub.next_billing_date = datetime.utcnow() + relativedelta(months=1)
            elif sub.billing_cycle == "yearly":
                sub.next_billing_date = datetime.utcnow() + relativedelta(years=1)
            db.add(sub)
            await db.commit()
    
    return transaction

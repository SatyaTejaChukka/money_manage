from typing import Any, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import uuid4

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse

router = APIRouter()

@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    sub_in: SubscriptionCreate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sub = Subscription(
        id=str(uuid4()),
        user_id=current_user.id,
        **sub_in.model_dump()
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub

@router.get("/", response_model=List[SubscriptionResponse])
async def read_subscriptions(
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    result = await db.execute(select(Subscription).filter(Subscription.user_id == current_user.id))
    return result.scalars().all()

@router.put("/{sub_id}", response_model=SubscriptionResponse)
async def update_subscription(
    sub_id: str,
    sub_in: SubscriptionUpdate,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    result = await db.execute(select(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == current_user.id))
    sub = result.scalars().first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    for k, v in sub_in.model_dump(exclude_unset=True).items():
        setattr(sub, k, v)
        
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub

@router.delete("/{sub_id}", response_model=SubscriptionResponse)
async def delete_subscription(
    sub_id: str,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    result = await db.execute(select(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == current_user.id))
    sub = result.scalars().first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    await db.delete(sub)
    await db.commit()
    return sub

@router.post("/{sub_id}/log-usage", response_model=SubscriptionResponse)
async def log_usage(
    sub_id: str,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    result = await db.execute(select(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == current_user.id))
    sub = result.scalars().first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    sub.usage_count += 1
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub

from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class AutopilotPayment(Base):
    __tablename__ = "autopilot_payments"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "source_type",
            "source_id",
            "due_on",
            name="uq_autopilot_payment_source_cycle",
        ),
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, index=True, nullable=False)

    # BILL | SUBSCRIPTION | GOAL
    source_type = Column(String, nullable=False)
    source_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String, nullable=False, default="INR")

    due_on = Column(Date, index=True, nullable=False)

    # approval_required | approved | processing | succeeded | failed | cancelled
    status = Column(String, nullable=False, default="approval_required")
    approval_required = Column(Boolean, nullable=False, default=True)

    # internal_ledger | provider_name
    provider = Column(String, nullable=False, default="internal_ledger")
    provider_reference = Column(String, nullable=True)
    provider_action_url = Column(String, nullable=True)
    failure_reason = Column(Text, nullable=True)

    approved_at = Column(DateTime, nullable=True)
    executed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    category_id = Column(String, ForeignKey("budget_categories.id"), nullable=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    meta_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    category = relationship("BudgetCategory", foreign_keys=[category_id])
    transaction = relationship("Transaction", foreign_keys=[transaction_id])

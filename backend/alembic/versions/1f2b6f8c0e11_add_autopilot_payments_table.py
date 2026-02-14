"""add_autopilot_payments_table

Revision ID: 1f2b6f8c0e11
Revises: 15e22ac075dc
Create Date: 2026-02-14 10:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1f2b6f8c0e11"
down_revision: Union[str, None] = "15e22ac075dc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "autopilot_payments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("source_type", sa.String(), nullable=False),
        sa.Column("source_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("currency", sa.String(), nullable=False),
        sa.Column("due_on", sa.Date(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("approval_required", sa.Boolean(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("provider_reference", sa.String(), nullable=True),
        sa.Column("provider_action_url", sa.String(), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("executed_at", sa.DateTime(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
        sa.Column("category_id", sa.String(), nullable=True),
        sa.Column("transaction_id", sa.String(), nullable=True),
        sa.Column("meta_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["budget_categories.id"]),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "source_type",
            "source_id",
            "due_on",
            name="uq_autopilot_payment_source_cycle",
        ),
    )
    op.create_index(
        op.f("ix_autopilot_payments_user_id"),
        "autopilot_payments",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_autopilot_payments_due_on"),
        "autopilot_payments",
        ["due_on"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_autopilot_payments_due_on"), table_name="autopilot_payments")
    op.drop_index(op.f("ix_autopilot_payments_user_id"), table_name="autopilot_payments")
    op.drop_table("autopilot_payments")

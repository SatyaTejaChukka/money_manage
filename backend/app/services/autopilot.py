import calendar
import json
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.models.autopilot_payment import AutopilotPayment
from app.models.bill import Bill
from app.models.budget import BudgetCategory, BudgetRule
from app.models.income import IncomeSource
from app.models.notification import Notification
from app.models.savings import SavingsGoal, SavingsLog
from app.models.subscription import Subscription
from app.models.transaction import Transaction


class AutopilotService:
    @staticmethod
    def _to_decimal(value: Decimal | float | int | None) -> Decimal:
        if value is None:
            return Decimal("0")
        if isinstance(value, Decimal):
            return value
        return Decimal(str(value))

    @staticmethod
    def _month_safe_day(year: int, month: int, day: int) -> int:
        return max(1, min(day, calendar.monthrange(year, month)[1]))

    @classmethod
    def _next_recurring_date(cls, now: datetime, day: int) -> datetime:
        safe_day = cls._month_safe_day(now.year, now.month, day)
        current_month_date = now.replace(day=safe_day, hour=0, minute=0, second=0, microsecond=0)
        if current_month_date.date() >= now.date():
            return current_month_date

        next_month_anchor = (now.replace(day=1) + timedelta(days=32)).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        next_safe_day = cls._month_safe_day(next_month_anchor.year, next_month_anchor.month, day)
        return next_month_anchor.replace(day=next_safe_day)

    @staticmethod
    def _parse_payday(payday: str | None) -> int | None:
        if not payday:
            return None
        numeric = "".join(ch for ch in payday if ch.isdigit())
        if not numeric:
            return None
        parsed = int(numeric)
        if parsed < 1 or parsed > 31:
            return None
        return parsed

    @staticmethod
    def _monthly_multiplier(frequency: str | None) -> Decimal:
        value = (frequency or "monthly").strip().lower()
        if value == "monthly":
            return Decimal("1")
        if value == "weekly":
            return Decimal("52") / Decimal("12")
        if value == "biweekly":
            return Decimal("26") / Decimal("12")
        if value == "yearly":
            return Decimal("1") / Decimal("12")
        if value == "daily":
            return Decimal("30")
        # Unknown frequencies default to monthly for safety.
        return Decimal("1")

    @staticmethod
    def _to_money(value: Decimal) -> float:
        return float(round(value, 2))

    @staticmethod
    def _load_meta(meta_json: str | None) -> Dict[str, Any]:
        if not meta_json:
            return {}
        try:
            payload = json.loads(meta_json)
            return payload if isinstance(payload, dict) else {}
        except json.JSONDecodeError:
            return {}

    @staticmethod
    def _dump_meta(meta: Dict[str, Any] | None) -> str:
        return json.dumps(meta or {})

    @staticmethod
    def _serialize_payment_order(order: AutopilotPayment) -> Dict[str, Any]:
        return {
            "id": order.id,
            "user_id": order.user_id,
            "source_type": order.source_type,
            "source_id": order.source_id,
            "title": order.title,
            "amount": float(round(AutopilotService._to_decimal(order.amount), 2)),
            "currency": order.currency,
            "due_on": order.due_on.isoformat(),
            "status": order.status,
            "approval_required": bool(order.approval_required),
            "provider": order.provider,
            "provider_reference": order.provider_reference,
            "provider_action_url": order.provider_action_url,
            "failure_reason": order.failure_reason,
            "approved_at": order.approved_at.isoformat() if order.approved_at else None,
            "executed_at": order.executed_at.isoformat() if order.executed_at else None,
            "cancelled_at": order.cancelled_at.isoformat() if order.cancelled_at else None,
            "category_id": order.category_id,
            "transaction_id": order.transaction_id,
            "meta": AutopilotService._load_meta(order.meta_json),
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        }

    @staticmethod
    async def _create_notification(
        session: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str,
        action_url: str | None = None,
        related_id: str | None = None,
    ) -> None:
        session.add(
            Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type,
                action_url=action_url,
                related_id=related_id,
            )
        )

    @staticmethod
    def _resolve_subscription_due_date(now: datetime, subscription: Subscription) -> datetime:
        cycle_days = 30 if (subscription.billing_cycle or "monthly") == "monthly" else 365
        if subscription.next_billing_date:
            next_due = subscription.next_billing_date
            while next_due.date() < now.date():
                next_due = next_due + timedelta(days=cycle_days)
            return next_due
        return now + timedelta(days=cycle_days)

    @classmethod
    async def _current_month_income_from_transactions(
        cls,
        session: AsyncSession,
        user_id: str,
        now: datetime,
    ) -> Decimal:
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        tx_res = await session.execute(
            select(Transaction).filter(
                Transaction.user_id == user_id,
                Transaction.type == "INCOME",
                Transaction.occurred_at >= start_of_month,
                Transaction.occurred_at <= now,
            )
        )
        income_transactions = tx_res.scalars().all()
        return sum((cls._to_decimal(tx.amount) for tx in income_transactions), Decimal("0"))

    @classmethod
    async def prepare_payment_orders(
        cls,
        session: AsyncSession,
        user_id: str,
        days_ahead: int = 7,
        *,
        commit: bool = True,
    ) -> List[Dict[str, Any]]:
        now = datetime.utcnow()
        today = now.date()
        horizon = today + timedelta(days=max(0, min(int(days_ahead), 90)))

        existing_res = await session.execute(
            select(AutopilotPayment).filter(
                AutopilotPayment.user_id == user_id,
                AutopilotPayment.due_on >= today,
                AutopilotPayment.due_on <= horizon,
                AutopilotPayment.status != "cancelled",
            )
        )
        existing_orders = existing_res.scalars().all()
        existing_keys = {
            (order.source_type, order.source_id, order.due_on): order for order in existing_orders
        }

        prepared_orders: List[AutopilotPayment] = []

        bills_res = await session.execute(
            select(Bill).filter(Bill.user_id == user_id, Bill.autopay_enabled == True)
        )
        bills = bills_res.scalars().all()
        for bill in bills:
            due_on = cls._next_recurring_date(now, bill.due_day).date()
            if due_on < today or due_on > horizon:
                continue

            dedupe_key = ("BILL", bill.id, due_on)
            if dedupe_key in existing_keys:
                continue

            order = AutopilotPayment(
                user_id=user_id,
                source_type="BILL",
                source_id=bill.id,
                title=bill.name,
                amount=cls._to_decimal(bill.amount_estimated),
                currency="INR",
                due_on=due_on,
                status="approval_required",
                approval_required=True,
                provider=settings.PAYMENTS_PROVIDER,
                category_id=bill.category_id,
                meta_json=cls._dump_meta(
                    {
                        "autopay_enabled": bool(bill.autopay_enabled),
                        "frequency": bill.frequency or "monthly",
                    }
                ),
            )
            session.add(order)
            existing_keys[dedupe_key] = order
            prepared_orders.append(order)

            await cls._create_notification(
                session=session,
                user_id=user_id,
                title=f"Approval needed: {bill.name}",
                message=(
                    f"Approve INR {cls._to_money(cls._to_decimal(bill.amount_estimated)):.2f} "
                    f"for {bill.name} (due {due_on.isoformat()})."
                ),
                notification_type="payment_approval_required",
                action_url="/dashboard",
                related_id=order.id,
            )

        subscriptions_res = await session.execute(
            select(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.is_active == True,
            )
        )
        subscriptions = subscriptions_res.scalars().all()
        for subscription in subscriptions:
            due_at = cls._resolve_subscription_due_date(now, subscription)
            if subscription.next_billing_date is None:
                subscription.next_billing_date = due_at
                session.add(subscription)
            due_on = due_at.date()
            if due_on < today or due_on > horizon:
                continue

            dedupe_key = ("SUBSCRIPTION", subscription.id, due_on)
            if dedupe_key in existing_keys:
                continue

            order = AutopilotPayment(
                user_id=user_id,
                source_type="SUBSCRIPTION",
                source_id=subscription.id,
                title=subscription.name,
                amount=cls._to_decimal(subscription.amount),
                currency="INR",
                due_on=due_on,
                status="approval_required",
                approval_required=True,
                provider=settings.PAYMENTS_PROVIDER,
                category_id=subscription.category_id,
                meta_json=cls._dump_meta(
                    {"billing_cycle": subscription.billing_cycle or "monthly"}
                ),
            )
            session.add(order)
            existing_keys[dedupe_key] = order
            prepared_orders.append(order)

            await cls._create_notification(
                session=session,
                user_id=user_id,
                title=f"Approval needed: {subscription.name}",
                message=(
                    f"Approve INR {cls._to_money(cls._to_decimal(subscription.amount)):.2f} "
                    f"for {subscription.name} (due {due_on.isoformat()})."
                ),
                notification_type="payment_approval_required",
                action_url="/dashboard",
                related_id=order.id,
            )

        if commit and prepared_orders:
            await session.commit()
            for order in prepared_orders:
                await session.refresh(order)
        elif commit:
            await session.commit()

        return [cls._serialize_payment_order(order) for order in prepared_orders]

    @classmethod
    async def prepare_payment_orders_for_all_users(
        cls,
        session: AsyncSession,
        days_ahead: int = 7,
    ) -> Dict[str, int]:
        bill_users_res = await session.execute(
            select(Bill.user_id).filter(Bill.autopay_enabled == True)
        )
        subscription_users_res = await session.execute(
            select(Subscription.user_id).filter(Subscription.is_active == True)
        )

        user_ids = {user_id for (user_id,) in bill_users_res.all()}
        user_ids.update({user_id for (user_id,) in subscription_users_res.all()})

        created_count = 0
        for user_id in user_ids:
            created = await cls.prepare_payment_orders(
                session,
                user_id=user_id,
                days_ahead=days_ahead,
                commit=False,
            )
            created_count += len(created)

        await session.commit()
        return {"users_processed": len(user_ids), "orders_created": created_count}

    @classmethod
    async def list_payment_orders(
        cls,
        session: AsyncSession,
        user_id: str,
        status: str | None = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        safe_limit = max(1, min(int(limit), 200))
        query = select(AutopilotPayment).filter(AutopilotPayment.user_id == user_id)
        if status:
            query = query.filter(AutopilotPayment.status == status)
        query = query.order_by(AutopilotPayment.due_on.asc(), AutopilotPayment.created_at.desc()).limit(
            safe_limit
        )

        res = await session.execute(query)
        orders = res.scalars().all()
        return [cls._serialize_payment_order(order) for order in orders]

    @classmethod
    async def get_payment_order_by_id(
        cls,
        session: AsyncSession,
        user_id: str,
        payment_id: str,
    ) -> AutopilotPayment | None:
        res = await session.execute(
            select(AutopilotPayment).filter(
                AutopilotPayment.id == payment_id,
                AutopilotPayment.user_id == user_id,
            )
        )
        return res.scalars().first()

    @classmethod
    async def approve_payment_order(
        cls,
        session: AsyncSession,
        user_id: str,
        payment_id: str,
        *,
        execute_now: bool = True,
    ) -> Dict[str, Any] | None:
        order = await cls.get_payment_order_by_id(session, user_id, payment_id)
        if not order:
            return None

        if order.status in {"cancelled", "succeeded"}:
            return cls._serialize_payment_order(order)

        order.status = "approved"
        order.approved_at = datetime.utcnow()
        order.failure_reason = None
        session.add(order)

        await cls._create_notification(
            session=session,
            user_id=user_id,
            title=f"Payment approved: {order.title}",
            message=(
                f"INR {cls._to_money(cls._to_decimal(order.amount)):.2f} is approved for autopilot execution."
            ),
            notification_type="payment_approved",
            action_url="/dashboard",
            related_id=order.id,
        )

        await session.commit()

        if execute_now and settings.PAYMENTS_AUTO_EXECUTE_ON_APPROVAL:
            return await cls.execute_payment_order(session, user_id, payment_id)

        await session.refresh(order)
        return cls._serialize_payment_order(order)

    @classmethod
    async def cancel_payment_order(
        cls,
        session: AsyncSession,
        user_id: str,
        payment_id: str,
        *,
        reason: str | None = None,
    ) -> Dict[str, Any] | None:
        order = await cls.get_payment_order_by_id(session, user_id, payment_id)
        if not order:
            return None

        if order.status == "succeeded":
            return cls._serialize_payment_order(order)

        order.status = "cancelled"
        order.cancelled_at = datetime.utcnow()
        order.failure_reason = reason or order.failure_reason
        session.add(order)
        await session.commit()
        await session.refresh(order)
        return cls._serialize_payment_order(order)

    @classmethod
    async def execute_due_approved_payments(cls, session: AsyncSession) -> Dict[str, int]:
        today = datetime.utcnow().date()
        pending_res = await session.execute(
            select(AutopilotPayment).filter(
                AutopilotPayment.status == "approved",
                AutopilotPayment.due_on <= today,
            )
        )
        orders = pending_res.scalars().all()
        success_count = 0
        failed_count = 0

        for order in orders:
            result = await cls._execute_order(session, order)
            if result["status"] == "succeeded":
                success_count += 1
            elif result["status"] == "failed":
                failed_count += 1

        return {"executed": success_count, "failed": failed_count}

    @classmethod
    async def execute_payment_order(
        cls,
        session: AsyncSession,
        user_id: str,
        payment_id: str,
    ) -> Dict[str, Any] | None:
        order = await cls.get_payment_order_by_id(session, user_id, payment_id)
        if not order:
            return None
        return await cls._execute_order(session, order)

    @classmethod
    async def _execute_order(
        cls,
        session: AsyncSession,
        order: AutopilotPayment,
    ) -> Dict[str, Any]:
        if order.status in {"succeeded", "cancelled"}:
            return cls._serialize_payment_order(order)

        if order.status not in {"approved", "processing"}:
            order.status = "failed"
            order.failure_reason = "Payment must be approved before execution."
            session.add(order)
            await session.commit()
            await session.refresh(order)
            return cls._serialize_payment_order(order)

        order.status = "processing"
        session.add(order)
        await session.commit()

        provider = (order.provider or "internal_ledger").strip().lower()
        if provider != "internal_ledger":
            order.status = "failed"
            order.failure_reason = (
                "External provider execution is not configured. "
                "Set PAYMENTS_PROVIDER=internal_ledger or integrate provider credentials."
            )
            session.add(order)
            await session.commit()
            await session.refresh(order)
            return cls._serialize_payment_order(order)

        now = datetime.utcnow()
        amount_decimal = cls._to_decimal(order.amount)

        if order.source_type == "BILL":
            bill_res = await session.execute(
                select(Bill).filter(Bill.id == order.source_id, Bill.user_id == order.user_id)
            )
            bill = bill_res.scalars().first()
            if not bill:
                order.status = "failed"
                order.failure_reason = "Linked bill not found."
                session.add(order)
                await session.commit()
                await session.refresh(order)
                return cls._serialize_payment_order(order)

            transaction = Transaction(
                user_id=order.user_id,
                category_id=order.category_id or bill.category_id,
                amount=amount_decimal,
                type="EXPENSE",
                description=f"Autopilot Payment: {order.title}",
                occurred_at=now,
                status="completed",
                bill_id=bill.id,
            )
            bill.last_paid_at = now
            session.add(transaction)
            session.add(bill)
            await session.flush()
            order.transaction_id = transaction.id

        elif order.source_type == "SUBSCRIPTION":
            sub_res = await session.execute(
                select(Subscription).filter(
                    Subscription.id == order.source_id,
                    Subscription.user_id == order.user_id,
                )
            )
            subscription = sub_res.scalars().first()
            if not subscription:
                order.status = "failed"
                order.failure_reason = "Linked subscription not found."
                session.add(order)
                await session.commit()
                await session.refresh(order)
                return cls._serialize_payment_order(order)

            transaction = Transaction(
                user_id=order.user_id,
                category_id=order.category_id or subscription.category_id,
                amount=amount_decimal,
                type="EXPENSE",
                description=f"Autopilot Payment: {order.title}",
                occurred_at=now,
                status="completed",
                subscription_id=subscription.id,
            )
            cycle_days = 30 if (subscription.billing_cycle or "monthly") == "monthly" else 365
            base_date = subscription.next_billing_date or now
            if base_date < now:
                base_date = now
            subscription.next_billing_date = base_date + timedelta(days=cycle_days)
            session.add(transaction)
            session.add(subscription)
            await session.flush()
            order.transaction_id = transaction.id

        elif order.source_type == "GOAL":
            goal_res = await session.execute(
                select(SavingsGoal).filter(
                    SavingsGoal.id == order.source_id,
                    SavingsGoal.user_id == order.user_id,
                )
            )
            goal = goal_res.scalars().first()
            if not goal:
                order.status = "failed"
                order.failure_reason = "Linked savings goal not found."
                session.add(order)
                await session.commit()
                await session.refresh(order)
                return cls._serialize_payment_order(order)

            goal.current_amount = cls._to_decimal(goal.current_amount) + amount_decimal
            if cls._to_decimal(goal.current_amount) >= cls._to_decimal(goal.target_amount):
                goal.is_completed = True

            session.add(
                SavingsLog(
                    goal_id=goal.id,
                    amount=amount_decimal,
                    note="Autopilot contribution",
                )
            )

            transaction = Transaction(
                user_id=order.user_id,
                category_id=order.category_id,
                amount=amount_decimal,
                type="EXPENSE",
                description=f"Autopilot Goal Contribution: {goal.name}",
                occurred_at=now,
                status="completed",
            )
            session.add(goal)
            session.add(transaction)
            await session.flush()
            order.transaction_id = transaction.id
        else:
            order.status = "failed"
            order.failure_reason = f"Unsupported payment source type: {order.source_type}"
            session.add(order)
            await session.commit()
            await session.refresh(order)
            return cls._serialize_payment_order(order)

        order.status = "succeeded"
        order.executed_at = now
        order.provider_reference = order.provider_reference or f"internal:{order.id}"
        order.failure_reason = None
        session.add(order)

        await cls._create_notification(
            session=session,
            user_id=order.user_id,
            title=f"Payment completed: {order.title}",
            message=f"INR {cls._to_money(amount_decimal):.2f} paid successfully.",
            notification_type="payment_success",
            action_url="/dashboard/transactions",
            related_id=order.transaction_id or order.id,
        )

        await session.commit()
        await session.refresh(order)
        return cls._serialize_payment_order(order)

    @classmethod
    def _allocate_goals_by_priority(
        cls,
        goals: List[SavingsGoal],
        available_budget: Decimal,
    ) -> tuple[List[Dict[str, Any]], Decimal]:
        remaining = max(Decimal("0"), available_budget)
        allocations: List[Dict[str, Any]] = []

        sorted_goals = sorted(
            goals,
            key=lambda goal: (
                -max(0, int(goal.priority or 0)),
                str(goal.name or ""),
                str(goal.id or ""),
            ),
        )

        total_allocated = Decimal("0")
        for goal in sorted_goals:
            requested = max(Decimal("0"), cls._to_decimal(goal.monthly_contribution))
            allocation = min(requested, remaining)
            remaining -= allocation
            total_allocated += allocation
            shortfall = max(Decimal("0"), requested - allocation)

            allocations.append(
                {
                    "goal_id": goal.id,
                    "goal_name": goal.name,
                    "priority": int(goal.priority or 0),
                    "requested": cls._to_money(requested),
                    "allocated": cls._to_money(allocation),
                    "shortfall": cls._to_money(shortfall),
                    "is_fully_funded": shortfall == 0,
                }
            )

        return allocations, total_allocated

    @classmethod
    async def calculate_salary_rule_split(
        cls,
        session: AsyncSession,
        user_id: str,
        salary_override: float | None = None,
        free_money_min_percent: float = 20.0,
    ) -> Dict[str, Any]:
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        floor_percent = max(0.0, min(float(free_money_min_percent), 80.0))

        income_res = await session.execute(select(IncomeSource).filter(IncomeSource.user_id == user_id))
        income_sources = income_res.scalars().all()

        estimated_salary_from_sources = sum(
            (
                cls._to_decimal(income.amount) * cls._monthly_multiplier(income.frequency)
                for income in income_sources
                if bool(income.active)
            ),
            Decimal("0"),
        )

        monthly_income_from_transactions = await cls._current_month_income_from_transactions(
            session, user_id, now
        )

        if salary_override is None:
            if monthly_income_from_transactions > 0:
                salary_considered = max(Decimal("0"), monthly_income_from_transactions)
                salary_source = "income_transactions"
            else:
                salary_considered = max(Decimal("0"), estimated_salary_from_sources)
                salary_source = "income_sources"
        else:
            salary_considered = max(Decimal("0"), cls._to_decimal(salary_override))
            salary_source = "salary_override"

        bills_res = await session.execute(select(Bill).filter(Bill.user_id == user_id))
        bills = bills_res.scalars().all()

        commitments_items: List[Dict[str, Any]] = []
        commitments_total = Decimal("0")

        for bill in bills:
            is_paid_this_month = bool(bill.last_paid_at and bill.last_paid_at >= start_of_month)
            if is_paid_this_month:
                continue

            amount = max(
                Decimal("0"),
                cls._to_decimal(bill.amount_estimated)
                * cls._monthly_multiplier(getattr(bill, "frequency", "monthly")),
            )
            commitments_total += amount
            commitments_items.append(
                {
                    "type": "BILL",
                    "name": bill.name,
                    "amount": cls._to_money(amount),
                    "priority": 100,
                    "metadata": {
                        "due_day": bill.due_day,
                        "autopay_enabled": bool(bill.autopay_enabled),
                    },
                }
            )

        subs_res = await session.execute(
            select(Subscription).filter(Subscription.user_id == user_id, Subscription.is_active == True)
        )
        subscriptions = subs_res.scalars().all()

        for subscription in subscriptions:
            amount = max(
                Decimal("0"),
                cls._to_decimal(subscription.amount)
                * cls._monthly_multiplier(subscription.billing_cycle or "monthly"),
            )
            commitments_total += amount
            commitments_items.append(
                {
                    "type": "SUBSCRIPTION",
                    "name": subscription.name,
                    "amount": cls._to_money(amount),
                    "priority": 90,
                    "metadata": {
                        "billing_cycle": subscription.billing_cycle,
                    },
                }
            )

        goals_res = await session.execute(
            select(SavingsGoal).filter(SavingsGoal.user_id == user_id, SavingsGoal.is_completed == False)
        )
        goals = goals_res.scalars().all()

        budget_categories_res = await session.execute(
            select(BudgetCategory).filter(BudgetCategory.user_id == user_id)
        )
        budget_categories = budget_categories_res.scalars().all()
        category_name_map = {category.id: category.name for category in budget_categories}

        budget_rules_res = await session.execute(
            select(BudgetRule).filter(BudgetRule.user_id == user_id)
        )
        budget_rules = budget_rules_res.scalars().all()

        planned_expense_items: List[Dict[str, Any]] = []
        planned_expense_requested_total = Decimal("0")
        for rule in budget_rules:
            monthly_limit = cls._to_decimal(rule.monthly_limit)
            if monthly_limit <= 0:
                continue
            planned_expense_requested_total += monthly_limit
            planned_expense_items.append(
                {
                    "rule_id": rule.id,
                    "category_id": rule.category_id,
                    "category_name": category_name_map.get(rule.category_id, "Uncategorized"),
                    "requested": cls._to_money(monthly_limit),
                }
            )

        free_money_floor = salary_considered * (Decimal(str(floor_percent)) / Decimal("100"))
        remaining_after_commitments = salary_considered - commitments_total

        goal_requested_total = sum(
            (max(Decimal("0"), cls._to_decimal(goal.monthly_contribution)) for goal in goals),
            Decimal("0"),
        )

        if remaining_after_commitments <= 0:
            goal_allocations: List[Dict[str, Any]] = [
                {
                    "goal_id": goal.id,
                    "goal_name": goal.name,
                    "priority": int(goal.priority or 0),
                    "requested": cls._to_money(max(Decimal("0"), cls._to_decimal(goal.monthly_contribution))),
                    "allocated": 0.0,
                    "shortfall": cls._to_money(max(Decimal("0"), cls._to_decimal(goal.monthly_contribution))),
                    "is_fully_funded": False,
                }
                for goal in goals
            ]
            allocated_to_goals = Decimal("0")
            planned_expense_allocated = Decimal("0")
            planned_expense_shortfall = planned_expense_requested_total
            free_money = Decimal("0")
            free_money_floor_met = False
        else:
            allocatable_after_floor = max(Decimal("0"), remaining_after_commitments - free_money_floor)
            planned_expense_allocated = min(planned_expense_requested_total, allocatable_after_floor)
            planned_expense_shortfall = max(Decimal("0"), planned_expense_requested_total - planned_expense_allocated)

            for item in planned_expense_items:
                requested_amount = cls._to_decimal(item["requested"])
                if requested_amount <= 0 or planned_expense_allocated <= 0:
                    item["allocated"] = 0.0
                    item["shortfall"] = cls._to_money(requested_amount)
                    continue
                allocated_amount = min(requested_amount, planned_expense_allocated)
                planned_expense_allocated -= allocated_amount
                item["allocated"] = cls._to_money(allocated_amount)
                item["shortfall"] = cls._to_money(requested_amount - allocated_amount)

            # planned_expense_allocated was decremented while distributing per-rule; recompute aggregate.
            planned_expense_allocated = sum(
                (cls._to_decimal(item.get("allocated", 0)) for item in planned_expense_items),
                Decimal("0"),
            )

            goals_budget_cap = max(
                Decimal("0"),
                remaining_after_commitments - free_money_floor - planned_expense_allocated,
            )
            budget_for_goals = min(goal_requested_total, goals_budget_cap)
            goal_allocations, allocated_to_goals = cls._allocate_goals_by_priority(goals, budget_for_goals)
            free_money = max(
                Decimal("0"),
                remaining_after_commitments - planned_expense_allocated - allocated_to_goals,
            )
            free_money_floor_met = free_money >= free_money_floor or remaining_after_commitments <= free_money_floor

        goal_shortfall = max(Decimal("0"), goal_requested_total - allocated_to_goals)
        commitment_coverage_ok = salary_considered >= commitments_total

        if not commitment_coverage_ok:
            status_message = "Salary does not fully cover commitments. Autopilot should require manual approval."
        elif planned_expense_shortfall > 0:
            status_message = "Commitments are covered. Planned expenses are partially funded."
        elif goal_shortfall > 0:
            status_message = "Commitments are covered. Goals are partially funded by priority."
        elif free_money_floor_met:
            status_message = "Commitments and goals are funded. Free-money floor is protected."
        else:
            status_message = "Commitments and goals are funded, but free-money floor is below target."

        warnings: List[str] = []
        if not commitment_coverage_ok:
            deficit = commitments_total - salary_considered
            warnings.append(f"Commitment deficit: {cls._to_money(deficit)}")
        if goal_shortfall > 0:
            warnings.append(f"Goal shortfall: {cls._to_money(goal_shortfall)}")
        if planned_expense_shortfall > 0:
            warnings.append(f"Planned expense shortfall: {cls._to_money(planned_expense_shortfall)}")
        if not free_money_floor_met:
            warnings.append("Free-money floor not fully met.")

        return {
            "salary_considered": cls._to_money(salary_considered),
            "salary_source": salary_source,
            "salary_candidates": {
                "from_income_transactions": cls._to_money(monthly_income_from_transactions),
                "from_income_sources": cls._to_money(estimated_salary_from_sources),
            },
            "rules_config": {
                "commitments_first": True,
                "planned_expenses_after_commitments": True,
                "goal_strategy": "priority_desc",
                "free_money_min_percent": floor_percent,
            },
            "allocation": {
                "commitments": cls._to_money(max(Decimal("0"), commitments_total)),
                "planned_expenses": cls._to_money(max(Decimal("0"), planned_expense_allocated)),
                "goals": cls._to_money(max(Decimal("0"), allocated_to_goals)),
                "free_money": cls._to_money(max(Decimal("0"), free_money)),
                "free_money_floor_target": cls._to_money(max(Decimal("0"), free_money_floor)),
                "free_money_floor_met": free_money_floor_met,
            },
            "buckets": {
                "commitments": commitments_items,
                "planned_expenses": planned_expense_items,
                "goals": goal_allocations,
            },
            "totals": {
                "planned_expenses_requested": cls._to_money(planned_expense_requested_total),
                "planned_expenses_allocated": cls._to_money(planned_expense_allocated),
                "planned_expenses_shortfall": cls._to_money(planned_expense_shortfall),
                "goal_requested": cls._to_money(goal_requested_total),
                "goal_allocated": cls._to_money(allocated_to_goals),
                "goal_shortfall": cls._to_money(goal_shortfall),
                "commitment_coverage_ratio": (
                    cls._to_money(salary_considered / commitments_total)
                    if commitments_total > 0
                    else 0.0
                ),
            },
            "status_message": status_message,
            "warnings": warnings,
        }

    @staticmethod
    async def calculate_safe_to_spend(session: AsyncSession, user_id: str) -> Dict[str, Any]:
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        income_res = await session.execute(select(IncomeSource).filter(IncomeSource.user_id == user_id))
        income_sources = income_res.scalars().all()
        monthly_income_from_sources = sum(
            (
                AutopilotService._to_decimal(income.amount)
                * AutopilotService._monthly_multiplier(income.frequency)
                for income in income_sources
                if bool(income.active)
            ),
            Decimal("0"),
        )

        monthly_income_from_transactions = await AutopilotService._current_month_income_from_transactions(
            session, user_id, now
        )

        if monthly_income_from_transactions > 0:
            monthly_income = monthly_income_from_transactions
            income_basis = "income_transactions"
        else:
            monthly_income = monthly_income_from_sources
            income_basis = "income_sources"

        bills_res = await session.execute(select(Bill).filter(Bill.user_id == user_id))
        bills = bills_res.scalars().all()
        unpaid_bills_amount = Decimal("0")
        for bill in bills:
            is_paid_this_month = bool(bill.last_paid_at and bill.last_paid_at >= start_of_month)
            if not is_paid_this_month:
                unpaid_bills_amount += (
                    AutopilotService._to_decimal(bill.amount_estimated)
                    * AutopilotService._monthly_multiplier(getattr(bill, "frequency", "monthly"))
                )

        subs_res = await session.execute(
            select(Subscription).filter(Subscription.user_id == user_id, Subscription.is_active == True)
        )
        subscriptions = subs_res.scalars().all()
        subscriptions_amount = sum(
            (
                AutopilotService._to_decimal(sub.amount)
                * AutopilotService._monthly_multiplier(sub.billing_cycle)
                for sub in subscriptions
            ),
            Decimal("0"),
        )

        goals_res = await session.execute(
            select(SavingsGoal).filter(SavingsGoal.user_id == user_id, SavingsGoal.is_completed == False)
        )
        goals = goals_res.scalars().all()
        goals_amount = sum(
            (AutopilotService._to_decimal(goal.monthly_contribution) for goal in goals),
            Decimal("0"),
        )

        total_commitments = unpaid_bills_amount + subscriptions_amount + goals_amount

        trans_res = await session.execute(
            select(Transaction).filter(
                Transaction.user_id == user_id,
                Transaction.type == "EXPENSE",
                Transaction.occurred_at >= start_of_month,
            )
        )
        transactions = trans_res.scalars().all()
        spent_this_month = sum((AutopilotService._to_decimal(t.amount) for t in transactions), Decimal("0"))

        monthly_free_budget = monthly_income - total_commitments
        if monthly_free_budget < 0:
            monthly_free_budget = Decimal("0")

        safe_to_spend_remaining = monthly_free_budget - spent_this_month
        if safe_to_spend_remaining < 0:
            safe_to_spend_remaining = Decimal("0")

        return {
            "total_income": float(monthly_income),
            "total_committed": float(total_commitments),
            "total_spent_month": float(spent_this_month),
            "upcoming_commitments": float(total_commitments),
            "monthly_free_budget": float(monthly_free_budget),
            "safe_to_spend": float(safe_to_spend_remaining),
            "income_basis": income_basis,
            "breakdown": {
                "unpaid_bills": float(unpaid_bills_amount),
                "subscriptions": float(subscriptions_amount),
                "savings_goals": float(goals_amount),
                "income_from_transactions": float(monthly_income_from_transactions),
                "income_from_sources": float(monthly_income_from_sources),
            },
        }

    @staticmethod
    async def check_due_bills_for_autopay(session: AsyncSession) -> List[str]:
        summary = await AutopilotService.prepare_payment_orders_for_all_users(
            session,
            days_ahead=0,
        )
        execution = await AutopilotService.execute_due_approved_payments(session)
        return [
            f"Prepared {summary['orders_created']} payment orders",
            f"Executed {execution['executed']} approved payments",
            f"Failed {execution['failed']} approved payments",
        ]

    @staticmethod
    async def calculate_daily_safe_spend(session: AsyncSession, user_id: str) -> Dict[str, Any]:
        now = datetime.utcnow()
        days_in_month = calendar.monthrange(now.year, now.month)[1]
        days_remaining = max(1, days_in_month - now.day + 1)

        monthly_data = await AutopilotService.calculate_safe_to_spend(session, user_id)
        monthly_income = AutopilotService._to_decimal(monthly_data["total_income"])
        monthly_committed = AutopilotService._to_decimal(monthly_data["total_committed"])
        monthly_safe_total = AutopilotService._to_decimal(monthly_data["monthly_free_budget"])
        remaining_budget = AutopilotService._to_decimal(monthly_data["safe_to_spend"])

        daily_limit = remaining_budget / Decimal(days_remaining)
        if monthly_safe_total > 0:
            percentage = float((remaining_budget / monthly_safe_total) * Decimal("100"))
        else:
            percentage = 0.0

        if percentage > 50:
            color_state = "carefree"
            status_message = "You are doing great. Spend freely."
        elif percentage > 20:
            color_state = "mindful"
            status_message = "Mindful spending keeps you on track."
        else:
            color_state = "careful"
            status_message = "Easy does it. You are close to the edge."

        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_txn_res = await session.execute(
            select(Transaction).filter(
                Transaction.user_id == user_id,
                Transaction.type == "EXPENSE",
                Transaction.occurred_at >= start_of_month,
            )
        )
        month_transactions = month_txn_res.scalars().all()
        spent_this_month = sum((AutopilotService._to_decimal(t.amount) for t in month_transactions), Decimal("0"))

        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_txn_res = await session.execute(
            select(Transaction).filter(
                Transaction.user_id == user_id,
                Transaction.type == "EXPENSE",
                Transaction.occurred_at >= start_of_today,
            )
        )
        today_transactions = today_txn_res.scalars().all()
        spent_today = sum((AutopilotService._to_decimal(t.amount) for t in today_transactions), Decimal("0"))

        income_today = monthly_income / Decimal(days_in_month)
        committed_today = monthly_committed / Decimal(days_in_month)

        return {
            "daily_limit": float(round(daily_limit, 2)),
            "days_left_in_month": days_remaining,
            "monthly_safe_total": float(round(monthly_safe_total, 2)),
            "percentage": round(percentage, 0),
            "color_state": color_state,
            "status_message": status_message,
            "breakdown": {
                "income_today": float(round(income_today, 2)),
                "committed_today": float(round(committed_today, 2)),
                "spent_today": float(round(spent_today, 2)),
                "remaining_today": float(round(daily_limit, 2)),
                "monthly_income": float(round(monthly_income, 2)),
                "monthly_committed": float(round(monthly_committed, 2)),
                "spent_this_month": float(round(spent_this_month, 2)),
                "remaining_budget": float(round(remaining_budget, 2)),
            },
        }

    @staticmethod
    async def get_timeline_events(
        session: AsyncSession,
        user_id: str,
        days_past: int = 7,
        days_future: int = 30,
    ) -> Dict[str, Any]:
        now = datetime.utcnow()
        days_past = max(0, min(days_past, 90))
        days_future = max(1, min(days_future, 365))
        start_date = now - timedelta(days=days_past)
        end_date = now + timedelta(days=days_future)

        # Keep timeline in sync with real autopilot payment pipeline.
        await AutopilotService.prepare_payment_orders(
            session,
            user_id,
            days_ahead=days_future,
            commit=True,
        )

        events: List[Dict[str, Any]] = []

        categories_res = await session.execute(
            select(BudgetCategory).filter(BudgetCategory.user_id == user_id)
        )
        categories = categories_res.scalars().all()
        category_name_map = {str(category.id): category.name for category in categories}

        payment_orders_res = await session.execute(
            select(AutopilotPayment).filter(
                AutopilotPayment.user_id == user_id,
                AutopilotPayment.due_on >= start_date.date(),
                AutopilotPayment.due_on <= end_date.date(),
            )
        )
        payment_orders = payment_orders_res.scalars().all()
        payment_order_map = {
            (order.source_type, order.source_id, order.due_on): order for order in payment_orders
        }

        tx_res = await session.execute(
            select(Transaction).filter(
                Transaction.user_id == user_id,
                Transaction.occurred_at >= start_date,
                Transaction.occurred_at <= now,
            )
        )
        transactions = tx_res.scalars().all()
        for txn in transactions:
            if not txn.occurred_at:
                continue
            amount = AutopilotService._to_decimal(txn.amount)
            if txn.type == "EXPENSE":
                amount *= Decimal("-1")
            events.append(
                {
                    "date": txn.occurred_at.date().isoformat(),
                    "type": "TRANSACTION",
                    "title": txn.description or "Transaction",
                    "amount": float(amount),
                    "is_automatic": False,
                    "is_completed": True,
                    "details": {
                        "category": (
                            category_name_map.get(str(txn.category_id), "Uncategorized")
                            if txn.category_id
                            else "Uncategorized"
                        ),
                        "transaction_type": txn.type,
                    },
                }
            )

        all_tx_res = await session.execute(select(Transaction).filter(Transaction.user_id == user_id))
        all_transactions = all_tx_res.scalars().all()
        total_income = sum(
            (AutopilotService._to_decimal(t.amount) for t in all_transactions if t.type == "INCOME"),
            Decimal("0"),
        )
        total_expense = sum(
            (AutopilotService._to_decimal(t.amount) for t in all_transactions if t.type == "EXPENSE"),
            Decimal("0"),
        )
        current_balance = total_income - total_expense

        bills_res = await session.execute(select(Bill).filter(Bill.user_id == user_id))
        bills = bills_res.scalars().all()
        bill_events: List[Dict[str, Any]] = []
        for bill in bills:
            bill_date = AutopilotService._next_recurring_date(now, bill.due_day)
            if bill_date > end_date:
                continue
            linked_order = payment_order_map.get(("BILL", bill.id, bill_date.date()))
            payment_status = linked_order.status if linked_order else None
            bill_events.append(
                {
                    "date": bill_date.date().isoformat(),
                    "type": "BILL_DUE",
                    "title": bill.name,
                    "amount": -float(AutopilotService._to_decimal(bill.amount_estimated)),
                    "is_automatic": bool(bill.autopay_enabled),
                    "is_completed": bool(
                        linked_order and linked_order.status == "succeeded"
                    ),
                    "details": {
                        "bill_name": bill.name,
                        "due_day": bill.due_day,
                        "autopay_enabled": bool(bill.autopay_enabled),
                        "payment_order_id": linked_order.id if linked_order else None,
                        "payment_status": payment_status,
                        "provider_action_url": linked_order.provider_action_url if linked_order else None,
                    },
                }
            )
        events.extend(bill_events)

        subs_res = await session.execute(
            select(Subscription).filter(Subscription.user_id == user_id, Subscription.is_active == True)
        )
        subscriptions = subs_res.scalars().all()
        subscription_events: List[Dict[str, Any]] = []
        for sub in subscriptions:
            next_billing = AutopilotService._resolve_subscription_due_date(now, sub)

            if next_billing > end_date:
                continue
            linked_order = payment_order_map.get(("SUBSCRIPTION", sub.id, next_billing.date()))
            payment_status = linked_order.status if linked_order else None
            subscription_events.append(
                {
                    "date": next_billing.date().isoformat(),
                    "type": "SUBSCRIPTION",
                    "title": sub.name,
                    "amount": -float(AutopilotService._to_decimal(sub.amount)),
                    "is_automatic": True,
                    "is_completed": bool(
                        linked_order and linked_order.status == "succeeded"
                    ),
                    "details": {
                        "subscription_name": sub.name,
                        "billing_cycle": sub.billing_cycle,
                        "payment_order_id": linked_order.id if linked_order else None,
                        "payment_status": payment_status,
                        "provider_action_url": linked_order.provider_action_url if linked_order else None,
                    },
                }
            )
        events.extend(subscription_events)

        goals_res = await session.execute(
            select(SavingsGoal).filter(SavingsGoal.user_id == user_id, SavingsGoal.is_completed == False)
        )
        goals = goals_res.scalars().all()

        incomes_res = await session.execute(
            select(IncomeSource).filter(IncomeSource.user_id == user_id, IncomeSource.active == True)
        )
        income_sources = incomes_res.scalars().all()

        salary_dates: List[datetime] = []
        for income in income_sources:
            salary_day = AutopilotService._parse_payday(income.payday)
            if salary_day is None:
                # Salary date must be explicitly set by user.
                continue
            salary_date = AutopilotService._next_recurring_date(now, salary_day)
            if salary_date > end_date:
                continue

            salary_dates.append(salary_date)
            auto_prepared_payments: List[Dict[str, float]] = []
            for bill in bills:
                auto_prepared_payments.append(
                    {
                        "name": bill.name,
                        "amount": float(AutopilotService._to_decimal(bill.amount_estimated)),
                    }
                )
            for sub in subscriptions:
                auto_prepared_payments.append(
                    {
                        "name": sub.name,
                        "amount": float(AutopilotService._to_decimal(sub.amount)),
                    }
                )
            for goal in goals:
                contribution_amount = AutopilotService._to_decimal(goal.monthly_contribution)
                if contribution_amount > 0:
                    auto_prepared_payments.append(
                        {
                            "name": goal.name,
                            "amount": float(contribution_amount),
                        }
                    )

            total_prepared = sum((Decimal(str(item["amount"])) for item in auto_prepared_payments), Decimal("0"))
            salary_amount = AutopilotService._to_decimal(income.amount)
            remaining_after = salary_amount - total_prepared

            events.append(
                {
                    "date": salary_date.date().isoformat(),
                    "type": "SALARY",
                    "title": "Salary Credited",
                    "amount": float(salary_amount),
                    "is_automatic": False,
                    "is_completed": salary_date.date() <= now.date(),
                    "details": {
                        "source": f"Income ({(income.frequency or 'monthly').lower()})",
                        "auto_prepared_payments": auto_prepared_payments,
                        "remaining_after": float(remaining_after),
                    },
                }
            )

        next_salary = min(salary_dates) if salary_dates else None
        if next_salary:
            contribution_date = next_salary.date().isoformat()
            for goal in goals:
                target_amount = AutopilotService._to_decimal(goal.target_amount)
                current_amount = AutopilotService._to_decimal(goal.current_amount)
                contribution_amount = AutopilotService._to_decimal(goal.monthly_contribution)
                if contribution_amount <= 0:
                    continue
                progress = int((current_amount / target_amount) * Decimal("100")) if target_amount > 0 else 0
                events.append(
                    {
                        "date": contribution_date,
                        "type": "GOAL_CONTRIBUTION",
                        "title": goal.name,
                        "amount": -float(contribution_amount),
                        "is_automatic": True,
                        "is_completed": False,
                        "details": {
                            "goal_name": goal.name,
                            "progress": progress,
                            "target": float(target_amount),
                        },
                    }
                )

        month_end_day = calendar.monthrange(now.year, now.month)[1]
        projection_date = now.replace(day=month_end_day, hour=0, minute=0, second=0, microsecond=0)
        if projection_date <= now:
            next_month_anchor = (now.replace(day=1) + timedelta(days=32)).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            next_month_end = calendar.monthrange(next_month_anchor.year, next_month_anchor.month)[1]
            projection_date = next_month_anchor.replace(day=next_month_end)

        if projection_date <= end_date:
            projection_cutoff = projection_date.date().isoformat()
            projected_income = sum(
                (
                    Decimal(str(event["amount"]))
                    for event in events
                    if event["type"] == "SALARY" and event["date"] <= projection_cutoff
                ),
                Decimal("0"),
            )
            projected_commitments = sum(
                (
                    Decimal(str(abs(event["amount"])))
                    for event in events
                    if event["amount"] < 0 and event["date"] <= projection_cutoff and not event["is_completed"]
                ),
                Decimal("0"),
            )
            projected_balance = current_balance + projected_income - projected_commitments
            days_to_projection = max((projection_date.date() - now.date()).days, 0)
            if days_to_projection <= 21:
                confidence = "high"
                confidence_score = 85
            elif days_to_projection <= 45:
                confidence = "medium"
                confidence_score = 65
            else:
                confidence = "low"
                confidence_score = 45
            events.append(
                {
                    "date": projection_cutoff,
                    "type": "PROJECTION",
                    "title": "Projected Balance",
                    "amount": float(projected_balance),
                    "is_automatic": False,
                    "is_completed": False,
                    "details": {
                        "confidence": confidence,
                        "confidence_score": confidence_score,
                    },
                }
            )

        events.sort(key=lambda event: (event["date"], event["type"]))
        upcoming_commitments = sum(
            (abs(event["amount"]) for event in events if event["amount"] < 0 and not event["is_completed"]),
            0.0,
        )
        next_salary_date = next_salary.date().isoformat() if next_salary else None
        days_until_salary = (next_salary.date() - now.date()).days if next_salary else None

        return {
            "events": events,
            "today": now.date().isoformat(),
            "summary": {
                "upcoming_commitments": round(upcoming_commitments, 2),
                "next_salary_date": next_salary_date,
                "days_until_salary": days_until_salary,
            },
        }

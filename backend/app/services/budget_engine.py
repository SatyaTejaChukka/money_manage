from decimal import Decimal
from typing import List, Dict
from datetime import datetime, timedelta
import calendar

from app.models.income import IncomeSource
from app.models.budget import BudgetRule, BudgetCategory
from app.models.transaction import Transaction

class BudgetEngine:
    @staticmethod
    def calculate_monthly_overview(
        incomes: List[IncomeSource],
        rules: List[BudgetRule],
        transactions: List[Transaction],
        year: int,
        month: int
    ) -> Dict:
        # 1. Calculate Total Income
        total_income = sum([i.amount for i in incomes if i.active])

        # 2. Calculate Total Spent (Expenses)
        total_spent = sum([
            t.amount for t in transactions 
            if t.type == "EXPENSE" and t.occurred_at.year == year and t.occurred_at.month == month
        ])

        # 3. Allocation Logic
        allocations = {}
        fixed_rules = [r for r in rules if r.allocation_type == "FIXED"]
        percent_rules = [r for r in rules if r.allocation_type == "PERCENT"]

        allocated_total = Decimal(0)

        # Apply Fixed Rules first
        for rule in fixed_rules:
            allocations[rule.category_id] = {
                "allocated": rule.allocation_value,
                "spent": Decimal(0),
                "remaining": rule.allocation_value
            }
            allocated_total += rule.allocation_value

        # Apply Percent Rules on Remaining Income? Or Total Income? 
        # Usually % is of Total Income.
        for rule in percent_rules:
            amount = total_income * (rule.allocation_value / Decimal(100))
            allocations[rule.category_id] = {
                "allocated": amount,
                "spent": Decimal(0),
                "remaining": amount
            }
            # Note: allocated_total mixed with % might exceed income, strictly speaking we should warn.

        # 4. Distribute Spending
        category_spending = {}
        for t in transactions:
            if t.type == "EXPENSE" and t.occurred_at.year == year and t.occurred_at.month == month:
                cat_id = t.category_id or "uncategorized"
                category_spending[cat_id] = category_spending.get(cat_id, Decimal(0)) + t.amount

        # Update allocations with actual spending
        for cat_id, data in allocations.items():
            spent = category_spending.get(cat_id, Decimal(0))
            data["spent"] = spent
            data["remaining"] = data["allocated"] - spent
        
        # Handle Uncategorized
        allocations["uncategorized"] = {
            "allocated": Decimal(0),
            "spent": category_spending.get("uncategorized", Decimal(0)),
            "remaining": -category_spending.get("uncategorized", Decimal(0))
        }

        # 5. Daily Spendable Calculation
        # Simple formula: (Income - Fixed Bills/Allocations - Spent) / Days Left
        # For this MVP: (Total Income - Total Spent) / Days Left
        
        today = datetime.utcnow()
        _, num_days = calendar.monthrange(year, month)
        days_left = max(1, num_days - today.day + 1) if (today.year == year and today.month == month) else 1
        
        remaining_budget = total_income - total_spent
        daily_spendable = max(Decimal(0), remaining_budget / days_left)

        return {
            "total_income": total_income,
            "total_spent": total_spent,
            "remaining_budget": remaining_budget,
            "daily_spendable": daily_spendable,
            "category_breakdown": allocations
        }

from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.transaction import Transaction
from app.models.budget import BudgetCategory, BudgetRule
from app.models.bill import Bill
from app.models.income import IncomeSource

class HealthScoreCalculator:
    """Calculate financial health score based on user's financial behavior"""
    
    @staticmethod
    async def calculate_savings_score(db: AsyncSession, user_id: str) -> int:
        """
        Calculate savings rate score (0-35 points)
        Based on: (Income - Expenses) / Income ratio
        - >30% savings = 35 points
        - 20-30% = 28 points
        - 10-20% = 20 points
        - 5-10% = 10 points
        - <5% = 5 points
        """
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Get total income
        income_result = await db.execute(
            select(func.sum(Transaction.amount))
            .filter(Transaction.user_id == user_id)
            .filter(Transaction.type == "INCOME")
            .filter(Transaction.occurred_at >= thirty_days_ago)
        )
        total_income = income_result.scalar() or 0
        
        # Get total expenses
        expense_result = await db.execute(
            select(func.sum(Transaction.amount))
            .filter(Transaction.user_id == user_id)
            .filter(Transaction.type == "EXPENSE")
            .filter(Transaction.occurred_at >= thirty_days_ago)
        )
        total_expenses = expense_result.scalar() or 0
        
        if total_income == 0:
            return 0
        
        savings_rate = ((total_income - total_expenses) / total_income) * 100
        
        if savings_rate >= 30:
            return 35
        elif savings_rate >= 20:
            return 28
        elif savings_rate >= 10:
            return 20
        elif savings_rate >= 5:
            return 10
        else:
            return 5
    
    @staticmethod
    async def calculate_budget_adherence_score(db: AsyncSession, user_id: str) -> int:
        """
        Calculate budget adherence score (0-35 points)
        Based on: How well user stays within budget limits
        """
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Get all budget rules with limits
        budget_rules_result = await db.execute(
            select(BudgetRule)
            .filter(BudgetRule.user_id == user_id)
            .filter(BudgetRule.monthly_limit.isnot(None))
        )
        budget_rules = budget_rules_result.scalars().all()
        
        if not budget_rules:
            return 20  # Default score if no budgets set
        
        adherence_scores = []
        for rule in budget_rules:
            # Get actual spending in this category
            spending_result = await db.execute(
                select(func.sum(Transaction.amount))
                .filter(Transaction.user_id == user_id)
                .filter(Transaction.category_id == rule.category_id)
                .filter(Transaction.type == "EXPENSE")
                .filter(Transaction.occurred_at >= thirty_days_ago)
            )
            actual_spending = spending_result.scalar() or 0
            
            if rule.monthly_limit > 0:
                ratio = actual_spending / float(rule.monthly_limit)
                if ratio <= 0.9:  # Under budget by 10%+
                    adherence_scores.append(100)
                elif ratio <= 1.0:  # Within budget
                    adherence_scores.append(80)
                elif ratio <= 1.2:  # Slightly over
                    adherence_scores.append(50)
                else:  # Significantly over
                    adherence_scores.append(20)
        
        if adherence_scores:
            avg_adherence = sum(adherence_scores) / len(adherence_scores)
            return int((avg_adherence / 100) * 35)
        return 20
    
    @staticmethod
    async def calculate_bill_punctuality_score(db: AsyncSession, user_id: str) -> int:
        """
        Calculate bill punctuality score (0-30 points)
        Based on: Regular bill payment tracking
        Since the Bill model doesn't track individual payment status,
        we'll give a base score based on bill management activity
        """
        # Get all bills for the user
        bills_result = await db.execute(
            select(Bill)
            .filter(Bill.user_id == user_id)
        )
        bills = bills_result.scalars().all()
        
        if not bills:
            return 25  # Default good score if no bills set up yet
        
        # Check if bills have recent payment activity
        recent_payments = 0
        for bill in bills:
            if bill.last_paid_at and bill.last_paid_at >= datetime.utcnow() - timedelta(days=45):
                recent_payments += 1
        
        if not bills:
            return 25
        
        # Calculate score based on recent payment activity
        payment_ratio = recent_payments / len(bills) if bills else 0
        if payment_ratio >= 0.8:
            return 30
        elif payment_ratio >= 0.6:
            return 25
        elif payment_ratio >= 0.4:
            return 18
        else:
            return 15
    
    @staticmethod
    async def calculate_overall_score(db: AsyncSession, user_id: str) -> dict:
        """Calculate overall financial health score"""
        # Check if user has any transactions at all
        any_transactions = await db.execute(
            select(func.count(Transaction.id))
            .filter(Transaction.user_id == user_id)
        )
        transaction_count = any_transactions.scalar() or 0

        # New user with no data — return neutral welcome state
        if transaction_count == 0:
            return {
                "score": 0,
                "savings_score": 0,
                "budget_adherence_score": 0,
                "bill_punctuality_score": 0,
                "grade": "-",
                "message": "Add income & expenses to see your score",
                "calculated_at": datetime.utcnow()
            }

        savings_score = await HealthScoreCalculator.calculate_savings_score(db, user_id)
        budget_score = await HealthScoreCalculator.calculate_budget_adherence_score(db, user_id)
        bill_score = await HealthScoreCalculator.calculate_bill_punctuality_score(db, user_id)
        
        total_score = savings_score + budget_score + bill_score
        
        # Determine grade
        if total_score >= 90:
            grade = "A"
            message = "Excellent! Your finances are in great shape! 🎉"
        elif total_score >= 80:
            grade = "B"
            message = "Great job! You're managing your money well! 💪"
        elif total_score >= 70:
            grade = "C"
            message = "Good progress! A few improvements will boost your score."
        elif total_score >= 60:
            grade = "D"
            message = "Keep working on it! Small changes make a big difference."
        else:
            grade = "F"
            message = "Let's build better habits together! Start with one area."
        
        return {
            "score": total_score,
            "savings_score": savings_score,
            "budget_adherence_score": budget_score,
            "bill_punctuality_score": bill_score,
            "grade": grade,
            "message": message,
            "calculated_at": datetime.utcnow()
        }

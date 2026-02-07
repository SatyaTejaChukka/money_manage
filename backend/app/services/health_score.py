from decimal import Decimal

class HealthScoreService:
    @staticmethod
    def calculate_score(
        monthly_income: Decimal,
        monthly_expenses: Decimal,
        missed_bills_count: int,
        savings_count: int,
        top_categories: list = [] # New: Pass in category data
    ) -> dict:
        # If user has no financial data at all, return a neutral state
        if monthly_income == 0 and monthly_expenses == 0 and missed_bills_count == 0:
            return {
                "score": 0,
                "color": "#71717a",  # zinc-500 (neutral)
                "message": "Add income & expenses to see your score",
                "insights": [
                    {
                        "type": "info",
                        "title": "Welcome to WealthSync!",
                        "message": "Start by adding your income sources and recording transactions to get your financial health score."
                    }
                ]
            }

        score = 100
        insights = []

        # 1. Spending Ratio
        if monthly_income > 0:
            ratio = monthly_expenses / monthly_income
            if ratio > 0.9:
                score -= 30
                insights.append({
                    "type": "warning",
                    "title": "High Spending Alert",
                    "message": f"You've spent {int(ratio*100)}% of your income this month."
                })
            elif ratio > 0.7:
                score -= 10
                insights.append({
                    "type": "info",
                    "title": "Watch Your Spending",
                    "message": f"You're at {int(ratio*100)}% of your monthly income."
                })
            elif ratio < 0.5:
                score += 10
                insights.append({
                    "type": "success",
                    "title": "Great Savings Rate",
                    "message": "You're saving more than 50% of your income!"
                })
        else:
            if monthly_expenses > 0:
                 insights.append({
                    "type": "warning",
                    "title": "No Income Recorded",
                    "message": "You have expenses but no income logged this month."
                 })

        # 2. Category Analysis (Top Spender)
        if top_categories:
            top = top_categories[0]
            # If top category is > 40% of expenses, warn
            if monthly_expenses > 0 and (top['value'] / float(monthly_expenses)) > 0.4:
                 insights.append({
                    "type": "warning",
                    "title": f"High {top['name']} Spending",
                    "message": f"{top['name']} accounts for {int((top['value'] / float(monthly_expenses))*100)}% of your spending."
                 })

        # 3. Penalize Missed Bills
        if missed_bills_count > 0:
            score -= (missed_bills_count * 15)
            insights.append({
                "type": "danger",
                "title": "Missed Bills",
                "message": f"You have {missed_bills_count} overdue bills."
            })
        
        # Clamp Score
        score = max(0, min(100, int(score)))
        
        # Final Color/Message logic
        color = "#10b981" # green-500
        message = "Financial Health is Excellent"
        
        if score < 80:
            color = "#3b82f6" # blue-500
            message = "Financial Health is Good"
        if score < 60:
            color = "#eab308" # yellow-500
            message = "Financial Health Needs Attention"
        if score < 40:
            color = "#ef4444" # red-500
            message = "Critical Financial Status"
            
        return {
            "score": score,
            "color": color,
            "message": message,
            "insights": insights
        }

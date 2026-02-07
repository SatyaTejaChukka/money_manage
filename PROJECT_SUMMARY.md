# 🏆 Project Summary — WealthSync

## Overview

WealthSync is a full-stack **Personal Finance Management Platform** that serves as a single source of truth for income, expenses, bills, subscriptions, savings goals, and financial health. It combines practical money tracking with intelligent scoring and a polished dark-themed UI.

---

## Architecture

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Frontend   │◄─────►│   Backend API    │◄─────►│  PostgreSQL  │
│  React + Vite│  REST  │  FastAPI + Async │  SQL   │  (Supabase)  │
│  Tailwind 4  │       │  SQLAlchemy      │       │              │
└──────────────┘       └──────────────────┘       └──────────────┘
                              │
                         ┌────┴────┐
                         │  Redis  │ (optional: Celery tasks)
                         └─────────┘
```

- **Decoupled**: Frontend and backend are fully independent; communicate via REST API
- **Async-First**: All database operations use async SQLAlchemy with asyncpg for high throughput
- **Type-Safe**: Pydantic v2 schemas on the backend enforce strict request/response validation
- **Migration-Managed**: All schema changes go through Alembic — no raw SQL in production

---

## Key Modules

### 1. Budget Engine

Goes beyond simple trackers. WealthSync calculates a **Daily Spendable Amount** by taking your total income, subtracting fixed bills and budget allocations, then dividing the remainder by days left in the month. Budget rules support both **fixed-amount** and **percentage-based** allocations per category.

### 2. Financial Health Score

An intelligent 0–100 scoring algorithm that evaluates your financial month across four dimensions:

| Component          | Weight | What It Measures                            |
| ------------------ | ------ | ------------------------------------------- |
| Spending Ratio     | 35%    | Monthly expenses vs. income                 |
| Bill Discipline    | 25%    | Missed or late bill payments                |
| Savings Progress   | 20%    | Progress toward active savings goals        |
| Budget Adherence   | 20%    | Spending within budget rule limits          |

New users see a neutral welcome state (score 0, grade "–") with guidance to add their first income and expenses, avoiding misleading default scores.

### 3. Dashboard & Analytics

- **Stats Cards**: Month-over-month income, expenses, net savings, daily spendable
- **Spending Chart**: Category-wise spending breakdown (Recharts pie/bar charts)
- **Recent Activity**: Live feed of the latest transactions
- **Insights Panel**: AI-generated recommendations based on spending patterns

### 4. Bill & Subscription Management

- Track recurring bills with due-day, amount, category, and autopay status
- Mark bills as paid with one click (optimistic UI update)
- Manage subscriptions with monthly/yearly billing cycles and active/inactive status

### 5. Savings Goals

- Create goals with target amount and optional deadline
- Contribute funds with a full contribution history log
- Visual progress bars with percentage tracking

### 6. Toast Notification System

Professional dark-themed toast notifications for every CRUD operation:

- **Success** (green) — Create, update, delete, mark-paid confirmations
- **Error** (red) — API failure feedback with extended 6-second display
- **Warning** (amber) — Validation and limit warnings
- **Info** (blue) — General informational messages

Auto-dismiss progress bar, slide-in animation, stacked bottom-right positioning.

---

## UI/UX Design

| Aspect           | Implementation                                         |
| ---------------- | ------------------------------------------------------ |
| Theme            | Dark glassmorphism — zinc-950 base, frosted glass cards |
| Primary Gradient | Violet-500 → Indigo-500 (`#8b5cf6` → `#6366f1`)       |
| Typography       | System font stack, antialiased                         |
| Cards            | `glass-card` utility — blur-xl, white/5 borders        |
| Animations       | Framer Motion page transitions, CSS slide-up/fade-in   |
| Responsive       | Mobile-first, collapsible sidebar                      |

---

## Database Models

| Model          | Key Fields                                              |
| -------------- | ------------------------------------------------------- |
| User           | email, hashed_password, full_name, avatar_url           |
| Income         | source, amount, frequency, user_id                      |
| Transaction    | amount, type (income/expense), category_id, date        |
| Category       | name, color, icon, is_default                           |
| Bill           | name, amount_estimated, due_day, autopay, last_paid_at  |
| Subscription   | name, amount, billing_cycle, is_active, next_billing    |
| BudgetRule     | category_id, allocation_type, allocation_value, limit   |
| SavingsGoal    | name, target_amount, current_amount, target_date        |
| Notification   | title, message, type, is_read, user_id                  |
| HealthScore    | score, grade, components, calculated_at                 |

---

## Security

- **Authentication**: JWT bearer tokens (8-day expiry by default)
- **Password Hashing**: Argon2 via passlib
- **Rate Limiting**: Login (5/min), Signup (3/min) via slowapi
- **CORS**: Configurable allowed origins
- **Trusted Hosts**: Configurable host allowlist
- **Security Headers**: Custom middleware adds X-Content-Type-Options, X-Frame-Options, etc.
- **Sentry**: Optional error monitoring integration

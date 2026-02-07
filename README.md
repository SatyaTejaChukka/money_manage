# 💰 WealthSync — Personal Finance Platform

A comprehensive, full-stack personal finance management system built with **FastAPI** and **React**. Track income, expenses, bills, subscriptions, savings goals, and get an intelligent financial health score — all in a polished dark glassmorphism UI.

---

## ✨ Features

### Core Finance

- **Income Tracking** — Manage multiple income sources (salary, freelance, dividends)
- **Expense Tracking** — Daily transaction logging with category tagging
- **Bill Management** — Recurring bill tracking with due-day reminders and autopay flags
- **Subscription Tracker** — Monitor recurring subscriptions with billing cycle tracking

### Smart Budgeting

- **Budget Rules** — Create fixed-amount or percentage-based budget allocations per category
- **Daily Spendable** — Calculates your "safe to spend" daily limit based on income, bills, and allocations
- **Budget Summary** — Monthly overview of allocated vs. spent per category

### Savings & Goals

- **Savings Goals** — Set targets with deadlines, contribute funds, and track progress visually
- **Contribution History** — Full log of contributions per goal with timestamps

### Intelligence

- **Financial Health Score** — 0–100 score based on spending ratio, missed bills, savings progress, and budget adherence
- **Health Score Gauge** — Animated circular gauge with grade (A+ to F) and personalized recommendations
- **Dashboard Analytics** — Spending charts, category breakdowns, and recent activity feed

### User Experience

- **Toast Notifications** — Professional slide-in toasts for all CRUD operations (success, error, warning, info)
- **Optimistic Updates** — Instant UI feedback on delete/update operations with automatic rollback on failure
- **Auto-Login on Signup** — Seamless onboarding; new users land directly on the dashboard
- **Dark Glassmorphism UI** — Frosted glass effects, violet-to-indigo gradients, zinc-900 foundations
- **Responsive Design** — Works across desktop and mobile viewports

---

## 🛠️ Tech Stack

| Layer          | Technology                                                      |
| -------------- | --------------------------------------------------------------- |
| **Frontend**   | React 19, React Router 7, Tailwind CSS 4, Recharts, Framer Motion |
| **Backend**    | FastAPI, Python 3.11, Pydantic v2, SQLAlchemy (async)           |
| **Database**   | PostgreSQL 15 (via asyncpg)                                     |
| **Auth**       | JWT (python-jose), Argon2 password hashing                      |
| **Migrations** | Alembic                                                         |
| **Task Queue** | Celery + Redis (optional)                                       |
| **Build Tool** | Vite (rolldown-vite)                                            |
| **Deployment** | Render (backend), Vercel (frontend), Supabase/Neon (database)   |
| **Dev Infra**  | Docker Compose, PowerShell setup script                         |

---

## 📁 Project Structure

```
money_manage/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # 12 route modules (auth, bills, budgets, etc.)
│   │   ├── core/            # Config, database, security, middleware
│   │   ├── models/          # SQLAlchemy models (10 entities)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic (budget engine, health score)
│   │   ├── tasks/           # Celery background tasks
│   │   └── static/avatars/  # User avatar uploads
│   ├── alembic/versions/    # Database migrations
│   ├── tests/               # Pytest test suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # 25 reusable components (UI, dashboard, etc.)
│   │   ├── pages/           # 8 page views (Landing, Login, Dashboard, etc.)
│   │   ├── services/        # 9 API service modules
│   │   ├── lib/             # Auth context, API client, utilities
│   │   └── layouts/         # MainLayout with Sidebar
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml       # Local development stack
├── docker-compose.hub.yml   # Pre-built image deployment
├── setup.ps1                # Windows one-click setup
├── DEPLOYMENT.md            # Production deployment guide
├── QUICKSTART.md            # Quick start instructions
└── DOCKER_HUB.md            # Docker Hub deployment guide
```

---

## 🚀 Getting Started

### Prerequisites

- **Docker & Docker Compose** (recommended) — _or_ Node.js 18+ and Python 3.11+
- PostgreSQL 15 (if running without Docker)

### Quick Start (Docker)

```bash
git clone https://github.com/SatyaTejaChukka/money_manage.git
cd money_manage
```

**Windows:**
```powershell
.\setup.ps1
```

**Linux / macOS:**
```bash
docker-compose up -d --build
docker-compose exec backend alembic upgrade head
cd frontend && npm install && npm run dev
```

Once running:

| Service          | URL                                                |
| ---------------- | -------------------------------------------------- |
| Frontend         | [http://localhost:3000](http://localhost:3000)      |
| Backend API Docs | [http://localhost:8000/docs](http://localhost:8000/docs) |

### Manual Development Setup

<details>
<summary><strong>Backend</strong></summary>

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

</details>

<details>
<summary><strong>Frontend</strong></summary>

```bash
cd frontend
npm install
npm run dev
```

</details>

---

## 🌐 Deployment

See the full **[Deployment Guide →](DEPLOYMENT.md)** for step-by-step instructions.

| Component    | Recommended Host         |
| ------------ | ------------------------ |
| Frontend     | Vercel                   |
| Backend      | Render                   |
| Database     | Supabase or Neon         |

---

## 🔌 API Endpoints

All endpoints are under `/api/v1`. Interactive docs available at `/docs` (Swagger UI).

| Module          | Prefix               | Description                          |
| --------------- | --------------------- | ------------------------------------ |
| Auth            | `/auth`               | Signup, login, current user          |
| Users           | `/users`              | Profile management, avatar upload    |
| Income          | `/income`             | Income source CRUD                   |
| Transactions    | `/transactions`       | Expense/income transaction logging   |
| Categories      | `/categories`         | Spending categories                  |
| Budgets         | `/budgets`            | Budget rules and monthly summaries   |
| Bills           | `/bills`              | Recurring bill tracking              |
| Subscriptions   | `/subscriptions`      | Subscription management              |
| Goals           | `/goals`              | Savings goals with contribution logs |
| Dashboard       | `/dashboard`          | Aggregated summary and analytics     |
| Notifications   | `/notifications`      | User notification feed               |
| Health Score    | `/health`             | Financial health score calculation   |

---

## 📄 License

This project is for personal and educational use.

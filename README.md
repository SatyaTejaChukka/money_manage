# 💰 WealthSync - Personal Finance Platform

A comprehensive, self-hosted personal finance management system built with FastAPI and Next.js.

## 🚀 Key Features

### Core Banking

- **Income Tracking**: Manage multiple income sources (Salary, Freelance, Dividend)
- **Budgeting**: Smart budgeting with Fixed and Percentage-based rules
- **Expense Tracking**: Daily transaction logging with categorization
- **Bill Management**: Recurring bill tracking with due date reminders

### Enhanced Intelligence

- **Budget Health Score**: Gamified 0-100 score of your financial health
- **Daily Spendable**: "Safe to spend" daily limit calculator
- **Savings Goals**: Goal tracking with priority-based auto-deduction
- **Subscription Tracker**: Manage recurring subs with usage analytics

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 15 (Async SQLAlchemy)
- **Frontend**: Next.js 14 (TypeScript + Tailwind)
- **Infrastructure**: Docker Compose

## 🚀 Deployment

**[👉 Read the Step-by-Step Deployment Guide](DEPLOYMENT.md)**

Supports deployment on:

- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, Fly.io
- **Database**: Neon, Supabase, ElephantSQL

## 🏁 Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend dev)

### Quick Start (Docker)

1. **Clone & Setup:**

   ```bash
   git clone https://github.com/SatyaTejaChukka/money_manage
   cd money_manage
   ./setup.ps1
   ```

   _If on Linux/Mac, run `docker-compose up -d --build` manually._

2. **Access App:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

3. **Login:**
   - Create a new account at `/signup`

## 🧪 Development

### Backend

```bash
cd backend
# Create virtualenv
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Run migration
alembic upgrade head
# Start Dev Server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

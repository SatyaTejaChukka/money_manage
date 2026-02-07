# WealthSync — Frontend

The React frontend for WealthSync, built with Vite and Tailwind CSS 4.

---

## Tech Stack

| Technology       | Version | Purpose                          |
| ---------------- | ------- | -------------------------------- |
| React            | 19      | UI framework                     |
| React Router     | 7       | Client-side routing              |
| Tailwind CSS     | 4       | Utility-first styling            |
| Recharts         | 3       | Charts and data visualization    |
| Framer Motion    | 12      | Page transitions and animations  |
| Lucide React     | 0.563   | Icon library                     |
| Axios            | 1.13    | HTTP client                      |
| Vite (rolldown)  | 7.2     | Build tool and dev server        |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:prod

# Preview production build
npm run preview
```

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # Primitives — Button, Card, Input, Modal, Toast, Alert, etc.
│   ├── dashboard/       # Dashboard widgets — StatsCard, SpendingChart, InsightsPanel
│   ├── budget/          # BudgetRuleForm
│   ├── goals/           # GoalForm
│   ├── layout/          # Sidebar navigation
│   ├── notifications/   # NotificationBell
│   └── transactions/    # TransactionForm, TransactionTable
├── pages/               # Route-level page components
│   ├── Landing.jsx      # Public landing page
│   ├── Login.jsx        # Login form
│   ├── Signup.jsx       # Registration (auto-login on success)
│   └── dashboard/       # Authenticated pages
│       ├── Dashboard.jsx
│       ├── Transactions.jsx
│       ├── Bills.jsx
│       ├── Subscriptions.jsx
│       ├── Budget.jsx
│       ├── Goals.jsx
│       ├── Analytics.jsx
│       └── Settings.jsx
├── services/            # API service modules (one per domain)
│   ├── bills.js
│   ├── budgets.js
│   ├── categories.js
│   ├── dashboard.js
│   ├── goals.js
│   ├── notifications.js
│   ├── subscriptions.js
│   ├── transactions.js
│   └── user.js
├── lib/
│   ├── api.js           # Axios instance with auth interceptor
│   ├── auth.jsx         # AuthContext provider (JWT token management)
│   └── utils.js         # Utility functions (cn, formatCurrency, etc.)
├── layouts/
│   └── MainLayout.jsx   # Dashboard shell with Sidebar
├── App.jsx              # Route definitions
├── main.jsx             # Entry point (providers: Router, Auth, Toast)
└── index.css            # Tailwind config, theme variables, animations
```

---

## Design System

| Token            | Value                                   |
| ---------------- | --------------------------------------- |
| Background       | `#09090b` (Zinc 950)                    |
| Primary          | `#8b5cf6` → `#6366f1` (Violet → Indigo)|
| Card Style       | `glass-card` — blur-xl, white/5 border  |
| Glass Style      | `glass` — blur-md, white/10 border      |
| Text Gradient    | `text-gradient` — violet-400 to indigo-400 |

---

## Environment Variables

| Variable           | Description                      | Example                                   |
| ------------------ | -------------------------------- | ----------------------------------------- |
| `VITE_API_BASE_URL`| Backend API base URL             | `http://localhost:8000/api/v1`            |
| `VITE_ENVIRONMENT` | Environment label                | `development` or `production`             |

# 🚀 Quick Start Guide

## 1 minute Setup

We have provided a PowerShell automation script for Windows users.

1. Open PowerShell in the project root.
2. Run:
   ```powershell
   .\setup.ps1
   ```
3. Wait for the script to:
   - Start Docker containers (DB, API, Redis)
   - Run Database Migrations
   - Install Frontend dependencies

## Manual Setup (Linux/Mac/Manual)

### 1. Start Infrastructure

```bash
docker-compose up -d
```

### 2. Run Migrations

```bash
docker-compose exec api alembic upgrade head
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

- **Database Connection Failed**: Ensure Docker is running and port 5432 is not occupied.
- **Frontend API Error**: Ensure Backend is running at `localhost:8000`.

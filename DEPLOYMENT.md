# 🚀 WealthSync Deployment Guide

This guide will help you deploy the WealthSync application to production using Vercel (Frontend) and Railway/Render (Backend).

## 📋 Prerequisites

- [GitHub Account](https://github.com)
- [Vercel Account](https://vercel.com)
- [Railway Account](https://railway.app) OR [Render Account](https://render.com)
- [Neon Account](https://neon.tech) (Recommended for Postgres) OR [Supabase](https://supabase.com)

---

## 🗄️ Step 1: Database Setup (Neon/Postgres)

1. Create a new project in **Neon** (or Supabase).
2. Create a database named `wealth_sync`.
3. Copy the **Connection String** (Postgres URL).
   - Format: `postgres://user:password@host/wealth_sync`

---

## 🛠️ Step 2: Backend Deployment (Railway)

1. Login to **Railway**.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your `money_manage` repository.
4. Add the following **Environment Variables** in Railway:

| Variable                      | Value                                    | Description    |
| ----------------------------- | ---------------------------------------- | -------------- |
| `PROJECT_NAME`                | `WealthSync`                             | App Name       |
| `API_V1_STR`                  | `/api/v1`                                | API Prefix     |
| `ENVIRONMENT`                 | `production`                             | Environment    |
| `DEBUG`                       | `False`                                  | Disable Debug  |
| `ENABLE_DOCS`                 | `False`                                  | Disable docs   |
| `AUTO_CREATE_TABLES`          | `False`                                  | Use Alembic    |
| `SECRET_KEY`                  | `<Generate a random 32-char string>`     | Security Key   |
| `DATABASE_URL`                | `<Your Neon Connection String>`          | Database URL   |
| `BACKEND_CORS_ORIGINS`        | `["https://your-vercel-app.vercel.app"]` | Allow Frontend |
| `ALLOWED_HOSTS`               | `["your-backend-host.com"]`              | Host allowlist |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `11520`                                  | Token Expiry   |
| `RATE_LIMIT_LOGIN`            | `5/minute`                               | Login limiter  |
| `RATE_LIMIT_SIGNUP`           | `3/minute`                               | Signup limiter |
| `REDIS_URL`                   | `<optional>`                             | Celery/Redis   |

5. Under **Settings** > **Root Directory**, set it to `/backend`.
6. Railway will automatically detect the `Procfile` and deploy.
7. Once deployed, copy the **Public Domain** (e.g., `https://wealth-sync-production.up.railway.app`).

---

## 🎨 Step 3: Frontend Deployment (Vercel)

1. Login to **Vercel**.
2. Click **Add New** > **Project**.
3. Import your `money_manage` repository.
4. Configure **Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build:prod`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add **Environment Variables**:

| Variable            | Value                                                  |
| ------------------- | ------------------------------------------------------ |
| `VITE_API_BASE_URL` | `https://wealth-sync-production.up.railway.app/api/v1` |
| `VITE_ENVIRONMENT`  | `production`                                           |

6. Click **Deploy**.

---

## 🔄 Step 4: Final Configuration

1. **Update CORS on Backend**:
   - Go back to Railway variables.
   - Update `BACKEND_CORS_ORIGINS` with your actual Vercel URL (e.g., `["https://wealth-sync.vercel.app"]`).
   - Redeploy Backend.

2. **Verify Setup**:
   - Open your Vercel URL.
   - Try to Signup/Login.
   - Check if data persists.

---

## 🛡️ Troubleshooting

- **CORS Errors**: Check `BACKEND_CORS_ORIGINS` in Backend variables. It must exactly match your frontend URL (no trailing slash).
- **Database Errors**: Verify `DATABASE_URL` in Backend. Ensure "Connect from anywhere" is enabled in Neon.
- **Build Fails**: Check logs in Vercel/Railway. Ensure `package.json` and `requirements.txt` are correct.

# Docker Modes

## Local development (default)

This mode is safe for local-only work and does not depend on your existing `backend/.env` values for host/CORS.

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Production-ready mode (when you are ready to deploy)

1. Copy production env template:

```bash
cp .env.prod.example .env.prod
```

PowerShell:

```powershell
Copy-Item .env.prod.example .env.prod
```

2. Set real values in `.env.prod`:
- `SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `BACKEND_CORS_ORIGINS`
- `ALLOWED_HOSTS`
- `VITE_API_BASE_URL`

3. Run with production override:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

This switches to:
- `backend/Dockerfile.prod`
- `frontend/Dockerfile.prod` (nginx serving static frontend)
- production-safe backend flags (`ENVIRONMENT=production`, `DEBUG=False`, docs disabled)

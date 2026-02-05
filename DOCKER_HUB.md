# WealthSync - Docker Hub Deployment

Pull and run WealthSync using Docker! 🚀

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. Download the docker-compose file:
```bash
curl -O https://raw.githubusercontent.com/satyatejachukka/money_manage/main/docker-compose.hub.yml
```

Or create `docker-compose.yml` with:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: wealth_sync_db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=wealth_sync
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: wealth_sync_redis
    ports:
      - "6379:6379"
    restart: unless-stopped

  backend:
    image: satyatejachukka/wealthsync-backend:latest
    container_name: wealth_sync_backend
    environment:
      - PROJECT_NAME=WealthSync
      - POSTGRES_SERVER=db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=wealth_sync
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db/wealth_sync
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=your-secret-key-change-in-production
      - BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:80","http://localhost"]
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  frontend:
    image: satyatejachukka/wealthsync-frontend:latest
    container_name: wealth_sync_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

2. Run:
```bash
docker-compose up -d
```

3. Access the app at: http://localhost

---

### Option 2: Pull Images Manually

```bash
# Pull the images
docker pull satyatejachukka/wealthsync-backend:latest
docker pull satyatejachukka/wealthsync-frontend:latest
```

---

## Docker Hub Links

- **Backend**: https://hub.docker.com/r/satyatejachukka/wealthsync-backend
- **Frontend**: https://hub.docker.com/r/satyatejachukka/wealthsync-frontend

---

## Ports

| Service  | Port |
|----------|------|
| Frontend | 80   |
| Backend  | 8000 |
| PostgreSQL | 5432 |
| Redis    | 6379 |

---

## Environment Variables

### Backend
| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | - | JWT secret key (change in production!) |
| `POSTGRES_USER` | postgres | Database user |
| `POSTGRES_PASSWORD` | postgres | Database password |
| `POSTGRES_DB` | wealth_sync | Database name |

---

## Stop the Application

```bash
docker-compose down
```

To remove all data (including database):
```bash
docker-compose down -v
```

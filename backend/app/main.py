from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=settings.DEBUG
)

from fastapi.staticfiles import StaticFiles
import os

# Create static directory if not exists
os.makedirs("app/static/avatars", exist_ok=True)

from app.core.database import engine, Base
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "app_name": settings.PROJECT_NAME}

@app.get("/")
def root():
    return {"message": "Welcome to MoneyOS API"}

from app.api.v1 import auth, income, categories, budgets, transactions, bills, savings, subscriptions, users, dashboard

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(income.router, prefix=f"{settings.API_V1_STR}/income", tags=["income"])
app.include_router(categories.router, prefix=f"{settings.API_V1_STR}/categories", tags=["categories"])
app.include_router(budgets.router, prefix=f"{settings.API_V1_STR}/budgets", tags=["budgets"])
app.include_router(transactions.router, prefix=f"{settings.API_V1_STR}/transactions", tags=["transactions"])
app.include_router(bills.router, prefix=f"{settings.API_V1_STR}/bills", tags=["bills"])
app.include_router(savings.router, prefix=f"{settings.API_V1_STR}/goals", tags=["savings"])
app.include_router(subscriptions.router, prefix=f"{settings.API_V1_STR}/subscriptions", tags=["subscriptions"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])

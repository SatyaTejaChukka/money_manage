from typing import List, Union
import json
import ast
from pydantic import AnyHttpUrl, PostgresDsn, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MoneyOS"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, list):
            return [str(i) for i in v]

        if isinstance(v, str):
            raw = v.strip()

            # Accept JSON list or Python list string forms.
            if raw.startswith("["):
                parsed = None
                try:
                    parsed = json.loads(raw)
                except Exception:
                    try:
                        parsed = ast.literal_eval(raw)
                    except Exception:
                        parsed = None

                if isinstance(parsed, list):
                    return [str(i) for i in parsed]

            # Fallback: comma-separated string
            return [part.strip().strip('"').strip("'") for part in raw.split(",") if part.strip()]

        raise ValueError(v)

    # Database
    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "money_manager"
    DATABASE_URL: PostgresDsn | None = None

    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: str | None, values: dict[str, any]) -> any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            path=f"{values.get('POSTGRES_DB') or ''}",
        )

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

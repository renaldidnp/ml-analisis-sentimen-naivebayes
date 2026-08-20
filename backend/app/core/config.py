from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    cors_origins: str = "http://localhost:3000"
    max_upload_mb: int = 25
    text_column: str = "Tweet"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def MODEL_DIR(self) -> Path:
        return BASE_DIR / "ml"

    @property
    def STORAGE_DIR(self) -> Path:
        return BASE_DIR / "storage"


settings = Settings()
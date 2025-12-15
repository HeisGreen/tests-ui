from functools import lru_cache
import os

from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load variables from a .env file if present
load_dotenv()


class Settings(BaseModel):
    app_name: str = Field(default="Visa Recommendation API")
    environment: str = Field(default_factory=lambda: os.getenv("ENV", "local"))
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    openai_model: str = Field(default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-4o-mini"))


@lru_cache
def get_settings() -> Settings:
    return Settings()

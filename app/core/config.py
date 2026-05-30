from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    TAVILY_API_KEY: str
    DATABASE_URL: str
    MODEL_NAME: str = "gemini-2.5-flash"
    COHERE_API_KEY: Optional[str] = None
    JINA_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

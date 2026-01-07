from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    TAVILY_API_KEY: str
    DATABASE_URL: str
    MODEL_NAME: str = "gemini-2.5-flash"

  
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

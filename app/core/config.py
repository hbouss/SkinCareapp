# app/core/config.py

from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = Field("SkinCareapp", env="PROJECT_NAME")
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str
    ROBOFLOW_INFERENCE_API_URL: str
    ROBOFLOW_INFERENCE_API_KEY: str
    ROBOFLOW_INFERENCE_MODEL_ID: str
    IMAGE_SAVE_DIR: str = "./static/images"
    IMAGE_URL_PREFIX: str = "/images"
    OPENAI_API_KEY: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
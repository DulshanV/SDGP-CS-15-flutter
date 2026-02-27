"""
Application configuration loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://hscode_user:hscode_pass@localhost:5432/hscode_db"
    database_url_sync: str = "postgresql+psycopg2://hscode_user:hscode_pass@localhost:5432/hscode_db"

    # ChromaDB
    chroma_persist_dir: str = "./data/chroma_db"

    # Dataset
    dataset_csv_path: str = "../all_chapters_extracted.csv"

    # Firebase
    firebase_project_id: str = "your-firebase-project-id"
    firebase_credentials_path: str = "./firebase-service-account.json"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = '["*"]'

    # Embedding
    embedding_model: str = "all-MiniLM-L6-v2"

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.cors_origins)
        except (json.JSONDecodeError, TypeError):
            return ["*"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()

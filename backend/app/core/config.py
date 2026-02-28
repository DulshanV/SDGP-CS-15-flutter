"""
Application configuration loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # Environment: "development" or "production"
    env: str = "development"

    # Database
    database_url: str = "postgresql+asyncpg://hscode_user:hscode_pass@localhost:5432/hscode_db"
    database_url_sync: str = "postgresql+psycopg2://hscode_user:hscode_pass@localhost:5432/hscode_db"

    # ChromaDB / FAISS data directory
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

    # Search backend: "typesense" or "faiss"
    search_backend: str = "faiss"

    # Typesense
    typesense_host: str = "localhost"
    typesense_port: int = 8108
    typesense_protocol: str = "http"
    typesense_api_key: str = "xyz"  # default dev key
    typesense_collection: str = "hs_codes"

    # Enrichment — multi-provider cascade (Groq → Gemini → Cohere)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    cohere_api_key: str = ""
    cohere_model: str = "command-r"
    enrichment_confidence_threshold: float = 0.35  # trigger enrichment below this

    # Rate limiting
    rate_limit_search: str = "30/minute"  # search endpoint
    rate_limit_default: str = "60/minute"  # other endpoints

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"

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

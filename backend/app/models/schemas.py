"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Search Schemas ──


class SearchResult(BaseModel):
    hscode: str
    description: str
    section: str
    level: int
    parent: Optional[str] = None
    relevance_pct: float = Field(ge=0, le=100, description="Relevance percentage 0-100")
    hierarchy_path: List[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class SearchResponse(BaseModel):
    query: str
    corrected_query: Optional[str] = None
    total_results: int
    results: List[SearchResult]


class HSCodeDetail(BaseModel):
    hscode: str
    description: str
    section: str
    level: int
    parent: Optional[str] = None
    children: List[dict] = Field(default_factory=list)


class CategorySummary(BaseModel):
    section: str
    chapters: List[dict]


# ── User Schemas ──


class UserSync(BaseModel):
    """Sent after Firebase login to sync user to PostgreSQL."""
    firebase_uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    firebase_uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Search History Schemas ──


class SearchHistoryItem(BaseModel):
    id: str
    query_text: str
    top_result_hscode: Optional[str] = None
    top_result_description: Optional[str] = None
    results_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SearchHistoryResponse(BaseModel):
    total: int
    items: List[SearchHistoryItem]


# ── Favorite Schemas ──


class FavoriteCreate(BaseModel):
    hscode: str
    description: Optional[str] = None
    section: Optional[str] = None


class FavoriteResponse(BaseModel):
    id: str
    hscode: str
    description: Optional[str] = None
    section: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FavoriteListResponse(BaseModel):
    total: int
    items: List[FavoriteResponse]


# ── Admin Schemas ──


class TrendItem(BaseModel):
    query_text: str
    search_count: int
    last_searched: datetime


class TrendResponse(BaseModel):
    period_days: int
    trends: List[TrendItem]

# CeylonHS — CW2 Implementation Report

## Software Development Group Project (SDGP) — CS-15

**Project Title:** CeylonHS — AI-Powered HS Code Search & Trade Classification Platform

**Module:** Software Development Group Project

**Group:** CS-15

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Backend Implementation](#4-backend-implementation)
   - 4.1 [Application Structure & Entry Point](#41-application-structure--entry-point)
   - 4.2 [Core Infrastructure](#42-core-infrastructure)
   - 4.3 [Database Design & ORM Models](#43-database-design--orm-models)
   - 4.4 [API Endpoints](#44-api-endpoints)
   - 4.5 [Search Engine Architecture](#45-search-engine-architecture)
   - 4.6 [AI Enrichment Pipeline](#46-ai-enrichment-pipeline)
   - 4.7 [Training Data Collection & Feedback Loop](#47-training-data-collection--feedback-loop)
   - 4.8 [AI Chatbot Integration](#48-ai-chatbot-integration)
5. [Flutter Mobile Application](#5-flutter-mobile-application)
   - 5.1 [Application Structure & Navigation](#51-application-structure--navigation)
   - 5.2 [Data Models](#52-data-models)
   - 5.3 [Service Layer](#53-service-layer)
   - 5.4 [Screens & User Interface](#54-screens--user-interface)
   - 5.5 [State Management](#55-state-management)
6. [Next.js Web Application](#6-nextjs-web-application)
   - 6.1 [Application Architecture](#61-application-architecture)
   - 6.2 [Landing Page & SEO Strategy](#62-landing-page--seo-strategy)
   - 6.3 [Core Pages & Features](#63-core-pages--features)
   - 6.4 [Component Architecture](#64-component-architecture)
   - 6.5 [Theming & Visual Design System](#65-theming--visual-design-system)
7. [Authentication & Security](#7-authentication--security)
8. [DevOps & Deployment](#8-devops--deployment)
9. [Testing Strategy](#9-testing-strategy)
10. [Design Patterns & Architectural Decisions](#10-design-patterns--architectural-decisions)
11. [Challenges, Failures & Lessons Learned](#11-challenges-failures--lessons-learned)
12. [Individual Contributions](#12-individual-contributions)
13. [Conclusion](#13-conclusion)

---

## 1. Introduction

### 1.1 Project Overview

CeylonHS is an AI-powered Harmonized System (HS) code search and trade classification platform designed for Sri Lankan exporters, importers, customs brokers, and trade professionals. The platform addresses a critical gap in trade logistics: the difficulty of finding the correct 6-digit HS code for products, particularly when users search using brand names, colloquial terms, or abbreviations that traditional keyword-based search engines cannot resolve.

### 1.2 Problem Statement

The Harmonized System (maintained by the World Customs Organization) classifies over 16,000 commodity codes into a hierarchical structure. Traditional search approaches fail when:
- Users search by brand names (e.g., "Dilmah" instead of "tea")
- Queries contain misspellings or trade abbreviations
- Products span multiple classification levels
- Natural language descriptions do not map directly to official HS nomenclature

### 1.3 Proposed Solution

CeylonHS implements a **hybrid AI search pipeline** combining:
1. **BM25 keyword search** for exact term matching
2. **Semantic vector search** (FAISS / Typesense) for natural language understanding
3. **LLM-powered brand enrichment** (Groq Llama 3.3 / Gemini Flash / Cohere Command-R) for resolving unknown brand names and trade terms
4. **Fuzzy typo correction** (rapidfuzz + pyspellchecker) for handling misspellings

The system is delivered through three client interfaces:
- **Next.js web application** (SEO-optimized, server-side rendered landing page + SPA search)
- **Flutter mobile application** (Android/iOS cross-platform)
- **Shared FastAPI backend** serving both clients

### 1.4 Continuation from CW1

This implementation report builds upon the CW1 design phase, where the team established:
- System requirements and user stories
- Initial architecture diagrams and technology selection
- UI wireframes and mockups
- Project plan and sprint structure

The CW2 phase covers the complete implementation of all designed components, integration testing, deployment to production infrastructure, and the iterative refinements made during development.

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                                   │
│  ┌──────────────────┐           ┌──────────────────────────────┐    │
│  │  Flutter Mobile   │           │   Next.js Web Application    │    │
│  │  (Android / iOS)  │           │   (SSR + CSR Hybrid)         │    │
│  │                   │           │                              │    │
│  │  • Dart/Flutter   │           │  • React 19 + TypeScript     │    │
│  │  • Provider State │           │  • Framer Motion Animations  │    │
│  │  • Google Sign-In │           │  • Tailwind CSS 4            │    │
│  │  • SharedPrefs    │           │  • Three.js Backgrounds      │    │
│  └────────┬──────────┘           └──────────────┬───────────────┘    │
│           │ HTTPS                                │ HTTPS              │
└───────────┼──────────────────────────────────────┼──────────────────┘
            │                                      │
            ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE TIER                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    Nginx Reverse Proxy                      │     │
│  │  • SSL Termination (Let's Encrypt)                         │     │
│  │  • /api/v1/* → FastAPI (port 8000)                         │     │
│  │  • /* → Next.js (port 3000 via PM2)                        │     │
│  └────────────────────┬───────────────────────────────────────┘     │
│                       │                                              │
│  ┌────────────────────▼───────────────────────────────────────┐     │
│  │              FastAPI Backend (Uvicorn, port 8000)           │     │
│  │                                                             │     │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐ │     │
│  │  │  CORS   │→ │ Rate     │→ │ Firebase   │→ │ Route    │ │     │
│  │  │Middleware│  │ Limiter  │  │ Auth       │  │ Handlers │ │     │
│  │  └─────────┘  └──────────┘  └────────────┘  └──────────┘ │     │
│  │                                                             │     │
│  │  ┌──────────────────────────────────────────────────────┐  │     │
│  │  │             SEARCH ENGINE LAYER                       │  │     │
│  │  │                                                       │  │     │
│  │  │  ┌──────────────┐    ┌───────────────────────┐       │  │     │
│  │  │  │ FAISS Backend │◄──►│ Typesense Backend     │       │  │     │
│  │  │  │ (Primary)     │    │ (Alternative)          │       │  │     │
│  │  │  │ IndexFlatIP   │    │ Hybrid BM25 + Vector   │       │  │     │
│  │  │  │ 384-dim       │    │ Auto-Embedding         │       │  │     │
│  │  │  └──────┬────────┘    └───────────┬────────────┘       │  │     │
│  │  │         │      ┌──────────────────┘                    │  │     │
│  │  │         ▼      ▼                                       │  │     │
│  │  │  ┌──────────────────┐                                  │  │     │
│  │  │  │ Search Factory   │ ← ENV: SEARCH_BACKEND           │  │     │
│  │  │  │ (Strategy + Auto │                                  │  │     │
│  │  │  │  Fallback)       │                                  │  │     │
│  │  │  └──────────────────┘                                  │  │     │
│  │  └──────────────────────────────────────────────────────┘  │     │
│  │                                                             │     │
│  │  ┌──────────────────────────────────────────────────────┐  │     │
│  │  │           AI ENRICHMENT LAYER                         │  │     │
│  │  │                                                       │  │     │
│  │  │  Provider Cascade:                                    │  │     │
│  │  │  1. Groq (Llama 3.3 70B) ──►                         │  │     │
│  │  │  2. Gemini Flash 2.0     ──►  Cache (SQLite)          │  │     │
│  │  │  3. Cohere Command-R     ──►                          │  │     │
│  │  └──────────────────────────────────────────────────────┘  │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐      │
│  │  SQLite / PostgreSQL    │  │  Firebase Auth                │      │
│  │  • Users, History       │  │  • Identity Toolkit           │      │
│  │  • Favorites, Synonyms  │  │  • Google OAuth 2.0           │      │
│  │  • Training Pairs       │  │  • Email/Password             │      │
│  │  • Search Logs          │  │  • Password Reset             │      │
│  └─────────────────────────┘  └──────────────────────────────┘      │
│                                                                      │
│  DigitalOcean Droplet — Ubuntu + Systemd + PM2 + Nginx               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow — Search Pipeline

```
User Query ("Dilmah premium")
    │
    ▼
┌──────────────────────┐
│ 1. HS Code Detection │ → If >50% digits → Direct Lookup (exact + prefix match)
└──────────┬───────────┘
           ▼
┌──────────────────────────┐
│ 2. Fuzzy Typo Correction │ → rapidfuzz (domain vocabulary) + pyspellchecker
│    Preserve capitalized  │   "Dilmah" preserved (likely brand name)
│    words (brand names)   │   "premim" → "premium" (corrected)
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ 3. Semantic Search       │ → SentenceTransformer (all-MiniLM-L6-v2)
│    (FAISS IndexFlatIP)   │   Encode query → 384-dim vector
│    Original + Corrected  │   Inner product similarity search
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ 4. Merge & Rank          │ → Sort by relevance_pct (0-100%)
│    Direct > Primary >    │   Top-k results selected
│    Secondary results     │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ 5. Enrichment Trigger    │ → Condition: top_score < 35%
│    (Brand Resolution)    │   OR (35-65% AND <50% query words in descriptions)
│                          │
│    Groq/Gemini/Cohere:   │   "Dilmah" → "Dilmah is a Sri Lankan tea brand.
│    Multi-provider cascade│    Keywords: tea, black tea, Ceylon tea"
│                          │
│    Re-search with        │   Search "tea black tea Ceylon tea" → HS 0902.xx
│    enriched keywords     │   Replace results if improved
│                          │
│    Cache permanently     │   Never call LLM again for "Dilmah"
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ 6. Response Construction │ → Hierarchy paths (parent chain)
│    + Training Logging    │   corrected_query suggestion
│    (async, non-blocking) │   enrichment_info explanation
└──────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Backend Technologies

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Server-side language |
| FastAPI | 0.135.1 | Async web framework with auto-docs |
| Uvicorn | 0.34.0 | ASGI server (production) |
| SQLAlchemy | 2.0.48 | Async ORM with asyncio support |
| aiosqlite | 0.22.1 | Async SQLite driver (development) |
| asyncpg | 0.31.0 | Async PostgreSQL driver (production) |
| Alembic | 1.18.4 | Database migration tool |
| Firebase Admin | 7.2.0 | Server-side authentication verification |
| FAISS-CPU | 1.13.2 | Vector similarity search index |
| Sentence-Transformers | 3.2.1 | Text embedding models (all-MiniLM-L6-v2) |
| PyTorch | 2.10.0 | ML framework (embedding inference) |
| rapidfuzz | 3.14.3 | Fuzzy string matching for typo correction |
| pyspellchecker | 0.8.4 | Spell checking with domain vocabulary |
| Groq SDK | 1.0.0 | LLM provider (Llama 3.3 70B) |
| google-generativeai | 0.8.6 | LLM provider (Gemini Flash 2.0) |
| Cohere SDK | 5.20.7 | LLM provider (Command-R) |
| Typesense | 2.0.0 | Alternative hybrid search backend |
| SlowAPI | 0.1.9 | Rate limiting middleware |
| Pandas | 3.0.1 | Dataset processing |
| httpx | 0.28.1 | Async HTTP client |

### 3.2 Flutter Mobile Technologies

| Technology | Version | Purpose |
|---|---|---|
| Flutter SDK | Latest Stable | Cross-platform mobile framework |
| Dart | ^3.11.0 | Programming language |
| http | ^1.2.0 | HTTP client for REST API communication |
| provider | ^6.1.0 | Reactive state management |
| google_sign_in | ^6.2.1 | Google OAuth 2.0 authentication |
| shared_preferences | ^2.3.0 | Local key-value storage |
| cupertino_icons | ^1.0.8 | iOS-style icons |

### 3.3 Next.js Web Technologies

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | React SSR/SSG framework |
| React | 19.2.4 | UI component library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Framer Motion | 12.34.3 | Animation library |
| Three.js | 0.183.2 | 3D graphics (login page particles) |
| Firebase | 12.10.0 | Client-side authentication |
| Axios | 1.13.6 | HTTP client |
| @emailjs/browser | 4.4.1 | Contact form email delivery |
| Vitest | 2.1.9 | Unit testing framework |
| @testing-library/react | 16.3.2 | React component testing |

### 3.4 DevOps & Infrastructure

| Technology | Purpose |
|---|---|
| DigitalOcean Droplet | Production server (Ubuntu) |
| Nginx | Reverse proxy, SSL termination, static serving |
| PM2 | Next.js process manager (auto-restart) |
| Systemd | FastAPI backend service management |
| GitHub Actions | CI/CD pipeline (automated testing + deployment) |
| Docker / Docker Compose | Containerized deployment option |
| Let's Encrypt | SSL certificate (HTTPS) |
| Firebase | Authentication provider |
| Dependabot | Automated dependency updates |

---

## 4. Backend Implementation

### 4.1 Application Structure & Entry Point

The backend follows a modular structure adhering to Clean Architecture principles:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI app factory + lifespan
│   ├── core/
│   │   ├── config.py                    # Pydantic Settings (env-driven config)
│   │   ├── auth.py                      # Firebase auth middleware
│   │   ├── database.py                  # Async SQLAlchemy engine + session
│   │   └── limiter.py                   # Rate limiter singleton
│   ├── models/
│   │   ├── user.py                      # User, SearchHistory, Favorite ORM
│   │   ├── categories.py               # FeaturedCategory ORM
│   │   └── schemas.py                  # Pydantic request/response schemas
│   ├── api/
│   │   └── routes/
│   │       ├── search.py               # Public search endpoints
│   │       ├── users.py                # User profile, history, favorites
│   │       ├── admin.py                # Admin stats, trends, dataset upload
│   │       ├── categories.py           # Featured categories CRUD
│   │       ├── pricing.py              # Subscription management
│   │       ├── chat.py                 # AI chatbot endpoint
│   │       ├── synonyms.py            # Enrichment cache admin
│   │       ├── training.py            # Training data and feedback
│   │       └── datasets.py            # Dataset upload, embedding, activation
│   └── services/
│       ├── search_base.py             # Abstract search interface (ABC)
│       ├── search_factory.py          # Backend selection + auto-fallback
│       ├── faiss_search_service.py    # FAISS vector search implementation
│       ├── typesense_search_service.py # Typesense hybrid search
│       ├── enrichment_service.py      # LLM brand/term resolution
│       └── training_collector.py      # Search logging + training pairs
├── data/
│   ├── knowledge_base.txt             # Chatbot context knowledge
│   ├── chroma_db/                     # FAISS index + metadata files
│   └── datasets/                      # Uploaded CSV datasets
├── scripts/
│   ├── embed_dataset.py               # One-time FAISS index builder
│   ├── index_typesense.py             # Typesense collection indexer
│   ├── finetune_embeddings.py         # Embedding model fine-tuning
│   ├── seed_categories.py            # Initial category seeding
│   ├── grant_admin.py                # Admin role elevation
│   └── warm_cache.py                 # Pre-populate enrichment cache
├── tests/
│   ├── conftest.py                    # Test fixtures and mocks
│   ├── test_search.py                # Search endpoint tests
│   └── test_admin.py                 # Admin endpoint tests
├── alembic/                           # Database migrations
├── requirements.txt                   # Python dependencies
├── Dockerfile                         # Container build config
└── alembic.ini                        # Migration configuration
```

#### 4.1.1 Application Initialization (`main.py`)

The FastAPI application is initialized using an **async context manager (lifespan)** pattern, which ensures proper startup and shutdown sequencing:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    1. Initialize search service via search_factory.create_search_service()
    2. Create all ORM tables via Base.metadata.create_all()
    3. Run ensure_schema_compatibility() for database backfills
    4. Log environment warnings (dev mode on non-localhost)
    yield
    # SHUTDOWN
    # Cleanup resources
```

**Middleware Stack (applied in order):**
1. **CORSMiddleware** — Configurable origins list from environment variable
2. **SlowAPIMiddleware** — Token-bucket rate limiting per IP
3. **Custom 429 Handler** — Returns JSON error on rate limit exceeded

**Mounted Route Groups:**
- `/api/v1/search` — Public search endpoints
- `/api/v1/users` — Authenticated user management
- `/api/v1/admin` — Admin-only analytics and management
- `/api/v1/pricing` — Subscription plan management
- `/api/v1/categories` — Featured categories
- `/api/v1/chat` — AI chatbot
- `/api/v1/admin/synonyms` — Enrichment cache management
- `/api/v1/admin/training` — Training data and feedback loop
- `/api/v1/admin/datasets` — Dataset management
- `/health` — Health check (no rate limit)
- `/api` — Service info

### 4.2 Core Infrastructure

#### 4.2.1 Configuration Management (`config.py`)

All configuration is managed through **Pydantic BaseSettings**, enabling environment-variable-driven configuration with type validation, defaults, and parsed properties.

**Key Configuration Groups:**

| Group | Variables | Purpose |
|---|---|---|
| **Environment** | `env` (production/development), `host`, `port` | Runtime mode and binding |
| **Database** | `database_url` (async), `database_url_sync` | SQLite (dev) / PostgreSQL (prod) |
| **Search** | `search_backend`, `embedding_model`, `dataset_csv_path` | Search engine selection |
| **Enrichment** | `groq_api_key`, `gemini_api_key`, `cohere_api_key`, `enrichment_confidence_threshold` | LLM provider configuration |
| **Rate Limiting** | `rate_limit_search` (30/min), `rate_limit_default` (60/min) | API abuse prevention |
| **Firebase** | `firebase_project_id`, `firebase_credentials_path` | Authentication configuration |
| **CORS** | `cors_origins` (JSON list) | Cross-origin security |

**Security-First Defaults:**
- `env` defaults to `"production"` — developers must explicitly opt-in to dev mode
- `host` defaults to `"127.0.0.1"` — prevents accidental exposure to network
- Dev-mode auth bypass (`dev-token-*`) only works when `ENV=development`

#### 4.2.2 Database Layer (`database.py`)

The database layer uses **async SQLAlchemy 2.0** with dialect-aware configuration:

**SQLite (Development):**
```python
engine = create_async_engine(
    "sqlite+aiosqlite:///./data/hscode.db",
    connect_args={"check_same_thread": False}
)
# WAL mode, foreign keys, 30s busy timeout, NORMAL synchronous
```

**PostgreSQL (Production):**
```python
engine = create_async_engine(
    "postgresql+asyncpg://user:pass@host:5432/db",
    pool_size=10, max_overflow=20
)
```

**Schema Compatibility:**
The `ensure_schema_compatibility()` function performs runtime schema migration by inspecting existing columns and executing `ALTER TABLE` statements via dialect-specific SQL. This ensures older database instances are safely upgraded without data loss.

**Session Dependency:**
```python
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

#### 4.2.3 Authentication Middleware (`auth.py`)

Firebase Authentication is implemented as a series of composable FastAPI dependencies:

| Dependency | Level | Behavior |
|---|---|---|
| `verify_firebase_token` | Optional | Extracts Bearer token, verifies via Firebase Admin SDK. Returns decoded JWT dict or None. Supports dev-token bypass in development mode. |
| `require_auth` | Required | Depends on verify_firebase_token. Raises 401 if token is None. |
| `require_admin` | Admin | Depends on require_auth. Queries User table to verify `role == "admin"`. Raises 403 if not admin. |
| `get_current_user` | User Object | Depends on require_auth. Returns full User ORM object (detached from session with `session.expunge()`). |

**Firebase Initialization (Lazy):**
- Tries service account JSON file first (`firebase-service-account.json`)
- Falls back to `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Logs warnings on failure
- Initialized once per process lifetime

#### 4.2.4 Rate Limiting (`limiter.py`)

Rate limiting uses the **SlowAPI** library (based on Flask-Limiter) with token-bucket algorithm:

- **Search endpoints:** 30 requests/minute per IP
- **Default endpoints:** 60 requests/minute per IP
- **Health check:** Exempt from rate limiting

### 4.3 Database Design & ORM Models

#### 4.3.1 Entity-Relationship Diagram

```
┌──────────────────────────┐
│         users             │
├──────────────────────────┤
│ id: UUID (PK)            │
│ firebase_uid: String (UQ)│──── Firebase Auth UID
│ email: String            │
│ display_name: String?    │
│ photo_url: String?       │
│ role: Enum(user|admin)   │
│ subscription_tier: Enum  │ ── starter | business | enterprise
│ subscription_start_date  │
│ subscription_end_date    │
│ is_subscription_active   │
│ created_at: DateTime     │
│ updated_at: DateTime     │
└──────┬──────────┬────────┘
       │          │
       │ 1:N      │ 1:N
       ▼          ▼
┌──────────────┐ ┌────────────────┐
│search_history│ │   favorites    │
├──────────────┤ ├────────────────┤
│ id: UUID     │ │ id: UUID       │
│ user_id (FK) │ │ user_id (FK)   │
│ query_text   │ │ hscode         │
│ top_result_  │ │ description?   │
│   hscode     │ │ section?       │
│ top_result_  │ │ created_at     │
│   description│ ├────────────────┤
│ results_count│ │ UQ(user_id,    │
│ created_at   │ │    hscode)     │
├──────────────┤ └────────────────┘
│ IX(user_id,  │
│    created_at│
└──────────────┘

┌─────────────────────────┐   ┌──────────────────────────┐
│  featured_categories    │   │      synonym_cache       │
├─────────────────────────┤   ├──────────────────────────┤
│ id: UUID (PK)           │   │ id: Integer (PK)         │
│ name: String (UQ)       │   │ source_term: String      │
│ description: String?    │   │ resolved_keywords: String│
│ icon_code_point: String │   │ explanation: String?     │
│ order: Integer          │   │ confidence: Float        │
│ is_active: Boolean      │   │ provider: String         │
│ created_at: DateTime    │   │ created_at: DateTime     │
│ updated_at: DateTime    │   └──────────────────────────┘
└─────────────────────────┘

┌──────────────────────────┐   ┌──────────────────────────┐
│       search_log         │   │     training_pairs       │
├──────────────────────────┤   ├──────────────────────────┤
│ id: Integer (PK)         │   │ id: Integer (PK)         │
│ query: String            │   │ query: String            │
│ corrected_query: String? │   │ positive_description: Str│
│ enrichment_used: Boolean │   │ positive_hscode: String  │
│ enrichment_keywords: Str?│   │ source: Enum             │
│ top_hscode: String?      │   │  enrichment|high_conf    │
│ top_description: String? │   │  |manual                 │
│ top_score: Float?        │   │ quality_score: Float     │
│ result_count: Integer    │   │ approved: Boolean        │
│ created_at: DateTime     │   │ created_at: DateTime     │
└──────────────────────────┘   ├──────────────────────────┤
                                │ UQ(query,               │
                                │  positive_description)  │
                                └──────────────────────────┘
```

#### 4.3.2 Pydantic Schemas

All request/response contracts are defined as Pydantic models in `schemas.py`, providing:
- **Input validation** — Automatic type coercion and constraint checking (e.g., query length 1-500 chars, limit 1-50)
- **Output serialization** — Consistent JSON structure with camelCase field aliases
- **OpenAPI documentation** — Auto-generated Swagger/ReDoc documentation
- **Type safety** — IDE autocompletion and compile-time checks

Key schemas include: `SearchResponse`, `HSCodeDetail`, `UserResponse`, `TrendResponse`, `PricingPlansListResponse`, `FeaturedCategoryResponse`, and training/dataset schemas.

### 4.4 API Endpoints

The backend exposes **31 REST endpoints** across 9 route groups:

#### 4.4.1 Search Endpoints (Public, Rate-Limited)

| Method | Path | Rate Limit | Description |
|---|---|---|---|
| `GET` | `/api/v1/search?q=&limit=` | 30/min | Main hybrid search (typo correction + enrichment + semantic) |
| `GET` | `/api/v1/hs/{hscode}` | 30/min | Detailed HS code view with hierarchy and children |
| `GET` | `/api/v1/categories` | 30/min | List all tariff sections with chapters |

The search endpoint implements the complete 7-stage pipeline (HS code detection → fuzzy correction → semantic search → merge & rank → enrichment trigger → hierarchy paths → training logging).

#### 4.4.2 User Endpoints (Authenticated)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/users/sync` | Create/update user profile from Firebase |
| `GET` | `/api/v1/users/me` | Get current user profile (auto-creates if missing) |
| `GET` | `/api/v1/users/me/history` | Paginated search history |
| `POST` | `/api/v1/users/me/history` | Record search event |
| `DELETE` | `/api/v1/users/me/history` | Clear all search history |
| `GET` | `/api/v1/users/me/favorites` | Paginated favorites list |
| `POST` | `/api/v1/users/me/favorites` | Add HS code to favorites (409 on duplicate) |
| `DELETE` | `/api/v1/users/me/favorites/{hscode}` | Remove from favorites |

**UID Impersonation Prevention:** The `/users/sync` endpoint validates that the `firebase_uid` in the request body matches the UID from the authenticated token, preventing users from creating profiles under other users' UIDs.

#### 4.4.3 Admin Endpoints (Admin Role Required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/admin/stats` | Platform statistics (users, searches, today's count) |
| `GET` | `/api/v1/admin/trends` | Trending search queries with period filtering |
| `GET` | `/api/v1/admin/synonyms` | List all enrichment cache entries |
| `POST` | `/api/v1/admin/synonyms` | Manually add brand→keyword mapping |
| `DELETE` | `/api/v1/admin/synonyms/{id}` | Remove synonym |
| `GET` | `/api/v1/admin/datasets` | List uploaded datasets |
| `GET` | `/api/v1/admin/datasets/active` | Active dataset with vector count |
| `POST` | `/api/v1/admin/datasets/upload` | Upload CSV dataset |
| `POST` | `/api/v1/admin/datasets/{id}/activate` | Start background embedding job |
| `GET` | `/api/v1/admin/datasets/status` | Polling endpoint for embedding progress |
| `DELETE` | `/api/v1/admin/datasets/{id}` | Delete inactive dataset |

**Admin Trend Query:** Uses dialect-specific SQL — different `datetime` functions for SQLite vs PostgreSQL — to group queries by `LOWER(TRIM(query_text))` and count occurrences within a configurable time window.

#### 4.4.4 Pricing & Subscription Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/pricing/plans` | Public | List all pricing tiers (Starter $3, Business $5, Enterprise $9) |
| `GET` | `/api/v1/pricing/subscription/{user_id}` | Owner/Admin | Get user's current subscription |
| `POST` | `/api/v1/pricing/subscription/{user_id}/upgrade` | Owner/Admin | Upgrade subscription tier |
| `POST` | `/api/v1/pricing/subscription/{user_id}/downgrade` | Owner/Admin | Downgrade subscription tier |

**Authorization:** Subscription endpoints enforce **ownership checks** — only the user themselves or an admin can view/modify subscriptions. This prevents horizontal privilege escalation.

#### 4.4.5 Chat Endpoint (Public, Rate-Limited)

| Method | Path | Rate Limit | Description |
|---|---|---|---|
| `POST` | `/api/v1/chat` | 60/min | AI chatbot (Groq Llama 3.3) for UI/usage questions |

The chatbot is specifically instructed via system prompt to **not** perform HS code searches. It redirects users to the search page for classification queries, answering only questions about how to use the CeylonHS platform. A knowledge base file (`data/knowledge_base.txt`) provides context about CeylonHS features.

#### 4.4.6 Training Data Endpoints (Admin)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/admin/training/stats` | Training data statistics |
| `GET` | `/api/v1/admin/training/pairs` | List training pairs (filterable by source, quality, approval) |
| `POST` | `/api/v1/admin/training/pairs` | Manually create training pair |
| `PATCH` | `/api/v1/admin/training/pairs/{id}` | Approve/reject pair |
| `DELETE` | `/api/v1/admin/training/pairs/{id}` | Delete training pair |
| `GET` | `/api/v1/admin/training/logs` | Raw search logs with filters |
| `GET/PUT` | `/api/v1/admin/training/feedback` | Toggle search logging on/off |
| `POST` | `/api/v1/admin/training/export` | Export pairs as JSON for fine-tuning |

### 4.5 Search Engine Architecture

#### 4.5.1 Abstract Interface (Strategy Pattern)

The search engine follows the **Strategy Pattern** via an abstract base class:

```python
class BaseSearchService(ABC):
    def initialize(self) → None
    def search(query: str, top_k: int = 10) → dict
    def get_hs_code_detail(hscode: str) → dict | None
    def get_categories() → list[dict]
    @property
    def is_initialized(self) → bool
```

Two concrete implementations exist:
1. **FaissSearchService** — Primary backend using FAISS vector similarity
2. **TypesenseSearchService** — Alternative backend with native hybrid search

#### 4.5.2 Factory Pattern with Auto-Fallback

```python
def create_search_service() → BaseSearchService:
    if settings.search_backend == "typesense":
        try:
            service = TypesenseSearchService()
            service.initialize()
            return service
        except Exception:
            logger.warning("Typesense failed, falling back to FAISS")
    
    service = FaissSearchService()
    service.initialize()
    return service
```

This ensures **zero downtime** — if Typesense is unavailable, the system automatically falls back to FAISS without user intervention.

#### 4.5.3 FAISS Search Implementation

**Index Structure:**
- **Type:** `IndexFlatIP` (Inner Product similarity, equivalent to cosine similarity on normalized vectors)
- **Dimension:** 384 (from `all-MiniLM-L6-v2` embedding model)
- **Dataset:** ~16,000+ HS codes with enriched descriptions
- **Files:**
  - `hs_codes.index` — FAISS binary index
  - `hs_codes_metadata.json` — HS code metadata (hscode, description, section, parent, level)
  - `hs_codes_descriptions.json` — Raw descriptions for vocabulary building

**Initialization Pipeline:**
1. Load FAISS index from disk
2. Load metadata and descriptions JSON
3. Build domain vocabulary from descriptions (3+ char words, excluding stopwords)
4. Initialize spell checker with boosted HS vocabulary
5. Build `hscode_to_idx` and `hscode_meta` lookup dictionaries
6. Load SentenceTransformer embedding model (CPU)
7. Initialize enrichment service (if API keys configured)
8. Initialize training data collector

**Fuzzy Correction Algorithm (Two-Tier):**

```
Input: "premim tee"

Tier 1: rapidfuzz (Domain Vocabulary Match)
  - Match each word against HS description vocabulary
  - score_cutoff=70 (only accept strong matches)
  - "premim" → "premium" (match score 85)
  - "tee" → "tea" (match score 80)

Tier 2: pyspellchecker (General Spell Check)
  - Fallback for words not matched by rapidfuzz
  - Boosted with domain vocabulary

Special Rules:
  - Skip capitalized words (likely brand names)
  - Skip words <3 characters
  - Preserve original if correction score is too low

Output: "premium tea" (corrected_query)
```

**Semantic Search:**
```python
def _semantic_search(query: str, top_k: int):
    embedding = model.encode(query, normalize_embeddings=True)
    scores, indices = faiss_index.search(embedding.reshape(1, -1), top_k)
    # Convert raw inner-product scores to 0-100% relevance
    results = [(idx, score * 100) for idx, score in zip(indices[0], scores[0])]
    return results
```

**Hierarchy Path Construction:**
```python
def _get_hierarchy_path(hscode: str) → list[str]:
    path = []
    current = hscode
    while current:
        meta = _hscode_meta.get(current)
        if meta:
            path.insert(0, f"{current}: {meta['description']}")
            current = meta.get('parent')
        else:
            break
    return path
```

**Hot-Reload Capability:**
The FAISS service supports runtime reload via `reload()`, called after an admin uploads and activates a new dataset. This avoids server restarts for dataset updates.

#### 4.5.4 Typesense Hybrid Search

Typesense provides a modern alternative with **built-in hybrid search** (BM25 + vector):

**Collection Schema:**
```json
{
  "name": "hs_codes",
  "fields": [
    {"name": "hscode", "type": "string", "facet": true},
    {"name": "description", "type": "string"},
    {"name": "section", "type": "string", "facet": true},
    {"name": "level", "type": "int32", "facet": true},
    {"name": "parent", "type": "string", "optional": true},
    {"name": "embedding", "type": "float[]",
     "embed": {"from": ["description"],
               "model_config": {"model_name": "ts/all-MiniLM-L12-v2"}}}
  ]
}
```

**Search Configuration:**
- `query_by: "description,embedding"` — Hybrid search across text and vectors
- `num_typos: 1` — Conservative typo tolerance (prevents brand name mangling)
- `drop_tokens_threshold: 0` — Never drop query tokens (preserves search intent)
- Auto-synonym creation from enrichment results (future queries benefit)

### 4.6 AI Enrichment Pipeline

The enrichment pipeline resolves unknown terms (brand names, abbreviations, trade jargon) into HS-relevant keywords using a **multi-provider LLM cascade**.

#### 4.6.1 Trigger Conditions

Enrichment is triggered when search results indicate poor keyword-level understanding:

```
Condition 1: top_score < 35%
  → Semantic search found almost nothing relevant

Condition 2: 35% < top_score < 65% AND
  query_word_coverage < 50%
  → Moderate results but query terms don't appear in descriptions
  → Likely a brand name or abbreviation
```

#### 4.6.2 Multi-Provider Cascade

```
Request: "What is Dilmah?"

Provider 1: Groq (Llama 3.3 70B Versatile)
  ├── Response: {"explanation": "Dilmah is a Sri Lankan tea brand",
  │              "keywords": "tea, black tea, Ceylon tea",
  │              "confidence": 0.95}
  └── On failure (rate limit / timeout) → Try Provider 2

Provider 2: Google Gemini Flash 2.0
  ├── Same request with JSON response format
  └── On failure → Try Provider 3

Provider 3: Cohere Command-R
  ├── Same request with JSON response format
  └── On failure → Return None (all exhausted)
```

**Free Tier Limits:** Groq (30 RPM), Gemini (15 RPM), Cohere (20 RPM). The cascade maximizes availability by distributing across three free tiers.

#### 4.6.3 Permanent Caching

```
Cache Architecture:
  ┌─────────────────────┐      ┌────────────────────┐
  │ In-Memory Dict      │ ←──→ │ SQLite synonym_cache│
  │ (O(1) lookup)       │      │ (Persistent)       │
  └─────────────────────┘      └────────────────────┘

On startup: Load all DB entries → memory
On new enrichment: Write to DB → Update memory
On admin add/delete: Update both → Typesense synonym (if Typesense backend)

Result: Each unknown term triggers exactly ONE LLM call in its lifetime.
```

### 4.7 Training Data Collection & Feedback Loop

The training collector implements a **continuous learning feedback loop**:

```
Search Query → Log to search_log table
                    │
                    ├─ If enrichment was used AND top_score > 50%:
                    │    → Auto-generate training pair (source: "enrichment")
                    │    → quality_score = top_score / 100
                    │
                    ├─ If NO enrichment AND top_score > 80%:
                    │    → Auto-generate training pair (source: "high_confidence")
                    │
                    └─ Admin can manually create pairs (source: "manual")

Training Pairs → Export as JSON → Fine-tune embedding model
                  (scripts/finetune_embeddings.py)
```

**Deduplication & Filtering:**
- Queries <3 characters are skipped
- Single-word queries are skipped
- Same query within 30 minutes is deduplicated
- Queries matching skip-list patterns are excluded

### 4.8 AI Chatbot Integration

The chatbot uses **Groq's Llama 3.3 70B** model with a carefully scoped system prompt:

**Design Principles:**
1. The chatbot is NOT a search engine — it redirects HS code queries to the search page
2. It answers questions about CeylonHS features, navigation, and usage
3. A knowledge base file provides factual context about the platform
4. Graceful error handling returns friendly fallback messages

**Implementation:**
```python
@router.post("/api/v1/chat")
async def chat(request: ChatRequest):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + knowledge_base},
        {"role": "user", "content": request.message}
    ]
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages
    )
    return {"reply": response.choices[0].message.content}
```

---

## 5. Flutter Mobile Application

### 5.1 Application Structure & Navigation

```
flutter_application_1/lib/
├── main.dart                        # App entry, auth pages, main navigation hub
├── config.dart                      # API URL, constants, app configuration
├── models/
│   ├── user_model.dart              # UserProfile, SearchHistory, Favorites, Trends
│   ├── search_result.dart           # HsCodeResult, SearchResponse, HsCodeDetail
│   ├── category_model.dart          # FeaturedCategory, defaults
│   └── pricing_model.dart           # PricingTier, PricingPlan, UserSubscription
├── services/
│   ├── auth_service.dart            # Firebase auth (Singleton, ChangeNotifier)
│   ├── api_service.dart             # REST API client (all endpoints)
│   ├── search_history_service.dart  # Local SharedPreferences storage
│   ├── favorites_service.dart       # Server-synced favorites (ChangeNotifier)
│   ├── categories_service.dart      # Featured categories client
│   └── pricing_service.dart         # Subscription management
└── screens/
    ├── search_page.dart             # Live search with debouncing
    ├── hs_code_detail_page.dart     # Detailed HS code view
    ├── favorites_page.dart          # Saved HS codes
    ├── history_page.dart            # Server-side search history
    ├── recents_page.dart            # Combined local + server history
    ├── pricing_page.dart            # Subscription plans
    └── admin_dashboard.dart         # Admin analytics
```

#### 5.1.1 Navigation Architecture

The app uses a **bottom tab navigation** pattern with 5 primary tabs:

```
IntroPage (Splash/Welcome)
  ├── Sign In → SignUpPage → MainHomePage
  └── Log In  → LoginPage  → MainHomePage

MainHomePage (Tab Controller)
  ├── Tab 0: Home (_HomeContent)
  │     ├── Quick search bar
  │     ├── Action cards (Favorites, Tariff Docs, News)
  │     ├── Recent searches carousel (horizontal scroll, max 5)
  │     └── Featured categories grid (2 columns)
  ├── Tab 1: Search (SearchPage)
  │     ├── Live search with 500ms debounce
  │     ├── Typo correction suggestions
  │     ├── AI enrichment context
  │     └── Result cards with relevance badges
  ├── Tab 2: Recents (RecentsPage)
  │     ├── Local recent searches (SharedPreferences)
  │     ├── Server search history (API)
  │     └── Filter bar
  ├── Tab 3: Pricing (PricingPage)
  │     ├── Three-tier pricing cards
  │     ├── Feature comparison
  │     └── FAQ section
  └── Tab 4: Profile (_ProfileContent)
        ├── User avatar, name, email, admin badge
        ├── Favorites → FavoritesPage
        ├── Search History → HistoryPage
        ├── Admin Dashboard → AdminDashboardPage (admin only)
        └── Logout
```

#### 5.1.2 Configuration (`config.dart`)

```dart
class AppConfig {
  static String get apiBaseUrl {
    // Build-time configurable via --dart-define
    // Default: https://ceylonhs.com
    // Android emulator: http://10.0.2.2:8000
    // Local dev: http://127.0.0.1:8000
  }
  
  static const int defaultSearchLimit = 10;
  static const int searchDebounceMs = 500;
  static const int maxRecentSearches = 20;
}
```

### 5.2 Data Models

#### 5.2.1 User Models (`user_model.dart`)

| Model | Fields | Purpose |
|---|---|---|
| `UserProfile` | id, firebaseUid, email, displayName, photoUrl, role, createdAt | Authenticated user profile |
| `SearchHistoryItem` | id, queryText, topResultHscode, topResultDescription, resultsCount, createdAt | Server-side search history entry |
| `SearchHistoryResponse` | total, items[] | Paginated history wrapper |
| `FavoriteItem` | id, hscode, description, section, createdAt | Favorited HS code |
| `FavoriteListResponse` | total, items[] | Paginated favorites wrapper |
| `TrendItem` | queryText, searchCount, lastSearched | Admin trending searches |
| `PlatformStats` | totalUsers, totalSearches, searchesToday | Admin platform statistics |

All models use **factory constructors** (`fromJson`) for JSON deserialization and provide a `getter` `isAdmin` on `UserProfile` for role-based UI gating.

#### 5.2.2 Search Models (`search_result.dart`)

| Model | Fields | Purpose |
|---|---|---|
| `HsCodeResult` | hscode, description, section, level, parent, relevancePct, hierarchyPath | Single search result |
| `SearchResponse` | query, correctedQuery, enrichmentInfo, totalResults, results[] | Complete search response |
| `HsCodeDetail` | hscode, description, section, level, parent, children[], hierarchyPath | Detailed HS code view |
| `HsCodeChild` | hscode, description, level | Child code in hierarchy |
| `CategorySection` | section, chapters[] | Tariff section grouping |

#### 5.2.3 Pricing Models (`pricing_model.dart`)

```dart
enum PricingTier { starter, business, enterprise }

extension PricingTierX on PricingTier {
  String get displayName;    // "Starter", "Business", "Enterprise"
  double get price;          // $3, $5, $9
  bool get isPopular;        // true for Business
  List<String> get features; // Feature list per tier
}
```

### 5.3 Service Layer

#### 5.3.1 Authentication Service (`auth_service.dart`)

**Pattern:** Singleton with ChangeNotifier (reactive state management)

**State:**
- `_user: UserProfile?` — Current logged-in user
- `_token: String?` — Firebase ID token (or dev token in local development)
- `_isLoading: bool` — Auth operation in progress
- `_lastErrorMessage: String?` — Last auth error for UI display

**Authentication Flows:**

```
Email/Password Sign-Up:
  1. Validate inputs (name, email, password)
  2. Call Firebase Identity Toolkit signUp endpoint
  3. Extract ID token from response
  4. Call backend POST /api/v1/users/sync (create profile)
  5. Update AuthService state → notifyListeners()
  6. Navigate to MainHomePage

Google Sign-In:
  1. Trigger google_sign_in plugin (OAuth consent screen)
  2. Get Google access token + ID token
  3. Exchange with Firebase signInWithIdp endpoint
  4. Get Firebase ID token
  5. Sync with backend
  6. Navigate to MainHomePage

Password Reset:
  1. Call Firebase sendOobCode with requestType: PASSWORD_RESET
  2. Firebase sends reset email to user
  3. Show confirmation snackbar

Dev Token Mode:
  - If API URL points to localhost/10.0.2.2:
    token = "dev-token-{uid}" (bypasses Firebase verification)
```

**Firebase REST API:** Rather than using the Firebase Flutter SDK directly, the service calls Firebase Identity Toolkit REST endpoints (`identitytoolkit.googleapis.com`) via HTTP, enabling more control over error handling and dev-mode bypass.

#### 5.3.2 API Service (`api_service.dart`)

Centralized HTTP client for all backend communication:

| Method | Endpoint | Timeout | Auth |
|---|---|---|---|
| `search(query, limit)` | `GET /api/v1/search` | 30s | No |
| `getHsCodeDetail(hscode)` | `GET /api/v1/hs/{hscode}` | 15s | No |
| `getCategories()` | `GET /api/v1/categories` | 15s | No |
| `healthCheck()` | `GET /api` | 5s | No |
| `recordSearch(...)` | `POST /api/v1/users/me/history` | 5s | Yes |
| `getSearchHistory(page, size)` | `GET /api/v1/users/me/history` | 10s | Yes |
| `clearSearchHistory()` | `DELETE /api/v1/users/me/history` | — | Yes |
| `getFavorites(page, size)` | `GET /api/v1/users/me/favorites` | — | Yes |
| `addFavorite(hscode, desc, section)` | `POST /api/v1/users/me/favorites` | — | Yes |
| `removeFavorite(hscode)` | `DELETE /api/v1/users/me/favorites/{hscode}` | — | Yes |
| `getSearchTrends(days, limit)` | `GET /api/v1/admin/trends` | — | Admin |
| `getPlatformStats()` | `GET /api/v1/admin/stats` | — | Admin |

**Design:** Constructor injection for `baseUrl` and `http.Client` enables testing with mock HTTP clients.

#### 5.3.3 Favorites Service (`favorites_service.dart`)

**Pattern:** Singleton + ChangeNotifier (Provider-compatible reactive state)

**Dual-Cache Architecture:**
```
_favoriteHscodes: Set<String>     ← O(1) lookup for isFavorited()
_favorites: List<FavoriteItem>    ← Full data for display in FavoritesPage

Server Sync:
  initialize() → If logged in, call syncFavorites()
  syncFavorites() → GET /favorites?page_size=200 → populate both caches
  addFavorite() → POST /favorites → optimistic update to local caches
  removeFavorite() → DELETE /favorites/{hscode} → optimistic update
  clearCache() → Called on logout
```

**Optimistic Updates:** The service updates local state immediately before the API response, then reverts on failure. This provides instant visual feedback while maintaining server-side consistency.

#### 5.3.4 Local Search History (`search_history_service.dart`)

Uses `SharedPreferences` for **device-local** recent search storage:
- Maximum 20 recent searches
- Deduplication (moving repeated searches to top)
- Independent from server-side history (complementary)

#### 5.3.5 Categories Service (`categories_service.dart`)

Fetches featured categories from the backend with **graceful fallback** to hardcoded defaults:

```dart
static const Map<String, Map<String, dynamic>> defaultFeaturedCategories = {
  'Spices': {'iconCodePoint': '0xf0e6', 'description': '...'},
  'Apparel': {'iconCodePoint': '0xe32d', 'description': '...'},
  'Stationery': {'iconCodePoint': '0xe3f2', 'description': '...'},
  'Minerals': {'iconCodePoint': '0xe567', 'description': '...'},
  'Animal Products': {'iconCodePoint': '0xe91d', 'description': '...'},
  'Cosmetics': {'iconCodePoint': '0xea2d', 'description': '...'},
};
```

#### 5.3.6 Pricing Service (`pricing_service.dart`)

Manages subscription tier operations with fallbacks:
- `getAllPricingPlans()` — Fetches from API, falls back to hardcoded plans
- `getUserSubscription()` — Returns free tier on failure
- `upgradeSubscription()` — No fallback (throws on failure)
- Feature gating: `isUserOnTier()` checks if user meets minimum tier requirement

### 5.4 Screens & User Interface

#### 5.4.1 Search Page (`search_page.dart`)

The core user-facing feature implementing **live search with debouncing**:

```
User types "Dilmah"
    │
    ├─ After 500ms silence (debounce timer)
    │
    ├─ Call ApiService.search("Dilmah", limit: 10)
    │
    ├─ Display results with:
    │   ├─ Typo correction: "Did you mean {corrected}?" (clickable)
    │   ├─ AI enrichment: "AI-Powered Result" banner with explanation
    │   └─ Result cards:
    │       ├─ HS code (monospace, large font)
    │       ├─ Relevance badge (color-coded):
    │       │   ├─ Green (≥50%): High confidence ✓
    │       │   ├─ Yellow (30-50%): Moderate !
    │       │   └─ Gray (<30%): Low confidence ?
    │       ├─ Confidence bar (horizontal progress indicator)
    │       ├─ Parent breadcrumb (truncated hierarchy)
    │       ├─ Description text
    │       └─ Heart icon (favorite toggle, requires login)
    │
    └─ Record search to server history (fire-and-forget)
       + local SharedPreferences
```

**Empty State:** Displays quick-search chips ("laptop", "rice", "Premio") and recent searches with delete buttons.

#### 5.4.2 HS Code Detail Page (`hs_code_detail_page.dart`)

```
┌─────────────────────────────────────┐
│ AppBar: "HS 0902.10.10"    [♥]     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ HS CODE                      │   │
│  │ 0902.10.10                  │   │
│  │                              │   │
│  │ Green tea, not fermented,    │   │
│  │ in immediate packings of     │   │
│  │ a content not exceeding 3 kg │   │
│  │                              │   │
│  │ Section II  Level 6  Parent: │   │
│  │                   0902.10   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Classification Hierarchy           │
│  1. Section II: Vegetable Products  │
│  2. Chapter 09: Coffee, Tea, Mate  │
│  3. 0902: Tea                       │
│  4. 0902.10: Green tea              │
│  5. ▶ 0902.10.10: In packings      │
│                       ≤3 kg         │
│                                     │
│  Sub-classifications                │
│  ┌──────────────────────────────┐  │
│  │ 0902.10.10.10               ▶│  │
│  │ Organic green tea leaves      │  │
│  ├──────────────────────────────┤  │
│  │ 0902.10.10.20               ▶│  │
│  │ Green tea in tea bags         │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Recursive Navigation:** Tapping a child code navigates to `HsCodeDetailPage(hscode: child.hscode)`, enabling infinite depth exploration of the HS hierarchy.

#### 5.4.3 Favorites Page (`favorites_page.dart`)

- Authentication-aware: shows login prompt for unauthenticated users
- Pull-to-refresh syncs with server
- Each card shows HS code, description, section, and a red heart remove button
- Tapping a card navigates to the detail page

#### 5.4.4 History Page (`history_page.dart`)

- Server-side search history with relative timestamps ("2m ago", "1d ago")
- Each entry shows query text, top result (code + description), and result count
- Clear all functionality with confirmation dialog
- Tapping re-runs the original search

#### 5.4.5 Pricing Page (`pricing_page.dart`)

Displays three subscription tiers in card format with:
- "Popular" badge for Business tier
- Feature lists with checkmark icons
- "Get Started" CTA buttons
- FAQ section (hardcoded Q&A pairs)

#### 5.4.6 Admin Dashboard (`admin_dashboard.dart`)

**Access Control:** Only visible to users with `role == "admin"`.

**Content:**
1. **Stats Cards** — Total users, total searches, today's searches
2. **Search Trends** — Ranked trending queries with:
   - Configurable time period (1d, 7d, 30d, 90d)
   - Bar chart visualization (width proportional to max count)
   - Rank badges (top 3 highlighted)

### 5.5 State Management

The Flutter application uses a **hybrid state management** approach:

| Pattern | Usage | Scope |
|---|---|---|
| **StatefulWidget** | Screen-level state (loading, error, data) | Per-screen |
| **Singleton + ChangeNotifier** | AuthService, FavoritesService | Global |
| **Provider** | FavoritesService injection | Widget tree |
| **SharedPreferences** | Local recent searches | Device-persistent |

**Data Flow:**
```
User Action → Service Method → HTTP Request → API Response
                    │                              │
                    ├── Update internal state ◄─────┘
                    │
                    └── notifyListeners() → UI rebuilds
```

---

## 6. Next.js Web Application

### 6.1 Application Architecture

```
Nextjs/nextjs/src/
├── app/
│   ├── layout.tsx                    # Root layout (ThemeProvider, BottomNav, Chatbot)
│   ├── page.tsx                      # Landing page (Server Component, SEO)
│   ├── search/
│   │   └── PageClient.tsx            # Main search interface
│   ├── login/
│   │   └── PageClient.tsx            # Firebase auth (email + Google)
│   ├── register/
│   │   └── PageClient.tsx            # Account creation
│   ├── favorites/
│   │   └── PageClient.tsx            # Saved HS codes
│   ├── history/
│   │   └── PageClient.tsx            # Search history
│   ├── hscode/[hscode]/
│   │   └── PageClient.tsx            # Dynamic HS code detail
│   ├── admin/
│   │   └── PageClient.tsx            # Admin dashboard (5 tabs)
│   └── learning/
│       └── page.tsx                  # Academy (5 educational modules)
├── components/
│   ├── Navbar.tsx                    # Top navigation (all app pages)
│   ├── BottomNav.tsx                 # Mobile bottom navigation
│   ├── Chatbot.tsx                   # Floating AI chatbot widget
│   ├── PageTransition.tsx            # Route transition animation
│   ├── GlassOrb.tsx                  # Decorative floating orb
│   ├── ThreeBackground.tsx           # 3D particle animation (login)
│   ├── PixelBeach.tsx                # Pixel-art beach animation
│   ├── SmoothBeach.tsx               # Smooth beach animation
│   └── landing/
│       ├── Hero.tsx                   # Full-viewport hero section
│       ├── HeroCanvas.tsx             # Product→HS code morphing animation
│       ├── Features.tsx               # 4 feature cards
│       ├── HowItWorks.tsx             # 3-step workflow
│       ├── Stats.tsx                  # Animated counters
│       ├── Pricing.tsx                # 3 pricing tiers
│       ├── Testimonials.tsx           # Customer quotes
│       ├── Team.tsx                   # 6-person team grid
│       ├── CTASection.tsx             # Final CTA section
│       ├── LandingNav.tsx             # Landing-specific navbar
│       └── Footer.tsx                 # 5-column footer
├── lib/
│   ├── api.ts                        # User-facing API client
│   ├── adminApi.ts                   # Admin dashboard API client
│   ├── firebase.ts                   # Firebase auth initialization
│   └── ThemeContext.tsx               # Dark/light mode state
└── test/
    └── setup.ts                      # Vitest test configuration
```

### 6.2 Landing Page & SEO Strategy

The landing page is a **Server Component** (`page.tsx` without `"use client"`), enabling maximum SEO optimization:

#### 6.2.1 Three-Layer SEO Architecture

**Layer 1 — Next.js Metadata API:**
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://ceylonhs.com'),
  title: { default: 'CeylonHS — AI-Powered HS Code Search', template: '%s | CeylonHS' },
  description: '...',
  keywords: ['HS code search', 'trade classification', 'customs tariff lookup', ...],
  openGraph: { type: 'website', images: '/og-image.png', locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, googleBot: { 'max-snippet': -1 } },
};
```

**Layer 2 — JSON-LD Structured Data (`@graph`):**
- `WebSite` with `SearchAction` → Potential sitelinks search box in Google SERPs
- `SoftwareApplication` with `AggregateOffer` ($3–$9) → Rich snippets
- `Organization` with logo and social profiles → Knowledge Panel eligibility

**Layer 3 — Semantic HTML:**
- Single `<h1>` in Hero section
- `<h2>` per section (Features, How It Works, Pricing, etc.)
- `<nav>` with `aria-label`
- `<main>`, `<article>`, `<blockquote>`, `<footer>` semantic elements
- `aria-hidden` on decorative elements

#### 6.2.2 Landing Page Sections

The landing page is composed of **10 modular client components**, each self-contained and independently testable:

| # | Component | Purpose | Key Elements |
|---|---|---|---|
| 1 | `LandingNav` | Fixed navbar | Logo, nav links, theme toggle, mobile hamburger |
| 2 | `Hero` | Full-viewport hero | Gradient text headline, CTAs, trust badges |
| 3 | `HeroCanvas` | Brand animation | Shoreline waves + product→HS code morphing labels |
| 4 | `Features` | Value proposition | 4 feature cards (AI, Brand Recognition, Speed, Hierarchy) |
| 5 | `HowItWorks` | User workflow | 3-step flow with numbered badges and connector line |
| 6 | `Stats` | Social proof | Animated counters (16K+ codes, <100ms, 99% accuracy, 6-digit) |
| 7 | `Pricing` | Monetization | Starter ($3), Business ($5, popular), Enterprise ($9) |
| 8 | `Testimonials` | Trust signals | 3 testimonial cards with star ratings |
| 9 | `Team` | About | 6 team members with roles, bios, and gradient avatars |
| 10 | `Footer` | Navigation | 5-column footer (Product, Company, Resources, Legal, Social) |

#### 6.2.3 HeroCanvas — Brand-Defining Animation

The `HeroCanvas.tsx` is a **purpose-built HTML5 canvas component** that combines:

**Layer 1 — Minimal Shoreline (bottom ~40% of viewport):**
- 3 wave layers (sine-composite curves)
- Global surge oscillation (tide-like movement)
- Foam edges with leading-edge glow
- Wet sand sheen effect
- Full dark/light theme awareness

**Layer 2 — Floating Product→HS Code Morphing Labels:**
- 6 concurrent labels floating above the waterline
- Each shows a product name ("Dilmah Tea", "iPhone 15", "Cotton Fabric") that morphs into its HS code ("0902.30", "8517.13", "5208.21")
- 12 product→code pairs rotating (matching real HS codes)
- Cross-fade transition between product name and HS code
- HS codes render with blue glow effect

**Performance Provisions:**
- DPR-aware sizing (capped at 2x)
- 3 wave layers (reduced from 5 for 40% fewer draw calls)
- `aria-hidden="true"` (invisible to screen readers)
- Contained within `<section>` (not `position: fixed`)

### 6.3 Core Pages & Features

#### 6.3.1 Search Page (`search/PageClient.tsx`)

**Features:**
- Live search with debouncing
- Search suggestions and recent searches
- Result cards with **confidence badges** (color-coded by relevance percentage):
  - Green (≥50%): High confidence ✓
  - Amber (30-50%): Moderate !
  - Gray (<30%): Low confidence ?
- Hierarchy expansion toggle
- Favorites toggle (heart icon)
- Filter by section/chapter
- Example query chips in empty state

**Data Flow:**
```
User types → debounce → search(query) → display results
Click result → navigate to /hscode/{code}
Heart icon → addFavorite() / removeFavorite()
```

#### 6.3.2 Login/Register Pages

- **Underwater canvas animation** (bubbles + light rays) as background
- Email/password form OR Google Sign-In button
- Password reset functionality
- Auth flow: Firebase → syncUser() → redirect to /search

#### 6.3.3 HS Code Detail Page (`hscode/[hscode]/PageClient.tsx`)

- Large monospace HS code display
- Official description
- Metadata badges (Section, Level, Parent code)
- Classification hierarchy (numbered breadcrumb path)
- Sub-classifications list (clickable children for recursive navigation)
- Favorite button

#### 6.3.4 Favorites & History Pages

- Persisted through backend API (not local storage)
- Each card navigable to detail view or search re-execution
- Clear history with confirmation dialog
- Relative timestamps ("2h ago", "5 min ago")

#### 6.3.5 Learning/Academy Page (`learning/page.tsx`)

**5 Educational Modules:**

| Module | Topic | Content |
|---|---|---|
| 01 | Introduction to HS Codes | WCO structure, business impact, Sri Lanka context |
| 02 | Searching with AI | Natural language, filters, understanding results |
| 03 | AI-Powered Classification | Hybrid pipeline, brand recognition, confidence scores |
| 04 | Favourites & History | Saving codes, collections, exports |
| 05 | AI Chatbot | 24/7 assistant, GRI rules, complex scenarios |

Each module contains 3-4 topics with lesson content, duration estimates, and quiz questions.

#### 6.3.6 Admin Dashboard (`admin/PageClient.tsx`)

**5-Tab Interface:**

| Tab | Content |
|---|---|
| **Overview** | Stats cards + search trends chart |
| **Training Pairs** | Approve/reject/create training data for model improvement |
| **Search Logs** | Raw search logs with enrichment flags |
| **Synonyms** | Manage brand→category mappings (CRUD) |
| **Datasets** | Upload CSV datasets, monitor embedding progress |

### 6.4 Component Architecture

#### 6.4.1 Navigation Components

**Navbar.tsx** — Top navigation for app pages:
- Expandable width (50px → 150px on hover, desktop)
- Auth-aware: sign-in button or user profile badge with initials
- `onAuthStateChanged()` listener for real-time state

**BottomNav.tsx** — Mobile-first bottom navigation:
- 4 items: Search, Favorites, History, Learn
- Profile dropdown with email and sign-out
- Active route highlighting (blue accent)
- Only rendered on app pages (`/search`, `/favorites`, `/history`, `/hscode`, `/learning`)

#### 6.4.2 Chatbot Component (`Chatbot.tsx`)

- **Floating blue bubble** at bottom-right (z-index 9999)
- Glassmorphic chat panel with gradient header
- Message history with timestamps and differentiated bubbles
- Quick-action chips on first open:
  - "What is an HS code?"
  - "Find code for tea"
  - "How does CeylonHS work?"
  - "Search laptop computer"
- Auto-scroll to latest message
- Loading state during API calls
- Graceful error handling with fallback message

#### 6.4.3 Visual Effects Components

| Component | Technology | Purpose |
|---|---|---|
| `ThreeBackground.tsx` | Three.js | 3D particle animation (login page, 800 particles) |
| `PixelBeach.tsx` | Canvas 2D | Pixel-art beach scene |
| `SmoothBeach.tsx` | Canvas 2D | Smooth gradient beach with wind wisps |
| `GlassOrb.tsx` | CSS animation | Floating glassmorphic orb for backgrounds |
| `PageTransition.tsx` | Framer Motion | Fade-up page route transitions (400ms) |

### 6.5 Theming & Visual Design System

#### 6.5.1 Design Language

The web application follows a **Linear/Vercel-inspired** design system:

- **Color Accent:** Blue-to-cyan gradient (`from-blue-500 to-cyan-400`)
- **Cards:** Rounded-3xl corners, subtle borders, hover `translate-y` animation
- **Typography:** Inter font, `clamp()` for fluid sizing
- **Glass-morphism:** `.glass-panel`, `.glass-card` utilities with `backdrop-blur`
- **Animations:** Framer Motion `whileInView` with `once: true`

#### 6.5.2 Theme System

```typescript
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isDark: boolean;
}
```

- Stored in `localStorage` key `ceylonhs-theme`
- Falls back to `prefers-color-scheme` system preference
- Applies `.dark` class to `<html>` element
- All components reference CSS custom properties:
  - `--page-bg`, `--page-surface`, `--page-border`, `--page-text`, `--copy-muted`
- **Hydration-safe:** Does not render theme-dependent content until after mount

#### 6.5.3 Security Headers (`next.config.ts`)

```typescript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: 'upgrade-insecure-requests' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]
```

---

## 7. Authentication & Security

### 7.1 Authentication Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Flutter / Next.js   │────►│  Firebase Auth    │────►│  FastAPI Backend  │
│  (Client)            │     │  (Identity Toolkit│     │  (API Server)     │
│                      │     │   + Google OAuth)  │     │                   │
│  • Email/Password    │     │  • User creation   │     │  • Token verify   │
│  • Google Sign-In    │     │  • Token issuance   │     │  • User sync      │
│  • Password Reset    │     │  • OAuth exchange   │     │  • Role-based     │
│                      │     │                    │     │    access control  │
└──────────────────────┘     └──────────────────┘     └──────────────────┘
```

### 7.2 Security Measures Implemented

| Category | Implementation |
|---|---|
| **Authentication** | Firebase Identity Toolkit with JWT validation |
| **Authorization** | Role-based (user/admin) with ownership checks on subscriptions |
| **Rate Limiting** | 30/min for search, 60/min for default endpoints (per IP) |
| **CORS** | Configurable origins list (default restrictive in production) |
| **Input Validation** | Pydantic schemas with constraints (query length 1-500, limit 1-50) |
| **SQL Injection** | SQLAlchemy ORM parameterized queries (no raw SQL) |
| **XSS Prevention** | React/Next.js automatic escaping, X-Content-Type-Options: nosniff |
| **Clickjacking** | X-Frame-Options: DENY |
| **HTTPS** | HSTS header with preload, Let's Encrypt SSL |
| **Permissions** | Disabled camera, microphone, geolocation |
| **UID Impersonation** | Token UID validation on user sync endpoint |
| **Secure Defaults** | `env: production`, `host: 127.0.0.1` (opt-in dev mode) |
| **Session Management** | Stateless JWT tokens, no server-side sessions |
| **Database** | WAL mode for SQLite, connection pooling for PostgreSQL |

### 7.3 Development vs Production Mode

| Aspect | Development | Production |
|---|---|---|
| Auth tokens | `dev-token-{uid}` accepted | Firebase JWT only |
| Host binding | `0.0.0.0` (configurable) | `127.0.0.1` (behind nginx) |
| CORS | `["*"]` | Specific origin list |
| Logging | Human-readable | Structured JSON |
| Database | SQLite (in-memory for tests) | PostgreSQL 16 |

---

## 8. DevOps & Deployment

### 8.1 Production Infrastructure

```
DigitalOcean Droplet (Ubuntu)
├── Nginx (Reverse Proxy)
│   ├── Port 443 → SSL Termination (Let's Encrypt)
│   ├── /* → localhost:3000 (PM2 → Next.js)
│   └── /api/v1/* → localhost:8000 (Systemd → Uvicorn → FastAPI)
├── PM2 Process Manager
│   └── ceylonhs-frontend (Next.js on port 3000)
│       ├── autorestart: true
│       ├── max_restarts: 10
│       └── restart_delay: 3000ms
├── Systemd Service
│   └── ceylonhs-backend (Uvicorn on port 8000)
│       └── Python 3.12 venv
├── SQLite Database
│   └── backend/data/hscode.db (WAL mode)
├── FAISS Index
│   └── backend/data/chroma_db/ (index + metadata)
└── Firebase Service Account
    └── backend/firebase-service-account.json
```

### 8.2 CI/CD Pipeline

#### 8.2.1 Continuous Integration (`ci.yml`)

**Trigger:** Pull requests to `main` + pushes to all branches except `main`

**Backend Job:**
1. Setup Python 3.11
2. Cache pip dependencies
3. Install requirements (CPU-only PyTorch)
4. Run pytest with coverage (`pytest tests/ -v --cov=app`)
5. Import check (`from app.main import app`)

**Frontend Job:**
1. Setup Node.js 20 with npm cache
2. `npm ci` (deterministic install from lockfile)
3. `npm run build` (production build verification)
4. `npm test` (Vitest test suite)

Both jobs use **environment variables** for dummy Firebase/API configuration to avoid real service dependencies in CI.

#### 8.2.2 Continuous Deployment (`deploy.yml`)

**Trigger:** Push to `main` (paths: `Nextjs/**`, `backend/**`, `deploy.sh`) + `workflow_dispatch` (manual)

**Deployment Flow:**
1. **Guard database** — Backup `hscode.db` before any git operation
2. **Hard-reset** — `git reset --hard origin/main` (avoids merge conflicts)
3. **Restore DB** — If reset deleted the database, restore from backup
4. **Write `.env.local`** — Inject Firebase config from GitHub Secrets
5. **Install & build frontend** — `npm install` + `npm run build` (NODE_OPTIONS: 1024MB)
6. **Restart PM2** — Stop → delete → start from `ecosystem.config.js` → save → sleep 5s
7. **Configure nginx** — Inject `/api/` proxy block if missing → `nginx -t` → reload
8. **Install backend deps** — `pip install` in venv
9. **Restart backend** — `systemctl restart ceylonhs-backend`

**SSH Deployment:** Uses `appleboy/ssh-action@v1` to execute remote commands on the DigitalOcean droplet.

### 8.3 Docker Deployment (Alternative)

The project supports containerized deployment via Docker Compose:

**Services:**
| Service | Image | Port | Purpose |
|---|---|---|---|
| `db` | PostgreSQL 16 Alpine | 5432 | Persistent database |
| `api` | Custom Dockerfile (Python 3.12) | 8000 | FastAPI backend |

**Docker Backend:**
- Health check: `httpx.get('http://localhost:8000/health')`
- Volumes: `pg_data` (PostgreSQL), `chroma_data` (FAISS index)
- Start period: 60s (allows embedding model download)

### 8.4 Deployment Script (`deploy.sh`)

Manual deployment alternative with pre-flight safety checks:
1. Verify `.env.local`, `.env`, and `firebase-service-account.json` exist
2. Backup production database
3. `git pull origin master`
4. Restore DB if git pull deleted it
5. `npm install` + `npm run build` + PM2 restart
6. Python venv setup + pip install + systemd restart

---

## 9. Testing Strategy

### 9.1 Backend Testing

**Framework:** pytest + pytest-asyncio + pytest-cov

**Test Database:** In-memory SQLite with async engine (`aiosqlite`)

**Fixtures:**

| Fixture | Purpose |
|---|---|
| `test_db` | Fresh per-test AsyncSession with in-memory SQLite |
| `client` | FastAPI TestClient with overridden `get_db` |
| `test_user` | Pre-seeded User with role "user" |
| `test_admin` | Pre-seeded User with role "admin" |
| `mock_firebase_auth` | Intercepts Firebase token verification |
| `mock_search_service` | Returns fixed results (avoids ML model download) |

**Test Coverage:**

| Test File | Test Cases | Coverage |
|---|---|---|
| `test_search.py` | Basic query, empty query, limit parameter, special characters, rate limiting, HS code detail, categories | Search endpoints |
| `test_admin.py` | Unauthenticated access (401), non-admin access (403), admin stats, trends with period, dataset upload validation, health check | Admin + auth |

### 9.2 Frontend Testing (Next.js)

**Framework:** Vitest 2.1.9 + @testing-library/react 16.3.2 + jsdom

**Configuration:**
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: { provider: 'v8', reporters: ['text', 'json', 'html'] }
  }
});
```

**Test Setup (`setup.ts`):**
- Mock Next.js router (`useRouter`, `useSearchParams`, `usePathname`)
- Mock Firebase auth module
- Cleanup after each test

**Test Isolation:** Test files are excluded from `tsconfig.json` to prevent production build compilation:
```json
"exclude": ["node_modules", "src/test", "src/**/__tests__", "**/*.test.ts", "**/*.test.tsx"]
```

### 9.3 Testing Lessons Learned

Several testing anti-patterns were identified and corrected during development (documented in FAILURE_LOG.md):

1. **Wrong mock target** — Mocking at the module where the function is defined vs where it's used
2. **Async/sync mismatch** — Synchronous test database fixtures with async route handlers
3. **Stale import names** — Test files importing renamed functions
4. **`vi` global leak** — Test setup file included in production build

---

## 10. Design Patterns & Architectural Decisions

### 10.1 Design Patterns Used

| Pattern | Implementation | Benefit |
|---|---|---|
| **Factory** | `search_factory.create_search_service()` | Backend selection with auto-fallback |
| **Strategy** | `BaseSearchService` ABC + FAISS/Typesense implementations | Interchangeable search backends |
| **Singleton** | `search_service`, `enrichment_service`, `training_collector`, `AuthService` | Single instance, shared state |
| **Multi-Provider Cascade** | Enrichment tries Groq → Gemini → Cohere | Maximizes availability across free tiers |
| **Dependency Injection** | FastAPI `Depends()`, Flutter constructor injection | Testability, loose coupling |
| **Observer** | Flutter `ChangeNotifier` + `notifyListeners()` | Reactive UI updates |
| **Repository** | Flutter services abstract API from UI | Separation of concerns |
| **Middleware Pipeline** | FastAPI CORS → Rate Limit → Auth → Handler | Clean request processing |
| **Optimistic Update** | `FavoritesService` updates local state before API response | Instant visual feedback |

### 10.2 Key Architectural Decisions

**Decision 1: Suggest-Only Typo Correction**
- Problem: Auto-correction destroyed brand names ("Dilmah" → "dil")
- Solution: Show "Did you mean?" as clickable suggestion; never silently apply
- Consequence: Users retain full control over search intent

**Decision 2: Typesense + FAISS Dual Backend**
- Problem: Need reliability and flexibility in search
- Solution: Factory pattern with environment-variable backend selection and auto-fallback
- Consequence: Zero downtime risk; can hot-swap by changing one env var

**Decision 4: Gemini Flash for Brand Enrichment**
- Problem: No search engine can resolve "Dilmah → tea" (knowledge gap, not retrieval gap)
- Solution: LLM enrichment with permanent caching — each term triggers exactly one API call ever
- Consequence: Endless scalability with zero marginal cost after first occurrence

**Decision 8: SEO-First Landing Page**
- Problem: Original SPA had zero crawlable content
- Solution: Next.js Server Component with 3-layer SEO (Metadata + JSON-LD + Semantic HTML)
- Consequence: Maximum crawlability and rich snippet potential

**Decision 13: Backend Bug Audit**
- 10 issues identified and fixed ranging from critical (`ImportError` at startup) to moderate (no authorization on subscription endpoints) to minor (dead endpoint calls)

### 10.3 Technology Selection Rationale

| Decision | Choice | Rationale | Alternatives Rejected |
|---|---|---|---|
| **Search** | FAISS + Typesense | Self-hosted, free, hybrid search, no vendor lock-in | Algolia (paid), Meilisearch (no vectors), Weaviate (overkill) |
| **Embedding** | all-MiniLM-L6-v2 | 384-dim, fast CPU inference, good quality | Larger models (too slow), fine-tuned (insufficient data) |
| **LLM** | Multi-provider cascade | Maximizes free tier across 3 providers | Single provider (rate limit bottleneck), LangChain (unnecessary complexity) |
| **Backend** | FastAPI | Async-native, auto-docs, Pydantic integration | Django (too heavy), Flask (no async) |
| **Mobile** | Flutter | Cross-platform, single codebase, fast development | React Native (performance), native (2x development) |
| **Web** | Next.js | SSR/SSG for SEO, React ecosystem, TypeScript | Nuxt (team expertise), Remix (less community support) |
| **Auth** | Firebase | Google OAuth, email/password, free tier sufficient | Auth0 (paid), Supabase Auth (less Google integration) |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Async SQLAlchemy supports both; simple dev, robust prod | MongoDB (relational data), MySQL (less ecosystem) |

---

## 11. Challenges, Failures & Lessons Learned

### 11.1 Critical Incident: Sprint 1 Production Outage (~6 Hours)

A single 1,922-line commit containing 18 new files was pushed directly to `main` without local testing, causing a cascade of 9 failures that took down `ceylonhs.com` for approximately 6 hours.

#### Root Causes and Fixes:

| # | Issue | Severity | Root Cause | Fix |
|---|---|---|---|---|
| 1 | `package-lock.json` out of sync | Critical | `npm install` not run after adding devDependencies | Always commit updated lockfile |
| 2 | Vitest `vi` global in production build | Critical | Test files included in `tsconfig.json` | Exclude test directories in tsconfig |
| 3 | Wrong Firebase mock path | Moderate | Mocking at definition site, not usage site | Mock at `firebase_admin.auth.verify_id_token` |
| 4 | Sync DB in async test fixtures | Moderate | `create_engine` used instead of `create_async_engine` | Use `aiosqlite` async engine in tests |
| 5 | Test imports using renamed functions | Minor | Functions renamed without updating tests | Verify imports match actual exports |
| 6 | Dependabot enabled before stable CI | Minor | 12 PRs created against broken CI | Enable only after CI verified stable |
| 7 | Duplicate dependency in requirements.txt | Minor | `httpx` listed twice | Search before adding packages |
| 8 | Force push didn't trigger deployment | Minor | `paths`-filtered workflow ignores backward HEAD moves | Use `workflow_dispatch` for manual triggers |
| 9 | Large multi-feature commit | Process | No code review, no feature branches | Use feature branches, test before merge |

#### Process Improvements Implemented:

**Pre-Push Checklist (Frontend):**
- [ ] `npm install` after package.json changes
- [ ] `package-lock.json` committed
- [ ] `npm run build` succeeds locally
- [ ] `npm test` passes locally
- [ ] Test files excluded from tsconfig.json

**Pre-Push Checklist (Backend):**
- [ ] No duplicate packages in requirements.txt
- [ ] `pytest tests/ -v` passes
- [ ] `python -c "from app.main import app"` succeeds
- [ ] All mocks verified to actually intercept

### 11.2 Backend Bug Audit (10 Issues)

| # | Issue | Severity | Fix |
|---|---|---|---|
| 13.1 | Missing `get_current_user` dependency | Critical | Added proper async dependency with session expunge |
| 13.2 | Port mismatch (Flutter 8001, backend 8000) | Critical | Aligned to port 8000 |
| 13.3 | Sync search blocking event loop | Moderate | Wrapped with `asyncio.to_thread()` |
| 13.4 | Double `db.commit()` | Moderate | Replaced with `flush()` (consistent pattern) |
| 13.5 | No authorization on subscriptions | Moderate | Added ownership + admin check |
| 13.6 | Insecure default config | Moderate | Changed defaults to production-safe |
| 13.7 | Dead endpoint call in Flutter | Minor | Removed non-existent API call |
| 13.8 | Missing requirements.txt | Minor | Created from analyzed imports |
| 13.9 | Raw SQLite blocking event loop | Minor | Wrapped in `asyncio.to_thread()` |
| 13.10 | Wrong return type annotation | Minor | Removed annotation + added session expunge |

### 11.3 Key Lessons

1. **Never push untested code to main** — Feature branches with CI validation are essential
2. **Mock at the usage site** — Python monkeypatching must target where the function is imported, not where it is defined
3. **Async all the way** — Mixing sync and async operations causes subtle, hard-to-diagnose bugs
4. **Secure defaults** — Production config should be the default; development mode should be opt-in
5. **Database backups before deployment** — Git operations can delete files removed from tracking
6. **Test infrastructure separately** — CI/CD pipeline must be validated before enabling automations like Dependabot

---

## 12. Individual Contributions

### 12.1 Team Members

| Member | Role | Primary Responsibilities |
|---|---|---|
| Dulshan | Technical Lead | Backend architecture, search engine, AI enrichment, deployment |
| Thevinu | Full-Stack Developer | Next.js frontend, landing page, SEO, component architecture |
| Thamadi | Full-Stack Developer | Flutter application, mobile UI/UX, cross-platform integration |
| Chanugi | Backend Developer | Database design, API endpoints, authentication middleware |
| Muditha | Frontend Developer | React components, theming, animations, visual design |
| Yasmi | QA & Documentation | Testing strategy, test implementation, documentation, CI/CD |

*(Note: Specific individual contributions should be expanded with actual details from each team member's work log, commit history, and sprint retrospectives.)*

### 12.2 Contribution Matrix

| Component | Design | Implementation | Testing | Deployment |
|---|---|---|---|---|
| FastAPI Backend | Team | Team | Team | Team |
| Search Engine (FAISS) | Team | Team | Team | — |
| AI Enrichment | Team | Team | Team | — |
| Flutter App | Team | Team | Team | — |
| Next.js Web App | Team | Team | Team | — |
| Landing Page (SEO) | Team | Team | — | — |
| CI/CD Pipeline | Team | Team | Team | Team |
| Database Design | Team | Team | Team | — |
| Authentication | Team | Team | Team | — |
| Admin Dashboard | Team | Team | Team | — |

---

## 13. Conclusion

### 13.1 Achievements

CeylonHS was successfully implemented as a **production-deployed, multi-platform AI-powered trade classification system**. The key achievements include:

1. **Hybrid AI Search Engine** — A 7-stage search pipeline combining keyword matching, semantic vector search, and LLM-powered brand enrichment that resolves even brand names and trade abbreviations to correct HS codes.

2. **Multi-Provider LLM Cascade** — A resilient enrichment architecture utilizing three free-tier LLM providers (Groq, Gemini, Cohere) with permanent caching, ensuring each unknown term triggers exactly one API call in its lifetime.

3. **Dual-Backend Search Architecture** — Factory pattern enabling seamless switching between FAISS and Typesense search backends with automatic fallback for zero-downtime reliability.

4. **Cross-Platform Delivery** — A Flutter mobile application (Android/iOS) and a Next.js web application sharing a common FastAPI backend, with consistent feature parity.

5. **SEO-Optimized Landing Page** — Three-layer SEO architecture (Metadata API + JSON-LD + Semantic HTML) with a distinctive brand animation (coastal waves + product→HS code morphing labels).

6. **Production Deployment** — Automated CI/CD pipeline deploying to a DigitalOcean droplet via GitHub Actions, with nginx reverse proxy, PM2 process management, and systemd service control.

7. **Continuous Learning Loop** — Automated training data collection from search interactions, enabling future embedding model fine-tuning.

### 13.2 Technical Metrics

| Metric | Value |
|---|---|
| Backend Endpoints | 31 REST API endpoints across 9 route groups |
| HS Codes Indexed | 16,000+ commodity classifications |
| Search Latency | Sub-100ms (FAISS vector search) |
| Embedding Dimension | 384 (all-MiniLM-L6-v2) |
| LLM Providers | 3 (Groq, Gemini, Cohere) with cascade fallback |
| Flutter Screens | 7 main screens + admin dashboard |
| Next.js Components | 20+ components (10 landing + 10 app) |
| CI/CD Jobs | 2 (backend + frontend) on every PR |
| Security Headers | 7 HTTP security headers in production |
| Test Coverage | Backend: pytest with coverage; Frontend: Vitest |

### 13.3 Future Enhancements

1. **Payment Integration** — Connect pricing tiers to Stripe/PayPal for actual subscription billing
2. **Embedding Fine-Tuning** — Use collected training pairs to fine-tune the embedding model
3. **Offline Mode** — Cache FAISS index subset on mobile for offline search capability
4. **Multi-Language Support** — Sinhala/Tamil HS code descriptions
5. **Bulk Classification** — CSV upload for batch HS code classification
6. **API Access** — Public REST API for programmatic HS code lookups (paid tier)

---

**End of CW2 Implementation Report**

*Document prepared by CS-15 Team — Software Development Group Project*
*Last updated: March 2026*

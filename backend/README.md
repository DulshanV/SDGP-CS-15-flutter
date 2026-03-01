# CeylonHS Backend — FastAPI + FAISS Vector Search

The backend provides RESTful APIs for HS code search, user management, and admin operations. Built with FastAPI, FAISS for vector search, and SQLAlchemy for database operations.

## 🔧 Setup

### Prerequisites
- Python 3.11+
- pip
- Virtual environment tool

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\Activate.ps1

# Install dependencies (includes PyTorch CPU-only)
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# -- Environment --
ENV=development  # or 'production'

# -- Database --
DATABASE_URL=sqlite+aiosqlite:///./data/hscode.db  # or PostgreSQL
DATABASE_URL_SYNC=sqlite:///./data/hscode.db

# -- Firebase Authentication --
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json

# -- FAISS / Embeddings --
CHROMA_PERSIST_DIR=./data/chroma_db
EMBEDDING_MODEL=all-MiniLM-L6-v2
DATASET_CSV_PATH=../all_chapters_extracted.csv

# -- LLM Enrichment (optional but recommended) --
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash
COHERE_API_KEY=...  # Fallback

# -- Server --
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# -- Rate Limiting --
RATE_LIMIT_SEARCH=30/minute
RATE_LIMIT_DEFAULT=60/minute
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** authentication
3. Download service account JSON:
   - Project Settings → Service Accounts → Generate New Private Key
4. Save as `firebase-service-account.json` in backend directory
5. Add to `.gitignore` (already configured)

## 🚀 Running the Server

### Development
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Production
```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker
```bash
docker build -t ceylonhs-backend .
docker run -p 8000:8000 --env-file .env ceylonhs-backend
```

Server will be available at:
- **API**: http://127.0.0.1:8000
- **Docs**: http://127.0.0.1:8000/docs (Swagger UI)
- **ReDoc**: http://127.0.0.1:8000/redoc

## 📚 API Endpoints

### Public Endpoints

#### Search
- `GET /api/v1/search?q={query}&limit=10` — Search HS codes
- `GET /api/v1/hs/{hscode}` — Get HS code details
- `GET /api/v1/categories` — List all categories

#### Health
- `GET /health` — Health check
- `GET /api` — Service info

### Authenticated Endpoints (require Firebase token)

#### Users
- `POST /api/v1/users/sync` — Sync Firebase user to backend DB
- `GET /api/v1/users/me` — Get current user profile
- `GET /api/v1/users/me/history` — Search history (paginated)
- `POST /api/v1/users/me/favorites` — Add favorite HS code
- `GET /api/v1/users/me/favorites` — List favorites
- `DELETE /api/v1/users/me/favorites/{id}` — Remove favorite

### Admin Endpoints (require admin role)

#### Admin Dashboard
- `GET /api/v1/admin/stats` — User/search statistics
- `GET /api/v1/admin/trends?days=7` — Search trends

#### Dataset Management
- `POST /api/v1/admin/dataset/upload` — Upload CSV dataset
- `GET /api/v1/datasets` — List datasets
- `POST /api/v1/datasets/{id}/activate` — Activate dataset
- `DELETE /api/v1/datasets/{id}` — Delete dataset
- `GET /api/v1/datasets/{id}/embedding-status` — Check embedding job

#### Training Data
- `GET /api/v1/training/pairs` — List training pairs
- `POST /api/v1/training/pairs` — Add training pair
- `PATCH /api/v1/training/pairs/{id}/approve` — Approve pair
- `DELETE /api/v1/training/pairs/{id}` — Delete pair
- `GET /api/v1/training/logs` — Search logs
- `GET /api/v1/training/feedback-status` — Get feedback toggle state
- `POST /api/v1/training/feedback-toggle` — Enable/disable feedback
- `GET /api/v1/training/export` — Export training data as JSON

#### Synonyms
- `GET /api/v1/synonyms` — List synonym mappings
- `POST /api/v1/synonyms` — Create synonym (brand→keyword)
- `DELETE /api/v1/synonyms/{id}` — Delete synonym

## 🗄️ Database

### SQLite (Development)
Default setup uses SQLite:
```python
DATABASE_URL=sqlite+aiosqlite:///./data/hscode.db
```

### PostgreSQL (Production)
For production, use PostgreSQL:
```python
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/ceylonhs
DATABASE_URL_SYNC=postgresql+psycopg2://user:pass@localhost/ceylonhs
```

### Migrations (Alembic)
```bash
# Generate migration after model changes
alembic revision --autogenerate -m "Add new field"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## 🔍 Search Pipeline

### 1. Query Preprocessing
```python
query = "Dilmah tea bags"
# → Check synonym cache: "Dilmah" → "tea"
# → Expanded query: "tea tea bags"
```

### 2. Embedding Generation
```python
embedding = model.encode(expanded_query)  # 384-dim vector
```

### 3. FAISS Vector Search
```python
distances, indices = faiss_index.search(embedding, k=10)
# Returns top 10 similar HS codes
```

### 4. Post-Processing
- Remove duplicates
- Apply fuzzy matching for typos
- Sort by relevance score

### 5. Enrichment (Optional)
If LLM APIs configured:
```python
# Cascade: Groq → Gemini → Cohere
enrichment = llm.enrich(query, top_result)
# Returns: context, usage tips, common products
```

## 🧪 Testing

### Run All Tests
```bash
pytest tests/ -v
```

### With Coverage
```bash
pytest tests/ --cov=app --cov-report=html
open htmlcov/index.html  # View coverage report
```

### Run Specific Test File
```bash
pytest tests/test_search.py -v
```

### Test Structure
```
tests/
├── conftest.py          # Fixtures (test db, mock auth, test client)
├── test_search.py       # Search endpoint tests
├── test_admin.py        # Admin endpoint tests
└── test_users.py        # User endpoint tests (TODO)
```

## 🛠️ Utility Scripts

### Grant Admin Role
```bash
python -m app.scripts.grant_admin user@example.com
```

### Build FAISS Index
```bash
python -m app.scripts.embed_dataset
```

### Warm Cache (Pre-load FAISS)
```bash
python -m app.scripts.warm_cache
```

### Start Typesense (if using)
```bash
python -m app.scripts.start_typesense
```

## 📊 Monitoring

### Logs
Structured JSON logs in production:
```json
{
  "timestamp": "2026-03-01T12:00:00Z",
  "level": "INFO",
  "message": "Search query processed",
  "query": "tea",
  "results": 5,
  "latency_ms": 45
}
```

Development logs are human-readable.

### Health Check
```bash
curl http://localhost:8000/health
# {"status":"healthy","timestamp":"2026-03-01T12:00:00Z"}
```

### Metrics (TODO: Add Prometheus)
- Search latency (p50, p95, p99)
- Enrichment success rate
- Rate limit violations
- Active users

## 🔒 Security

### Rate Limiting (SlowAPI)
- Search: 30 requests/minute
- General: 60 requests/minute
- Admin: 100 requests/minute

### Authentication Flow
1. Frontend gets Firebase ID token
2. Backend verifies token via Firebase Admin SDK
3. JWT claims checked (UID, email)
4. User role loaded from database

### Admin Protection
All `/api/v1/admin/*` routes require:
1. Valid Firebase token
2. User exists in database
3. `role = 'admin'`

## 🐛 Common Issues

### FAISS Index Not Found
```bash
# Build the index first
python -m app.scripts.embed_dataset
```

### Firebase Credentials Error
```bash
# Ensure service account JSON exists
ls firebase-service-account.json
# Check FIREBASE_CREDENTIALS_PATH in .env
```

### Port 8000 in Use
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process or use different port
uvicorn app.main:app --port 8001
```

### Import Errors
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

## 📖 Further Reading

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Async ORM](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [FAISS Documentation](https://github.com/facebookresearch/faiss/wiki)
- [sentence-transformers Documentation](https://www.sbert.net/)

---

**Need help?** Open an issue or contact security@ceylonhs.com

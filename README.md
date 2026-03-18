# CeylonHS — AI-Powered HS Code Search Platform

**CeylonHS** is a modern web application that helps Sri Lankan businesses find harmonized system (HS) codes for their products using AI-powered search and natural language processing. Built with Next.js, FastAPI, and advanced vector search.

🔗 **Live**: [ceylonhs.com](https://ceylonhs.com)  
📖 **Decisions**: [DECISION_LOG.md](DECISION_LOG.md)

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

---

## ✨ Features

- **AI-Powered Search**: Natural language queries powered by FAISS vector search + sentence-transformers
- **Smart Enrichment**: Contextual product information via Groq (Llama 3.3), Gemini 2.0, and Cohere
- **Brand Recognition**: Synonym mapping for local brands (e.g., "Dilmah" → "tea")
- **Firebase Authentication**: Secure email/password auth with user profiles
- **Search History & Favorites**: Track searches and bookmark HS codes
- **Admin Dashboard**: User management, search analytics, training data collection, dataset uploads
- **Responsive UI**: Modern design with Framer Motion animations and Three.js canvas
- **Rate Limiting**: SlowAPI-powered protection (30 search requests/min)

---

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   nginx     │  ← Reverse proxy
│  (ceylonhs) │     - Frontend: port 3000
└──────┬──────┘     - Backend:  port 8000
       │
       ├─────────────────────┬──────────────────────┐
       │                     │                      │
       ▼                     ▼                      ▼
┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│  Next.js 16  │      │ FastAPI     │      │ Static Files │
│  React 19    │ ◄──► │ + uvicorn   │      │ (.next/)     │
│  (SSR/SSG)   │      │             │      └──────────────┘
└──────────────┘      └──────┬──────┘
                             │
                    ┌────────┼────────┐
                    │        │        │
                    ▼        ▼        ▼
              ┌─────────┐ ┌────────┐ ┌─────────────┐
              │  FAISS  │ │ SQLite │ │ Groq/Gemini │
              │  Index  │ │ (user  │ │ (enrichment)│
              │ 9963    │ │  data) │ └─────────────┘
              │ vectors │ └────────┘
              └─────────┘
```

**Data Flow**:
1. User searches for "Dilmah tea"
2. Backend checks synonym cache → "Dilmah" = "tea"
3. Query embedding generated via `sentence-transformers/all-MiniLM-L6-v2`
4. FAISS finds top 10 semantically similar HS codes
5. Groq/Gemini enriches results with product context
6. Frontend displays results with relevance scores

---

## 🛠️ Tech Stack

### Frontend (Next.js)
| **Technology** | **Version** | **Purpose** |
|----------------|-------------|-------------|
| Next.js | 16.1.6 | React framework (App Router, SSR/SSG) |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Framer Motion | 12.x | Animations |
| Three.js | 0.183.x | 3D hero canvas |
| Firebase | 12.x | Authentication SDK |
| Axios | 1.13.x | HTTP client |
| EmailJS | 4.x | Welcome emails |

### Backend (FastAPI)
| **Technology** | **Version** | **Purpose** |
|----------------|-------------|-------------|
| FastAPI | 0.115.8 | Python web framework |
| Uvicorn | 0.34.0 | ASGI server |
| SQLAlchemy | 2.0.47 | ORM (async) |
| SQLite / aiosqlite | - | Database |
| FAISS | 1.13.2 | Vector similarity search |
| sentence-transformers | 3.2.1 | Text embeddings |
| PyTorch | 2.10.0 | ML framework |
| Firebase Admin | 7.2.0 | Auth verification |
| SlowAPI | 0.1.9 | Rate limiting |
| Groq | 1.0.0 | LLM API (Llama 3.3 70B) |
| Gemini | 0.8.6 | Google AI API (Gemini 2.0) |
| RapidFuzz | 3.14.3 | Fuzzy string matching |
| Pandas | 3.0.1 | Data processing |

### DevOps
- **Hosting**: DigitalOcean Droplet (Ubuntu)
- **Process Manager**: PM2 (frontend), systemd (backend)
- **Reverse Proxy**: nginx
- **CI/CD**: GitHub Actions (`.github/workflows/`)
- **Version Control**: Git + GitHub

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+ and npm
- **Python** 3.11+
- **Git**
- **Firebase** project (for authentication)
- **API Keys**: Groq, Gemini, Cohere (optional for enrichment)

### 1. Clone the Repository
```bash
git clone https://github.com/DulshanV/SDGP-CS-15-flutter.git
cd SDGP-CS-15-flutter
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\Activate.ps1

# Install dependencies (including PyTorch CPU-only)
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials (see backend/README.md)
# Required: FIREBASE_PROJECT_ID, FIREBASE_CREDENTIALS_PATH
# Optional: GROQ_API_KEY, GEMINI_API_KEY (for enrichment)

# Run database migrations (if using PostgreSQL)
alembic upgrade head

# Start the backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000)  
API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup

```bash
cd Nextjs/nextjs

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with Firebase config
# Required:
#   - NEXT_PUBLIC_FIREBASE_API_KEY
#   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
#   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
#   - NEXT_PUBLIC_API_URL=http://127.0.0.1:8000  # For local dev

# Start the dev server
npm run dev
```

Frontend will be available at [http://localhost:3000](http://localhost:3000)

### 4. Initial Data Setup

```bash
cd backend

# Upload HS code dataset (CSV)
# Via API: POST /api/v1/admin/dataset/upload
# Or manually: place CSV in data/datasets/

# Build FAISS index
python -m app.scripts.embed_dataset

# Grant yourself admin access
python -m app.scripts.grant_admin your-email@example.com
```

### 5. Run Tests

**Backend**:
```bash
cd backend
pytest tests/ -v --cov=app
```

**Frontend**:
```bash
cd Nextjs/nextjs
npm test
```

---

## 📁 Project Structure

```
SDGP-CS-15-flutter/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   │   └── routes/
│   │   │       ├── search.py      # /api/v1/search, /api/v1/hs/{hscode}
│   │   │       ├── users.py       # User profiles, history, favorites
│   │   │       ├── admin.py       # Admin stats, dataset uploads
│   │   │       ├── synonyms.py    # Brand/term synonym management
│   │   │       ├── training.py    # Training data collection
│   │   │       └── datasets.py    # Dataset management
│   │   ├── core/           # Configuration, database, auth
│   │   ├── models/         # SQLAlchemy models + Pydantic schemas
│   │   ├── services/       # Business logic (search, enrichment, etc.)
│   │   └── main.py         # FastAPI app entrypoint
│   ├── data/
│   │   ├── chroma_db/      # FAISS index files
│   │   └── hscode.db       # SQLite database
│   ├── scripts/            # Utility scripts (grant_admin, embed_dataset)
│   ├── tests/              # Pytest test suite
│   ├── requirements.txt
│   ├── .env                # Environment variables (not in git)
│   └── README.md
│
├── Nextjs/nextjs/          # Next.js frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── search/               # Search UI
│   │   │   ├── admin/                # Admin dashboard
│   │   │   ├── login/                # Auth pages
│   │   │   ├── register/
│   │   │   ├── history/              # Search history
│   │   │   ├── favorites/            # Bookmarked codes
│   │   │   └── hscode/[hscode]/      # HS code detail page
│   │   ├── components/
│   │   │   └── landing/    # Landing page sections (Hero, Stats, etc.)
│   │   ├── lib/
│   │   │   ├── api.ts                # API client functions
│   │   │   ├── adminApi.ts           # Admin API calls
│   │   │   └── firebase.ts           # Firebase config
│   │   └── tests/          # Vitest setup
│   ├── public/             # Static assets
│   ├── tests/              # Vitest test suite
│   ├── package.json
│   ├── .env.local          # Environment variables (not in git)
│   └── README.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml          # Build + test checks
│       └── deploy.yml      # DigitalOcean deployment
│
├── all_chapters_extracted.csv  # HS code dataset
├── DECISION_LOG.md         # Architectural decision records
└── README.md               # This file
```

> Active app folders are `backend/`, `Nextjs/nextjs/`, and `flutter_application_1/`.  
> `SDGP-CS-15-flutter-main/` and `SDGP-main/` are legacy copies kept for reference only.

---

## 🚢 Deployment

### Production Environment
- **Domain**: ceylonhs.com
- **Server**: DigitalOcean Droplet (Ubuntu)
- **Frontend**: PM2 (ecosystem.config.js)
- **Backend**: systemd service (`ceylonhs-backend.service`)
- **Reverse Proxy**: nginx

### Automated Deployment (GitHub Actions)
On push to `main` branch:
1. SSH to droplet
2. `git pull origin main`
3. Build Next.js frontend
4. Restart PM2 + systemd services

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

### Manual Deployment
```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# Pull latest code
cd ~/ceylonhs
git fetch origin
git reset --hard origin/main

# Frontend
cd Nextjs/nextjs
npm install
npm run build
pm2 restart ceylonhs-frontend

# Backend
cd ~/ceylonhs/backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart ceylonhs-backend
```

### Environment Variables (Production)
Stored as GitHub Secrets:
- `DROPLET_HOST` — Server IP
- `DROPLET_SSH_KEY` — Private SSH key
- `NEXT_PUBLIC_FIREBASE_*` — Firebase config
- `NEXT_PUBLIC_EMAILJS_*` — EmailJS credentials

---

## 🧪 Testing

### Backend Tests (pytest)
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

Coverage report: `backend/htmlcov/index.html`

### Frontend Tests (vitest)
```bash
cd Nextjs/nextjs
npm test                 # Run once
npm run test:watch       # Watch mode
```

### CI Pipeline
GitHub Actions runs tests on every PR:
- Backend: `pytest` + syntax check
- Frontend: `npm test` + Next.js build

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Style
- **Backend**: Black formatter, isort
- **Frontend**: ESLint (Next.js config), Prettier
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **HS Code Data**: Sri Lanka Customs
- **Embedding Model**: sentence-transformers (all-MiniLM-L6-v2)
- **LLM Providers**: Groq (Llama 3.3), Google (Gemini 2.0), Cohere
- **UI Inspiration**: Vercel, Linear, Stripe

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/DulshanV/SDGP-CS-15-flutter/issues)
- **Email**: hello@ceylonhs.com
- **Security**: security@ceylonhs.com

---

**Built with ❤️ by the CeylonHS Team**

---

## 📱 Backend ↔ Flutter Integration

| Target | Flutter `apiBaseUrl` | Backend `HOST` | Backend reachable at | CORS origin to allow |
|---|---|---|---|---|
| Android emulator | `http://10.0.2.2:8000` | `127.0.0.1` (default) | `http://10.0.2.2:8000` | `http://10.0.2.2:8000` or `*` for dev |
| iOS simulator / desktop / web on same machine | `http://127.0.0.1:8000` | `127.0.0.1` | `http://127.0.0.1:8000` | `http://127.0.0.1:8000` |
| Physical device on same LAN | `http://<your-lan-ip>:8000` | `0.0.0.0` | `http://<your-lan-ip>:8000` | `http://<your-lan-ip>:8000` |

**Notes:**
- In production set `ENV=production` and use real Firebase tokens (dev tokens are rejected).
- For LAN testing, also set `CORS_ORIGINS` to the exact origin you are using (or `[*]` only in development).
- `PORT` defaults to 8000; change both sides together if you override it.


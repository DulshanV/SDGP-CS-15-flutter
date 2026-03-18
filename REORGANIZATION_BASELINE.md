# Codebase Reorganization - Baseline Documentation

**Date**: March 18, 2026
**Branch**: Organizing
**Backup Branch**: backup-before-reorganization (created and pushed)

## Current Directory Structure

```
SDGP-CS-15-flutter/
├── .git/                               # Git repository
├── .github/workflows/                   # CI/CD workflows
├── .gitignore                          # Git ignore rules
├── .idea/                              # IDE configuration
├── DECISION_LOG.md                     # Project decisions
├── FAILURE_LOG.md                      # Failure documentation
├── README.md                           # Main documentation
├── Nextjs/                            # ⚠️ Next.js web application (to be renamed)
├── SDGP-CS-15-flutter/               # ❌ Empty duplicate directory (to be removed)
├── SDGP-CS-15-flutter-main/          # ❌ Duplicate with legacy content (to be removed)
├── SDGP-main/                        # ❌ Legacy HTML files (to be archived)
├── all_chapters_extracted.csv        # 📊 HS code dataset (1MB, to be moved to data/)
├── backend/                          # 🐍 FastAPI backend (to be moved)
├── deploy.sh                         # 🚀 Deployment script (to be moved to scripts/)
├── docker-compose.yml                # 🐳 Container orchestration
└── flutter_application_1/            # ⚠️ Flutter mobile app (to be renamed)
```

## Platform Configurations

### Backend (FastAPI)
- **Location**: `./backend/`
- **Framework**: FastAPI 0.135.1 + SQLAlchemy 2.0.48
- **Key Dependencies**: sentence-transformers, faiss-cpu, torch
- **Database**: PostgreSQL (via docker-compose) + SQLite for dev
- **Build Command**: `pip install -r requirements.txt`
- **Test Command**: `pytest tests/ -v --cov=app`
- **Run Command**: `uvicorn app.main:app --reload`

### Web Frontend (Next.js)
- **Location**: `./Nextjs/nextjs/`
- **Framework**: Next.js 16.1.6 + React 19.2.4
- **Current Name**: "nextjs" (to be renamed to "hscode-web")
- **Key Dependencies**: Tailwind CSS 4.x, Framer Motion, Three.js
- **Build Command**: `npm run build`
- **Test Command**: `npm test` (Vitest)
- **Dev Command**: `npm run dev`

### Mobile App (Flutter)
- **Location**: `./flutter_application_1/`
- **Framework**: Flutter SDK ^3.11.0
- **Current Name**: "flutter_application_1" (to be renamed to "hscode_mobile")
- **Key Dependencies**: provider, http, shared_preferences, google_sign_in
- **Build Commands**:
  - Android: `flutter build apk`
  - iOS: `flutter build ios`
- **Test Command**: `flutter test`
- **Dev Command**: `flutter run`

## Current Build System

### Docker Compose Services
- **Database**: PostgreSQL 16 (port 5432)
- **API**: FastAPI backend (port 8000, builds from `./backend`)
- **Volumes**:
  - `pg_data` for PostgreSQL
  - `chroma_data` for vector database
  - Dataset mounted at `/app/data/all_chapters_extracted.csv`

### CI/CD Workflows
- **File**: `.github/workflows/ci.yml`
- **Backend Job**: Python 3.11, pytest with coverage
- **Frontend Job**: Node.js 20, npm build + test
- **Triggers**: PRs to main, pushes to non-main branches

### Deployment Pipeline
- **Script**: `deploy.sh`
- **Process**:
  1. Safety checks for environment files
  2. Git pull from master branch
  3. Next.js: npm install → build → PM2 restart
  4. FastAPI: venv setup → pip install → systemctl restart
- **Services**:
  - Frontend: PM2 (`ceylonhs-frontend`)
  - Backend: Systemd (`ceylonhs-backend`)

## Critical Issues Identified

### High Priority
1. **Flutter main.dart**: 1,667 lines - urgent refactoring needed
2. **Duplicate directories**: 3 versions causing confusion
3. **Inconsistent naming**: `flutter_application_1` not descriptive

### Medium Priority
1. **Scattered config**: Files spread across root directory
2. **Legacy code**: HTML files in `SDGP-main/`
3. **Missing structure**: No docs/, scripts/, config/ organization

## Current Working State Verification

### Backend Status
- ✅ Can build with current docker-compose setup
- ✅ Tests pass in CI pipeline
- ✅ API endpoints functional

### Frontend Status
- ✅ Next.js builds successfully
- ✅ Vitest tests pass
- ✅ Routes working with App Router

### Mobile Status
- ✅ Flutter project compiles
- ✅ Dependencies resolve correctly
- ❌ Main.dart needs immediate refactoring (1,667 lines)

## Environment Requirements

### Development Environment
- **Backend**: Python 3.11+ with pip
- **Frontend**: Node.js 20+ with npm
- **Mobile**: Flutter SDK ^3.11.0
- **Database**: PostgreSQL 16 (via Docker)
- **Container**: Docker + Docker Compose

### Required Environment Files (Not in Git)
- `Nextjs/nextjs/.env.local` - Frontend environment variables
- `backend/.env` - Backend environment variables
- `backend/firebase-service-account.json` - Firebase credentials

## Integration Points

### API Communication
- **Web to Backend**: HTTP REST API at `http://localhost:8000`
- **Mobile to Backend**: Platform-specific URLs:
  - Android emulator: `http://10.0.2.2:8000`
  - iOS simulator: `http://127.0.0.1:8000`
  - Physical device: `http://<lan-ip>:8000`

### Authentication
- **Firebase Auth**: Shared between web and mobile
- **Backend Integration**: JWT token validation

### Data Flow
1. User input → Frontend/Mobile
2. API calls → FastAPI backend
3. Vector search → FAISS + AI enrichment
4. Results → Frontend/Mobile display

This baseline establishes our starting point for the reorganization process while maintaining full functionality.
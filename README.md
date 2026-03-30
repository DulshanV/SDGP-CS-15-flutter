# CeylonHS — AI-Powered HS Code Search & Customs Training Platform

**CeylonHS** is a full-stack platform that combines an AI-powered Harmonised System (HS) code search engine with a dedicated e-learning system for Sri Lankan Customs training. It is built as a multi-component monorepo targeting mobile, web, and API surfaces.

---

## Table of Contents

- [Overview](#overview)
- [Project Architecture](#project-architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup Guide](#setup-guide)
  - [1. FastAPI Backend (CeylonHS Search API)](#1-fastapi-backend-ceylonhs-search-api)
  - [2. Flutter Mobile / Web App](#2-flutter-mobile--web-app)
  - [3. Next.js Web Frontend](#3-nextjs-web-frontend)
  - [4. E-Learning Backend (Express + MySQL)](#4-e-learning-backend-express--mysql)
  - [5. E-Learning Frontend (React + Vite)](#5-e-learning-frontend-react--vite)
  - [6. Docker Compose (Full CeylonHS Stack)](#6-docker-compose-full-ceylonhs-stack)
- [Environment Variables Reference](#environment-variables-reference)

---

## Overview

The platform is split into two interconnected products:

| Product | Description |
|---------|-------------|
| **CeylonHS Search** | Semantic HS code lookup using FAISS vector search, fuzzy matching, and optional LLM enrichment (Groq / Gemini / Cohere). Authenticated via Firebase. |
| **Customs E-Learning** | Course management system for Sri Lankan Customs officers — course enrolment, video lessons, MCQ quizzes, progress tracking, and PDF certificate generation. |

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  Flutter App (mobile/web)    Next.js Web App (marketing +   │
│  CeylonHS search, favorites, │ search + admin dashboard)   │
│  history, pricing, profile   │                             │
└────────────────────┬────────────────────┬───────────────────┘
                     │                    │
                     ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              CeylonHS FastAPI Backend (:8000)               │
│  FAISS vector search · Firebase Auth · SQLite / PostgreSQL  │
│  LLM enrichment (Groq → Gemini → Cohere cascade)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               E-Learning React Frontend (:5173)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           E-Learning Express Backend (:5000)                │
│         JWT Auth · MySQL · pdfkit (certificates)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Flutter Mobile / Web App (`flutter_application_1/`)

| Category | Technology |
|----------|-----------|
| Language | Dart 3.11+ |
| Framework | Flutter |
| State Management | Provider |
| Routing | go_router |
| Auth | Google Sign-In + Firebase |
| HTTP | http |
| Caching | cached_network_image, shared_preferences |

### FastAPI Backend (`backend/`)

| Category | Technology |
|----------|-----------|
| Language | Python 3.11+ |
| Framework | FastAPI + Uvicorn / Gunicorn |
| Vector Search | FAISS (CPU) + sentence-transformers (`all-MiniLM-L6-v2`) |
| Fuzzy Matching | rapidfuzz, pyspellchecker |
| Database | SQLAlchemy (async) · SQLite (dev) · PostgreSQL (prod) |
| Migrations | Alembic |
| Auth | Firebase Admin SDK |
| LLM Enrichment | Groq, Gemini, Cohere (cascade fallback) |
| Rate Limiting | slowapi |
| Testing | pytest, pytest-asyncio, pytest-cov |

### Next.js Web Frontend (`Nextjs/nextjs/`)

| Category | Technology |
|----------|-----------|
| Language | TypeScript |
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 4 |
| Auth | Firebase |
| HTTP | Axios |
| Animation | Framer Motion |
| 3D Graphics | Three.js |
| Icons | Lucide React |

### E-Learning Backend (`e-learning-backend/`)

| Category | Technology |
|----------|-----------|
| Language | JavaScript (Node.js) |
| Framework | Express 4 |
| Database | MySQL (mysql2) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| PDF Generation | pdfkit |
| Rate Limiting | express-rate-limit |

### E-Learning Frontend (`e-learning-frontend/`)

| Category | Technology |
|----------|-----------|
| Language | JavaScript |
| Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| HTTP | Axios |

---

## Features

### CeylonHS Search
- 🔍 **Semantic HS code search** with FAISS vector similarity
- 🧠 **AI enrichment** — brand-name resolution via Groq / Gemini / Cohere LLM cascade
- ✏️ **Fuzzy matching** and spell-correction for noisy queries
- ⭐ **Favourites & search history** per authenticated user
- 💲 **Subscription / pricing plans**
- 🛠 **Admin dashboard** — user statistics, search trends, dataset management, training data curation, synonym management

### E-Learning Platform
- 🔐 **JWT authentication** for students and admins
- 📚 **Course creation & management** with lesson videos
- 📝 **MCQ quizzes** per lesson
- 📊 **Progress tracking** (video completion + quiz scores)
- ✅ **Enrolment approval flow**
- 🏆 **PDF certificate generation** on course completion

---

## Project Structure

```text
SDGP-CS-15-flutter/
├── flutter_application_1/   # Flutter mobile + web app (CeylonHS)
├── backend/                 # FastAPI search API (CeylonHS)
├── Nextjs/nextjs/           # Next.js web frontend (CeylonHS)
├── e-learning-backend/      # Express + MySQL API (E-Learning)
├── e-learning-frontend/     # React + Vite UI (E-Learning)
└── docker-compose.yml       # Docker Compose for CeylonHS stack
```

---

## Setup Guide

### Prerequisites

| Tool | Version |
|------|---------|
| Flutter SDK | 3.11+ |
| Dart SDK | 3.11+ |
| Python | 3.11+ |
| Node.js | 18+ |
| MySQL | 8.0+ (E-Learning only) |
| Docker + Docker Compose | Latest (optional) |

---

### 1. FastAPI Backend (CeylonHS Search API)

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\Activate.ps1    # Windows PowerShell

# Install dependencies (PyTorch CPU build)
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set Firebase credentials, LLM API keys, database URL, etc.

# Build the FAISS vector index (required on first run)
python -m app.scripts.embed_dataset

# Start development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:
- **API**: `http://127.0.0.1:8000`
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

#### Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Email/Password** authentication.
3. Go to **Project Settings → Service Accounts → Generate New Private Key**.
4. Save the downloaded JSON as `backend/firebase-service-account.json`.
5. Set `FIREBASE_PROJECT_ID` and `FIREBASE_CREDENTIALS_PATH` in `backend/.env`.

---

### 2. Flutter Mobile / Web App

```bash
cd flutter_application_1

# Install dependencies
flutter pub get

# Run on a connected device / emulator
flutter run

# Run with local API (development)
flutter run --dart-define=USE_LOCAL_API=true

# Build targets
flutter build apk        # Android APK
flutter build ios        # iOS (macOS + Xcode required)
flutter build web        # Web
```

> **Note:** The app communicates with the FastAPI backend. Make sure the backend is running and the API base URL in `lib/config.dart` points to the correct host.

---

### 3. Next.js Web Frontend

```bash
cd Nextjs/nextjs

# Install dependencies
npm install

# Start development server
npm run dev          # http://localhost:3000

# Production build
npm run build
npm run start        # http://localhost:3000
```

---

### 4. E-Learning Backend (Express + MySQL)

```bash
cd e-learning-backend

# Install dependencies
npm install

# Create and configure the environment file
# Required variables: JWT_SECRET, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, CLIENT_URL
cp .env.example .env   # create .env manually if no example exists

# Import the database schema
mysql -u <user> -p <database_name> < schema.sql

# Start development server (with nodemon auto-reload)
npm run dev          # http://localhost:5000

# Start production server
npm start
```

---

### 5. E-Learning Frontend (React + Vite)

```bash
cd e-learning-frontend

# Install dependencies
npm install

# Start development server
npm run dev          # http://localhost:5173

# Production build
npm run build

# Preview production build locally
npm run preview
```

> **Note:** The frontend expects the E-Learning backend at `http://localhost:5000`. Update `services/` API base URL if deploying to a different host.

---

### 6. Docker Compose (Full CeylonHS Stack)

The `docker-compose.yml` at the repository root spins up the FastAPI backend together with a PostgreSQL database:

```bash
# From the repository root
docker-compose up -d

# Services started:
#   hscode_db  – PostgreSQL 16  → localhost:5432
#   hscode_api – FastAPI backend → localhost:8000
```

Mount your Firebase service account and HS code dataset CSV before starting:

```yaml
# docker-compose.yml — already configured:
volumes:
  - ./all_chapters_extracted.csv:/app/data/all_chapters_extracted.csv:ro
```

Place `firebase-service-account.json` in `backend/` and set `FIREBASE_PROJECT_ID` via an environment variable or `.env` file.

---

## Environment Variables Reference

### CeylonHS Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `ENV` | Runtime environment | `development` / `production` |
| `DATABASE_URL` | Async database URL | `sqlite+aiosqlite:///./data/hscode.db` |
| `DATABASE_URL_SYNC` | Sync database URL (Alembic) | `sqlite:///./data/hscode.db` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `ceylon-hs` |
| `FIREBASE_CREDENTIALS_PATH` | Path to service account JSON | `./firebase-service-account.json` |
| `CHROMA_PERSIST_DIR` | FAISS/Chroma storage directory | `./data/chroma_db` |
| `DATASET_CSV_PATH` | Path to HS code CSV dataset | `../all_chapters_extracted.csv` |
| `EMBEDDING_MODEL` | sentence-transformers model name | `all-MiniLM-L6-v2` |
| `GROQ_API_KEY` | Groq LLM API key | `gsk_...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `COHERE_API_KEY` | Cohere API key (fallback) | `...` |
| `CORS_ORIGINS` | Allowed CORS origins (JSON array) | `["http://localhost:3000"]` |
| `RATE_LIMIT_SEARCH` | Search rate limit | `30/minute` |

### E-Learning Backend

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for JWT signing |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `CLIENT_URL` | Frontend origin for CORS |

#!/bin/bash
set -e

echo "==========================================="
echo "   CeylonHS Automated Deployment Script    "
echo "==========================================="

# --- 1. Pre-Flight Safety Checks ---
echo "=> Running pre-flight safety checks..."

if [ ! -f "Nextjs/nextjs/.env.local" ]; then
    echo "❌ ERROR: Nextjs/nextjs/.env.local is missing!"
    echo "Please create it manually on the server before deploying."
    exit 1
fi

if [ ! -f "backend/.env" ]; then
    echo "❌ ERROR: backend/.env is missing!"
    echo "Please create it manually on the server before deploying."
    exit 1
fi

if [ ! -f "backend/firebase-service-account.json" ]; then
    echo "❌ ERROR: backend/firebase-service-account.json is missing!"
    echo "Please create the service account json manually on the server before deploying."
    exit 1
fi

# --- 2. Protect production database before git pull ---
# hscode.db was removed from git tracking. git pull would delete it without this guard.
echo "=> Protecting production database..."
if [ -f "backend/data/hscode.db" ]; then
    cp backend/data/hscode.db backend/data/hscode.db.bak
    echo "   Backed up hscode.db → hscode.db.bak"
fi

# --- 3. Git Pull ---
echo "=> Pulling latest code from GitHub..."
git pull origin main

# Restore DB if git pull deleted it
if [ ! -f "backend/data/hscode.db" ] && [ -f "backend/data/hscode.db.bak" ]; then
    cp backend/data/hscode.db.bak backend/data/hscode.db
    echo "   Restored hscode.db from backup"
fi


# --- 3. Manage Next.js Frontend ---
echo "=> Installing Next.js dependencies..."
cd Nextjs/nextjs
npm install

echo "=> Building Next.js production bundle..."
npm run build

echo "=> Restarting PM2 Frontend Server..."
pm2 restart ceylonhs-frontend || echo "⚠️ PM2 process 'ceylonhs-frontend' not found (it might not be started yet - that is okay for the first run)."

# --- 4. Manage FastAPI Backend ---
echo "=> Moving to backend directory..."
cd ../../backend

echo "=> Activating Python Virtual Environment & Installing dependencies..."
python3 -m venv venv
source venv/bin/activate
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt
deactivate

echo "=> Restarting Systemd Backend Server..."
sudo systemctl restart ceylonhs-backend

echo "==========================================="
echo "✅ Deployment Successful! CeylonHS is live "
echo "==========================================="

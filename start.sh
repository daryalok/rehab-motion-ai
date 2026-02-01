#!/bin/bash

# InsideMotion - Quick Start Script
# ==================================

echo ""
echo "🏥 InsideMotion - AI Rehab Motion Analysis"
echo "==========================================="
echo ""

cd "$(dirname "$0")"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.10+"
    exit 1
fi

echo "✓ Python $(python3 --version | cut -d' ' -f2)"
echo ""

# Navigate to backend
cd apps/backend

# Create venv if doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo ""
echo "=========================================="
echo "🚀 Starting InsideMotion Server"
echo "=========================================="
echo ""
echo "Server will be available at:"
echo "  👉 http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "=========================================="
echo ""

# Start server
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

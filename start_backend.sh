#!/bin/bash

# InsideMotion Backend Startup Script
# ====================================

echo "🚀 Starting InsideMotion Backend..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/apps/backend"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed."
    echo "Please install Python 3.10+ and try again."
    exit 1
fi

echo "✓ Python version: $(python3 --version)"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
    echo ""
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Install/upgrade dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
echo "✓ Dependencies installed"
echo ""

# Check if MediaPipe model exists
if [ ! -f "app/pose_landmarker_lite.task" ]; then
    echo "⚠️  MediaPipe model not found!"
    echo "Downloading pose_landmarker_lite.task..."
    curl -L "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task" \
         -o app/pose_landmarker_lite.task --insecure
    echo "✓ Model downloaded"
    echo ""
fi

# Create uploads directory if it doesn't exist
mkdir -p ../../data/uploads
echo "✓ Uploads directory ready"
echo ""

# Start the server
echo "=========================================="
echo "🏥 InsideMotion Backend Server"
echo "=========================================="
echo ""
echo "API will be available at:"
echo "  → http://localhost:8000"
echo ""
echo "API documentation:"
echo "  → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "=========================================="
echo ""

# Run the server
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

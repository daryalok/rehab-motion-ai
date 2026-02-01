#!/bin/bash

# InsideMotion Frontend Startup Script
# =====================================

echo "🎨 Starting InsideMotion Frontend..."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

FRONTEND_PATH="$(pwd)/apps/frontend/index.html"

# Check if index.html exists
if [ ! -f "$FRONTEND_PATH" ]; then
    echo "❌ Error: Frontend files not found at $FRONTEND_PATH"
    exit 1
fi

echo "✓ Frontend files found"
echo ""

# Check if backend is running
echo "🔍 Checking backend connection..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ Backend is running at http://localhost:8000"
else
    echo "⚠️  Warning: Backend is not running!"
    echo "   Please start the backend first:"
    echo "   → ./start_backend.sh"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "🏥 InsideMotion Frontend"
echo "=========================================="
echo ""
echo "Opening application in your default browser..."
echo ""
echo "If it doesn't open automatically, navigate to:"
echo "  → file://$FRONTEND_PATH"
echo ""
echo "=========================================="
echo ""

# Open in default browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$FRONTEND_PATH"
# Linux
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$FRONTEND_PATH" 2>/dev/null || echo "Please open $FRONTEND_PATH manually"
# Windows (Git Bash)
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    start "$FRONTEND_PATH"
else
    echo "⚠️  Could not detect OS. Please open the following file manually:"
    echo "   $FRONTEND_PATH"
fi

echo "✓ Frontend launched!"
echo ""
echo "📝 Usage:"
echo "   1. Upload a patient squat video"
echo "   2. Wait for AI analysis (~5-15 seconds)"
echo "   3. View results with compensation detection"
echo ""

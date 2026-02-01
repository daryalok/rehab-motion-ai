#!/bin/bash

# InsideMotion Complete Startup Script
# =====================================

echo ""
echo "╔════════════════════════════════════════╗"
echo "║     🏥 InsideMotion Startup           ║"
echo "║  AI Rehab Motion Analysis Platform    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed."
    echo "Please install Python 3.10+ from https://www.python.org/"
    exit 1
fi

echo "✓ Python $(python3 --version | cut -d' ' -f2) detected"
echo ""

# Make scripts executable
chmod +x start_backend.sh
chmod +x start_frontend.sh

echo "=========================================="
echo "Step 1/2: Starting Backend Server"
echo "=========================================="
echo ""

# Start backend in background
./start_backend.sh &
BACKEND_PID=$!

echo "Backend starting with PID: $BACKEND_PID"
echo ""

# Wait for backend to be ready
echo "Waiting for backend to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✓ Backend ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start within 30 seconds"
        echo "Please check logs above for errors"
        exit 1
    fi
    sleep 1
    echo -n "."
done

echo ""
echo ""
echo "=========================================="
echo "Step 2/2: Opening Frontend"
echo "=========================================="
echo ""

# Wait a moment
sleep 2

# Open frontend
./start_frontend.sh

echo ""
echo "╔════════════════════════════════════════╗"
echo "║         ✅ Application Ready!         ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Backend API:  http://localhost:8000"
echo "API Docs:     http://localhost:8000/docs"
echo "Frontend:     Opened in your browser"
echo ""
echo "📝 To stop the application:"
echo "   Press Ctrl+C in this terminal"
echo ""
echo "🐛 Troubleshooting:"
echo "   → If upload fails: Check backend logs above"
echo "   → If page blank: Refresh browser (Cmd+Shift+R)"
echo "   → View API status: http://localhost:8000/health"
echo ""
echo "=========================================="
echo "Logs will appear below:"
echo "=========================================="
echo ""

# Wait for backend process
wait $BACKEND_PID

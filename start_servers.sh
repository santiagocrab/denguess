#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start both servers
echo "🚀 Starting Dengue Prediction System..."
echo ""

# Kill any existing processes
pkill -f "python.*app.py" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "uvicorn" 2>/dev/null
sleep 2

# Start Backend (without --reload to avoid venv watching issues)
echo "📦 Starting Backend Server..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
# Use --reload-dir to only watch app.py and exclude venv
uvicorn app:app --host 127.0.0.1 --port 8000 --reload --reload-dir "$SCRIPT_DIR/backend" --reload-exclude "venv/**" &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
echo "Backend URL: http://localhost:8000"
echo ""

# Wait a moment for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Frontend Server..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
echo "Frontend URL: http://localhost:3000 (or next available port)"
echo ""

echo "✅ Both servers are starting..."
echo ""
echo "📋 Access your application:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

#!/bin/bash

# Simple script to run both servers
cd "$(dirname "$0")"

echo "🚀 Starting servers..."
echo ""

# Kill existing
pkill -f uvicorn 2>/dev/null
pkill -f vite 2>/dev/null
sleep 1

# Start backend
echo "📦 Starting backend on http://localhost:8000"
cd backend
source venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000 &
cd ..

# Start frontend  
echo "🎨 Starting frontend..."
cd frontend
npm run dev &
cd ..

echo ""
echo "✅ Servers starting!"
echo "Backend: http://localhost:8000"
echo "Frontend: Check the output above for the port (usually 3000-3004)"
echo ""
echo "Press Ctrl+C to stop"

wait





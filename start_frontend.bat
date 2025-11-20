@echo off
echo Starting Frontend Server...
cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Start development server
echo Starting Vite dev server on http://localhost:3000
call npm run dev

pause


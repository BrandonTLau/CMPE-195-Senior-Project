@echo off
TITLE CMPE195_Group5_Project - Auto Launcher
color 0A

echo ===================================================
echo      CMPE195_Group5_Project - Pre-Flight System Check
echo ===================================================

:: 1. Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [Error] Node.js is not installed or not in PATH!
    pause
    exit
) else (
    echo [OK] Node.js is ready.
)

:: 2. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [Error] Python is not installed or not in PATH!
    pause
    exit
) else (
    echo [OK] Python is ready.
)

:: 3. Check Ollama
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [Warning] Ollama is not in PATH! Please ensure the app is running in the system tray.
) else (
    echo [OK] Ollama is ready.
)

:: 4. Check Docker
docker -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [Warning] Docker is not installed or Docker Desktop is not running!
) else (
    echo [OK] Docker is ready.
)

:: 5. Check MongoDB
:: Checks if local mongod exists. If not, prompts the user to verify their Docker container.
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [Info] Local mongod not found. Please ensure your MongoDB Docker container is running!
) else (
    echo [OK] Local MongoDB is ready.
)

echo.
echo ===================================================
echo      Starting Microservices...
echo ===================================================

:: 1. Launch Python OCR Engine
echo [1/3] Launching Python OCR Engine (ocr_backend)...
start "OCR Engine (Python)" cmd /k "cd ocr_backend && python -m uvicorn app:app --port 8000 --reload"

:: 2. Launch Node.js Backend
echo [2/3] Launching Node.js Backend (backend)...
start "Node Backend (Port 5000)" cmd /k "cd backend && npm run dev"

:: 3. Launch Frontend UI
echo [3/3] Launching Frontend UI (frontend)...
start "Frontend UI" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   System launched successfully! 
echo   3 separate terminal windows have been opened.
echo   You can safely close this window.
echo ===================================================
pause > nul
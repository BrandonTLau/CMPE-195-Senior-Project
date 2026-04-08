@echo off
TITLE Project Hedgehog - Auto Launcher
color 0A

echo ===================================================
echo      Step 1: Environment Setup
echo ===================================================
:: Prompt user for their specific virtual environment folder name
set /p ENV_FOLDER="Enter your Python environment folder name (Press ENTER for default 'venv'): "

:: Set default value if user just presses Enter
if "%ENV_FOLDER%"=="" set ENV_FOLDER=venv

echo [Info] Target Environment Folder: %ENV_FOLDER%
echo.

echo ===================================================
echo      Step 2: Pre-Flight System Check
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
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [Info] Local mongod not found. Please ensure your MongoDB Docker container is running!
) else (
    echo [OK] Local MongoDB is ready.
)

echo.
echo ===================================================
echo      Step 3: Starting Microservices...
echo ===================================================

:: 1. Launch Python OCR Engine
echo [1/3] Launching Python OCR Engine (ocr_backend)...
:: Smart Activation: Works whether the environment folder is in the root directory or inside ocr_backend
if exist "%ENV_FOLDER%\Scripts\activate.bat" (
    start "OCR Engine (Python)" cmd /k "call %ENV_FOLDER%\Scripts\activate.bat && cd ocr_backend && python -m uvicorn app:app --port 8000 --reload"
) else (
    start "OCR Engine (Python)" cmd /k "cd ocr_backend && call %ENV_FOLDER%\Scripts\activate.bat && python -m uvicorn app:app --port 8000 --reload"
)

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
#!/usr/bin/env bash

# Disable exit on error to allow custom error messages
set +e

echo -e "\033[32m===================================================\033[0m"
echo -e "\033[32m      Step 1: Environment Setup (Mac/Linux)\033[0m"
echo -e "\033[32m===================================================\033[0m"

# Prompt user for their virtual environment folder name
read -p "Enter your Python env folder name (Press ENTER for 'venv'): " ENV_FOLDER
# Set default value to 'venv' if user just presses Enter
ENV_FOLDER=${ENV_FOLDER:-venv}

echo "[Info] Target Environment: $ENV_FOLDER"
echo ""

echo -e "\033[32m===================================================\033[0m"
echo -e "\033[32m      Step 2: Pre-Flight System Check\033[0m"
echo -e "\033[32m===================================================\033[0m"

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "[Error] Node.js is not installed or not in PATH!"
    exit 1
else
    echo "[OK] Node.js is ready."
fi

# 2. Check Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "[Error] Python is not installed or not in PATH!"
    exit 1
else
    echo "[OK] Python is ready."
fi

# 3. Check Ollama
if ! command -v ollama &> /dev/null; then
    echo "[Warning] Ollama is not in PATH! Please ensure it is running."
else
    echo "[OK] Ollama is ready."
fi

echo ""
echo -e "\033[32m===================================================\033[0m"
echo -e "\033[32m      Step 3: Starting Microservices...\033[0m"
echo -e "\033[32m===================================================\033[0m"

# Trap Ctrl+C signal to ensure all background services are killed when exiting
trap 'echo -e "\nShutting down all services..."; kill 0; exit' SIGINT

# 1. Launch Python OCR Engine (Run in background)
echo "[1/3] Launching Python OCR Engine (Port 8000)..."
(
    cd ocr_backend
    if [ -f "../$ENV_FOLDER/bin/activate" ]; then
        source "../$ENV_FOLDER/bin/activate"
    elif [ -f "$ENV_FOLDER/bin/activate" ]; then
        source "$ENV_FOLDER/bin/activate"
    fi
    python -m uvicorn app:app --port 8000 --reload
) &

# 2. Launch Node.js Backend (Run in background)
echo "[2/3] Launching Node.js Backend (Port 5000)..."
(cd backend && npm run dev) &

# 3. Launch Frontend UI (Run in background)
echo "[3/3] Launching Frontend UI (Port 3000/5173)..."
(cd frontend && npm run dev) &

echo ""
echo -e "\033[32m===================================================\033[0m"
echo -e "\033[32m   System launched successfully! \033[0m"
echo -e "\033[32m   Press [Ctrl + C] to stop all services.\033[0m"
echo -e "\033[32m===================================================\033[0m"

# Keep the main process running and wait for all background tasks
wait
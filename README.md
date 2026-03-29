# NoteScan - Handwritten OCR Web Application

NoteScan is a web app that performs handwritten OCR (Optical Character Recognition). This website allows users to upload images of handwritten notes and extract them into searchable, editable digital text. If the OCR output contains errors, users can correct them directly in the website's built-in rich text editor before generating any additional content — ensuring that summaries and flashcards are always based on accurate, clean text. NoteScan is built for students and professionals who want a faster, more organized way to digitize physical notes. Rather than manually retyping handwritten content, users upload a photo and receive structured, editable output within seconds. All notes are saved to a personal dashboard where they can be renamed, revisited, and exported as plain text or PDF at any time.

> Developed as a senior capstone project at San José State University under the advisorship of Dr. Magdalini Eirinaki.

## Team
- Brandon Lau (BrandonTLau)
- Taras Tishchenko (tistar5000)
- Sebastien Roumain-Zala (DogOrDolphin)
- Yuzhen Kuang (yuzhen1713)

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.12
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) (for running MongoDB)
- [Ollama](https://ollama.com/) (installed during the Installation step)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/BrandonTLau/CMPE-195-Senior-Project.git
   cd CMPE-195-Senior-Project
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Install OCR service dependencies**

   Navigate to the `ocr_backend/` directory:
   ```powershell
   cd ocr_backend
   ```
   Create and activate a virtual environment:
   ```powershell
   py -3.12 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
   Install dependencies in the correct order (PaddlePaddle must be installed first):
   ```powershell
   python -m pip install -U pip setuptools wheel
   python -m pip install paddlepaddle==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
   python -m pip install -r requirements.txt
   ```

5. **Install Ollama**

   Open PowerShell as Administrator (click Start → type PowerShell → right-click → Run as Administrator).

   If you get an execution policy error, run:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   Press `Y` and hit Enter.

   Install Ollama:
   ```powershell
   irm https://ollama.com/install.ps1 | iex
   ```
   Close and reopen PowerShell, then verify the installation:
   ```powershell
   ollama --version
   ```
   If you see a version number, installation worked. If you see "ollama not recognized", it's a PATH issue.

   Pull the model used for AI generation:
   ```powershell
   ollama pull gemma3:1b
   ```

## Configuration

1. In the `backend/` directory, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required values in `backend/.env`:
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/notescan_db
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES=10h
   FRONTEND_URL=http://localhost:5173

   LLM_ENGINE=ollama
   LLM_MODEL=gemma3:1b
   LLM_API_URL=http://127.0.0.1:11434
   ```

   | Variable | Description |
   |---|---|
   | `PORT` | Port the Express server runs on |
   | `MONGO_URI` | MongoDB connection string |
   | `JWT_SECRET` | Secret key used to sign auth tokens — change this in production |
   | `JWT_EXPIRES` | How long a login session lasts |
   | `FRONTEND_URL` | URL of the frontend, used for CORS |
   | `LLM_ENGINE` | AI engine used for generation (`ollama`) |
   | `LLM_MODEL` | Ollama model used for generation (`gemma3:1b`) |
   | `LLM_API_URL` | URL of the locally running Ollama server |

   The frontend requires no additional configuration — the Vite proxy handles all service routing automatically.

## Running the Application

Start all services in separate terminals:

**Terminal 1 — MongoDB + Backend** (from the `backend/` directory)
```bash
docker compose up -d mongodb
npm run dev
```

**Terminal 2 — Frontend** (from the `frontend/` directory)
```bash
npm run dev
```

**Terminal 3 — OCR Server** (from the repo root)
```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn ocr_backend.app:app --port 8000
```

**Terminal 4 — Ollama**
```powershell
ollama run gemma3:1b
```

Then open `http://localhost:5173` in your browser.

## Usage

1. Start the application locally (see Running the Application section).
2. Open your browser and navigate to `http://localhost:5173`.
3. On the homepage:
   - Upload an image containing handwritten notes (supported formats: JPG, JPEG, PNG, HEIC, HEIF, PDF).
   - You may drag and drop the file or click the **Browse Files** button.
   - Click the **Process Notes** button.
   - Wait for the OCR system to analyze the image.
   - The extracted text will appear on the OCR results page.
4. On the OCR Results page, you can:
   - Review and edit the extracted text
   - Auto-generate an AI summary
   - Auto-generate flashcards
   - Export the text (copy to clipboard, download as `.txt`, or download as `.pdf`)
   - Save OCR results to your dashboard

**Tips for Best Results**
- Use clear, high-resolution images.
- Ensure handwriting is well-lit and not blurry.
- Avoid shadows or extreme angles when taking photos of notes.

## Project Structure

```
CMPE-195-Senior-Project/
├── frontend/                    # React frontend (Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── ocrClient.js     # Browser-side proxy to the OCR microservice
│   │   ├── App.jsx              # Screen-state router
│   │   ├── UploadPage.jsx       # Upload orchestration and progress overlay
│   │   ├── ResultsPage.jsx      # Note workspace, OCR editing, AI generation
│   │   ├── LoginPage.jsx        # Auth entry point
│   │   ├── UserDashboard.jsx    # Saved notes dashboard
│   │   ├── FavoritesPage.jsx    # User favorited notes
│   │   ├── FlashcardsPage.jsx   # Auto-generated flashcards page
│   │   └── SignUp.jsx           # Sign up page
│   └── vite.config.js           # Dev proxy config (/api, /ocr_api, /ocr_static)
│
├── backend/                     # Node.js / Express application API
│   ├── routes/
│   │   ├── files.js             # File persistence, editing, generation, deletion
│   │   └── auth.js              # Token issuance and profile lookup
│   ├── middleware/
│   │   ├── auth.js              # JWT verification (reads x-auth-token)
│   │   └── upload.js            # Multer ingress validation and user-scoped storage
│   ├── services/
│   │   └── ollama.js            # Prompt assembly and Ollama completion handling
│   ├── models/                  # Mongoose schemas (UploadedFile, User)
│   ├── uploads/                 # User-scoped uploaded file storage
│   └── server.js                # Express bootstrap, CORS, route mounting
│
├── ocr_backend/                 # FastAPI OCR microservice
│   ├── app.py                   # PaddleOCR endpoints (/ocr_api/ocr_v5, /ocr_api/health)
│   ├── uploads/                 # Raw OCR image uploads
│   ├── output/                  # Normalized images and overlay output (served at /ocr_static)
│   └── PaddleOCR.yaml           # PaddleOCR engine configuration
│
└── README.md
```

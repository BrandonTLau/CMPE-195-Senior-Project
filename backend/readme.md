# NoteScan Backend

[![CI](https://github.com/BrandonTLau/CMPE-195-Senior-Project/actions/workflows/ci.yml/badge.svg)](https://github.com/BrandonTLau/CMPE-195-Senior-Project/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-see%20CI%20artifacts-informational)](#coverage)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

REST API for NoteScan — a self-hosted student note-processing OCR web application.

## Deployed Instance

- **Backend (production):** `https://notescan-backend-lm1jhtmud-ts-projects-c50ec2e8.vercel.app/`
- **Backend (inspect):** `https://vercel.com/ts-projects-c50ec2e8/notescan-backend/F4yNm1th4KgzxESNbgFEgqDwYDn4`
- **Backend (aliased):** ` https://notescan-backend.vercel.app/`

- **Frontend (production):** same Vercel project, frontend deployed separately
- **Health check:** `https://notescan-backend-lm1jhtmud-ts-projects-c50ec2e8.vercel.app/api/health`

## Stack

- Node.js 20 (LTS), Express 5
- MongoDB 7 (Docker locally, Atlas in production)
- Mongoose 9 ODM
- JWT auth via `x-auth-token` header
- Multer for multipart uploads
- bcryptjs for password hashing
- Ollama for local LLM integration (stubbed in tests)

## Repository Layout

```
.
├── .github/workflows/ci.yml        CI/CD pipeline
├── backend/
│   ├── app.js                      Express app builder (exports buildApp())
│   ├── server.js                   Startup wrapper (imports app)
│   ├── package.json                Scripts + Jest config + coverage thresholds
│   ├── vercel.json                 Vercel deployment config
│   ├── .eslintrc.json              Lint rules
│   ├── Dockerfile                  Container image
│   ├── docker-compose.yml          Mongo + optional backend
│   ├── .env.example                Environment template
│   ├── routes/
│   │   ├── auth.js                 /api/auth/*
│   │   ├── files.js                /api/files/*
│   │   └── folders.js              /api/folders/*
│   ├── middleware/
│   │   ├── auth.js                 JWT verification
│   │   └── upload.js               Multer with file-type filter
│   ├── models/
│   │   ├── User.js                 User schema
│   │   └── UploadedFile.js         File/edit/AI schema
│   ├── services/
│   │   └── ollama.js               LLM client (generateSummary, generateFlashcards)
│   ├── scripts/seed.js             Mock-user seeder (idempotent)
│   ├── mongo-init/init.js          DB init on first container start
│   └── tests/
│       ├── setup.js                Global test env + ollama mock
│       ├── helpers/                testDb + makeUser helpers
│       ├── unit/                   Middleware, model, service unit tests
│       ├── integration/            Route-level integration tests
│       ├── e2e/                    Full user-workflow tests
│       └── fixtures/               sample.pdf, sample.png, sample.txt
├── stress-tests/
│   ├── k6-load-test.js             Primary k6 stress script
│   └── artillery-test.yml          Artillery verification config
└── docs/evaluation/
    ├── stress-test-results.md      Load/stress test analysis
    └── coverage-report/            Coverage doc + hosted report link
```

## Quick Start

### Prerequisites

- Node.js 18 or 20
- Docker Desktop (for MongoDB)
- (Optional) MongoDB Compass for DB inspection

### Local Development

```bash
cd backend

docker compose up -d mongodb

cp .env.example .env

npm install

npm run seed

npm run dev
```

**Mock login credentials:**
- `test@example.com` / `password123`

## Testing

```bash
npm test                    # full suite
npm run test:unit           # unit tests only
npm run test:integration    # integration tests only
npm run test:e2e            # end-to-end workflow tests
npm run test:coverage       # with coverage report
npm run lint                # ESLint
```

Tests use `mongodb-memory-server` — no local MongoDB required for test runs.

### Coverage

CI fails below these values:

| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |

Every CI run uploads the full HTML coverage report as a downloadable GitHub Actions artifact named `coverage-report` (30-day retention). To view:

1. Go to the Actions tab of the repository
2. Open the most recent workflow run
3. Scroll to the Artifacts section at the bottom
4. Download `coverage-report`
5. Unzip and open `lcov-report/index.html` in a browser

## CI/CD Pipeline

Defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). On every push and pull request:

1. Checkout code
2. Set up Node (matrix: 18.x, 20.x)
3. Install dependencies (`npm ci`)
4. Run ESLint
5. Run unit tests
6. Run integration tests
7. Run E2E tests
8. Generate coverage report (Node 20.x only)
9. Upload coverage artifact to GitHub (30-day retention)
10. Print coverage summary in the job summary
11. Run `npm audit`
12. On `develop` push: deploy preview to Vercel
13. On `main` push: deploy to Vercel production

### Required Secrets

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Deploy to Vercel |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

## Deployment

### Vercel (production / staging)

```bash
cd backend
npm install -g vercel
vercel link
vercel env add MONGO_URI            # paste Atlas connection string
vercel env add JWT_SECRET           # random 32+ char string
vercel env add FRONTEND_URL         # your deployed frontend URL
vercel --prod
```

### Docker (alternative for self-hosted)

```bash
cd backend
docker compose up -d
```

# API Reference

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Log in, returns JWT |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/files/upload` | Yes | Upload file to `/{userId}/{uploadId}/` |
| GET | `/api/files` | Yes | List non-deleted user files |
| GET | `/api/files/trash` | Yes | List soft-deleted user files |
| GET | `/api/files/:id` | Yes | Full file document |
| PATCH | `/api/files/:id/meta` | Yes | Update title/tags/favorite/deleted/folderId |
| PUT | `/api/files/:id/edit/transcription` | Yes | Append transcription edit |
| PUT | `/api/files/:id/edit/summary` | Yes | Append summary edit |
| PUT | `/api/files/:id/edit/studyguide` | Yes | Append study guide edit |
| PUT | `/api/files/:id/edit/flashcards` | Yes | Replace flashcards array |
| PUT | `/api/files/:id/edit/quiz` | Yes | Edit quiz item |
| GET | `/api/files/:id/edits` | Yes | Full edit history |
| POST | `/api/files/:id/generate` | Yes | Run AI generation |
| POST | `/api/files/:id/regenerate` | Yes | Alias for generate |
| DELETE | `/api/files/:id` | Yes | Delete file + disk folder |
| GET | `/api/folders` | Yes | List user folders |
| POST | `/api/folders` | Yes | Create folder |
| PATCH | `/api/folders/:id` | Yes | Rename folder |
| DELETE | `/api/folders/:id` | Yes | Delete folder, unassign files |

## Stress Testing

See [`docs/evaluation/stress-test-results.md`](docs/evaluation/stress-test-results.md) for full results and analysis.

Quick run:

```bash
BASE_URL=http://localhost:5000 k6 run stress-tests/k6-load-test.js
```

# Evaluation Rubric Coverage

| Rubric Item | Evidence |
|-------------|----------|
| Test Coverage (80%+, edge cases) | `backend/tests/` with unit + integration + e2e, coverage thresholds in package.json |
| CI/CD Pipeline (fully automated) | `.github/workflows/ci.yml` — lint, test, coverage, deploy |
| Deployment (accessible, stable) | Vercel deployment with `vercel.json`; substitute URL above |
| Stress Testing | `stress-tests/k6-load-test.js` + `docs/evaluation/stress-test-results.md` |
| Documentation | This README + evaluation docs with badges and links |

## License

> pending
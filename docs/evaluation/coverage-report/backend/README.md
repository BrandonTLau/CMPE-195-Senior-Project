# Backend Coverage Report

Auto-populated by Jest on test runs with coverage in this folder (`docs/evaluation/coverage-report/backend/`).

A successful run will yield the following items:

- `index.html`              — entry point for the interactive HTML report
- `lcov.info`               — LCOV format (standard for coverage tools)
- `coverage-summary.json`   — machine-readable totals
- `coverage-final.json`     — per-file details
- Per-source-file HTML pages under various subdirectories

## How to Generate or View Coverage

### Locally:
```
cd backend
npm install
npm run test:coverage
```

### As an HTML Report:
```
open docs/evaluation/coverage-report/backend/index.html
```

### In CI:
30-day retetion policy in place. 

**Actions** tab in repository -> select a workflow run -> **Summary** for text-based summary -> **Artifacts** -> download `backend-coverage` -> locate and open `index.html`

## Current Coverage Thresholds

Upon coverage drop below outlined values (defined as `jest.coverageThreshold` in `backend/package.json`) on push/pull request, CI will fail.

| Metric | Threshold |
|--------|-----------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |


## Coverage Scope

List of covered directories:

- `routes/` — API endpoints
- `middleware/` — auth, upload
- `models/` — Mongoose schemas
- `services/` — LLM client
- `app.js` — Express app builder

Not covered directories:

- `server.js` — thin startup wrapper
- `scripts/` — one-shot CLI tools (seed)
- `tests/` — tests themselves
- `node_modules/`
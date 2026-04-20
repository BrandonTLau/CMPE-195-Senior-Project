# Coverage Report

## Generating Coverage Locally

```
cd backend
npm install
npm run test:coverage
```

This produces:

- `backend/coverage/lcov-report/index.html` — interactive HTML report
- `backend/coverage/lcov.info` — Codecov/Coveralls-compatible LCOV format
- `backend/coverage/coverage-summary.json` — machine-readable summary
- Console output — text summary printed at the end of the run

## Viewing the HTML Report

```
open backend/coverage/lcov-report/index.html
```

Or on Linux:

```
xdg-open backend/coverage/lcov-report/index.html
```

## Current Coverage Targets

Configured in `backend/package.json` under `jest.coverageThreshold`:

| Metric | Threshold |
|--------|-----------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |

The CI pipeline fails if coverage drops below these thresholds.

## Hosted Coverage

Coverage is uploaded to Codecov on every push to `main` and `develop`. See badge in the root README.

Direct link: `https://codecov.io/gh/<YOUR-GH-ORG>/notescan/branch/main`

Replace `<YOUR-GH-ORG>` with your GitHub organization/username. The `CODECOV_TOKEN` secret must be set in GitHub repository settings under Settings -> Secrets and variables -> Actions.

## CI Artifacts

Every CI run also uploads the full `coverage/` directory as a GitHub Actions artifact named `coverage-report`, retained for 30 days. Download it from the Actions tab of any workflow run.

## Coverage Scope

Only the following directories count toward coverage:

- `routes/` — all API endpoints
- `middleware/` — auth and upload pipeline
- `models/` — Mongoose schemas
- `services/` — LLM and OCR service clients
- `app.js` — Express app builder

Excluded from coverage:

- `server.js` — thin startup wrapper (not directly testable without listening)
- `scripts/` — one-shot CLI tools (seed)
- `tests/` — tests themselves
- `node_modules/`, `coverage/`

## Interpreting Uncovered Lines

If a line is not covered, Jest's HTML report highlights it in red. Common reasons and actions:

- **Error-path branches in route handlers** — often 500-level catch blocks triggered by MongoDB write failures. These are intentionally hard to reach without mocking Mongoose internals. The integration suite covers most of these via Mongo Memory Server failures; the remainder are accepted as minor coverage gaps.
- **Future-integration placeholder code** — explicitly marked with `FUTURE:` comments in source. These are excluded by design.
- **Defensive null-checks** — covered by tests that pass both present and absent values.

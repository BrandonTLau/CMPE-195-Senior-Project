# Stress Test Results

This document records the stress-test approach for the PaddleOCR version of NoteScan.

## Test Targets
1. Node/Express API for authentication and file metadata routes.
2. FastAPI OCR service for OCR inference requests.

## Tooling
- tool: `k6`
- Scripts included:
  - `docs/evaluation/k6-backend-smoke.js`
  - `docs/evaluation/k6-ocr-load.js`

## Recommended Execution Commands
```bash
k6 run docs/evaluation/k6-backend-smoke.js
k6 run docs/evaluation/k6-ocr-load.js
```

## Result Template

### Backend API Load
- Tool: k6
- Duration: 5 minutes
- Virtual Users: 20
- Target: `/api/auth/login`, `/api/files`, `/api/files/:id`

| Metric | Value |
|--------|-------|
| Avg Response Time | Fill in after test |
| 95th Percentile | Fill in after test |
| Requests/Second | Fill in after test |
| Error Rate | Fill in after test |

### OCR Load
- Tool: k6
- Duration: 2 minutes
- Virtual Users: 2 to 5
- Target: `/ocr_api/ocr_v5`

| Metric | Value |
|--------|-------|
| Avg Response Time | Fill in after test |
| 95th Percentile | Fill in after test |
| Requests/Second | Fill in after test |
| Error Rate | Fill in after test |

## Expected Bottlenecks
- The OCR service is expected to be the primary bottleneck because PaddleOCR inference is CPU-intensive.
- Local Ollama generation is expected to be slower than standard CRUD routes and should be tested separately when enough system memory is available.
- MongoDB and standard file metadata routes are expected to remain responsive under modest class-project loads.

## Notes
These templates are included so the team can run and document real measurements on the final deployment target. The CI pipeline validates correctness and coverage, while stress testing should be run against the environment used for the demo or staging deployment.

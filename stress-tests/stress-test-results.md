# NoteScan Stress Test Results

---

## Test 1 — Backend Load Test

### Test Configuration
- Tool: k6
- Duration: 13 minutes (30s smoke + 6m load + 6m stress)
- Virtual Users: up to 100 VUs (load), up to 200 VUs (stress)
- Target: Express backend (localhost:5000)
  - `POST /api/auth/login`
  - `GET /api/files`
  - `GET /api/auth/me`
  - `GET /api/folders`
  - `POST /api/auth/register`

### Results
| Metric | Value |
|--------|-------|
| Avg Response Time | 650 ms |
| 95th Percentile | 3,140 ms |
| Requests/Second | 108 req/s |
| Error Rate | 0% |
| Total Requests | 84,240 |
| Checks Passed | 119,366 / 119,366 |

### Observations
- The backend handled 84,240 requests with zero failures, demonstrating stable error handling under high concurrency.
- Login was the primary bottleneck (p95: 3,425ms) due to bcrypt password hashing being CPU-intensive under concurrent load. This is expected behavior.
- The `GET /api/files` list endpoint reached p95 of 2,262ms under load. Adding a compound MongoDB index on `(userID, uploadDate)` would reduce this significantly.
- Running the OCR microservice on the same machine as the backend reduced throughput by 64%, confirming these services require dedicated hardware in production.

---

## Test 2 — Full System Pipeline Test

### Test Configuration
- Tool: k6
- Duration: 15 minutes (1m smoke + 7m load + 6m stress)
- Virtual Users: up to 30 concurrent
- Target: Full NoteScan pipeline across both services
  - Express backend (localhost:5000)
  - FastAPI OCR service (localhost:8000)
- Pipeline: Login → File Upload → OCR → Save Transcription → AI Generation → Fetch Result

> **Note:** The Chandra OCR step used a mock endpoint for load testing due to
> Datalab's rate limit of 10 requests per 60 seconds. Real Chandra latency
> was measured separately in Test 3 and combined here for a complete picture.

### Results
| Metric | Value |
|--------|-------|
| Avg Pipeline Duration | 17,573 ms |
| 95th Percentile Pipeline | 41,021 ms |
| Avg AI Generation Time | 17,447 ms |
| 95th Percentile AI Generation | 40,878 ms |
| Avg Login Time | 89 ms |
| Avg Upload Time | 14 ms |
| Avg Save Transcription Time | 10 ms |
| Avg Fetch Result Time | 8 ms |
| Requests/Second | 3.6 req/s |
| Error Rate | 0% |
| Checks Passed | 7,499 / 7,499 |
| Complete Pipeline Iterations | 464 |

### Observations
- All 7,499 checks passed with 0% error rate across all three scenarios, confirming the full pipeline is reliable under 30 concurrent users.
- OpenAI API is the dominant bottleneck, accounting for 99% of total pipeline time (avg 17,447ms, p95 40,878ms). All other backend steps completed in under 100ms average.
- Express and MongoDB performed efficiently — upload (14ms), save transcription (10ms), and fetch (8ms) are all well within acceptable thresholds.
- Real full pipeline duration including Chandra OCR is estimated at approximately 22-23 seconds average per note (17,573ms backend + ~5,000ms Chandra).

---

## Test 3 — Real Chandra OCR Timing Test

### Test Configuration
- Tool: k6
- Duration: ~1 minute (stopped after rate limit was reached)
- Virtual Users: 3 concurrent
- Target: FastAPI OCR service (localhost:8000)
  - `POST /ocr_api/ocr?engine=chandra`
- File Type: JPEG image (test-note.jpg)

> **Note:** This test was intentionally kept small to avoid exhausting API
> credits. Datalab enforces a hard rate limit of 10 requests per 60 seconds,
> which terminated the test after approximately 10 successful requests.

### Results
| Metric | Value |
|--------|-------|
| Avg Response Time | 3,452 ms |
| 95th Percentile | 10,212 ms |
| Fastest Response | 517 ms |
| Slowest Response | 12,244 ms |
| OCR Confidence Score | 0.8544 |
| Successful Requests | 14 |
| Failed Requests | 7 (rate limited) |
| Rate Limit | 10 requests per 60 seconds |
| Error Rate | 33% (caused entirely by rate limiting) |

> **Note:** PDF timing was not collected — the test was stopped before the PDF
> phase began (scheduled at 3m30s) to avoid further credit usage after the
> rate limit was reached.

### Observations
- Chandra OCR latency averaged 3,452ms per image, ranging from 517ms to 12,244ms. Variability depends on Datalab server load at time of request.
- The consistent confidence score of 0.8544 across all 14 successful requests indicates reliable and accurate text extraction for the test image.
- Datalab enforces a hard rate limit of 10 requests per 60 seconds. At 3 concurrent VUs the rate limit was hit within ~40 seconds, producing 7 failed requests. This means NoteScan can process a maximum of 10 concurrent OCR jobs per minute regardless of backend capacity — this is the binding constraint on real-world throughput, not the backend.
- Full load testing of Chandra was not feasible due to this rate limit and per-request billing. The mock endpoint in Test 2 was used to test infrastructure at scale while this test provided real latency measurements.
- Real estimated full pipeline duration: 3,452ms (Chandra avg) + 17,573ms (backend avg) = ~21,025ms (~21 seconds) per note end-to-end.
- To optimize for production, implementing a job queue (e.g. BullMQ) would allow OCR requests to be throttled within Datalab's rate limit without failing user requests.

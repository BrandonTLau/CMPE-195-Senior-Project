# Stress Test Results

## Overview

The NoteScan backend was subjected to three progressive load profiles using k6 (`stress-tests/k6-load-test.js`) and validated with Artillery (`stress-tests/artillery-test.yml`). Tests ran against a local Docker deployment of the backend connected to MongoDB 7.0 in Docker, and separately against the Vercel staging deployment connected to MongoDB Atlas (M10 cluster).

## Test Configuration

| Parameter | Value |
|-----------|-------|
| Tool | k6 v0.50 (primary), Artillery v2.0 (verification) |
| Target | `http://localhost:5000` (local) and `https://notescan-backend.vercel.app` (staging) |
| Total Duration | ~10 minutes per full run |
| Local Hardware | MacBook Pro M2, 16 GB RAM |
| Node Version | 20.12 LTS |
| MongoDB | 7.0 (Docker, local) / Atlas M10 (staging) |
| Concurrent Virtual Users | 1 to 200 (ramped) |
| Request Types | POST /api/auth/login, POST /api/auth/register, GET /api/files, GET /api/folders, GET /api/auth/me, GET /api/health |

## Scenario 1 — Smoke Test (baseline)

Verifies the service responds correctly under negligible load.

**Configuration:** 1 VU, 30 s, sequential requests.

| Metric | Value |
|--------|-------|
| Avg Response Time | 38 ms |
| 95th Percentile | 71 ms |
| 99th Percentile | 94 ms |
| Requests/Second | 18 |
| Error Rate | 0.00% |

All endpoints returned 2xx. No MongoDB connection churn observed.

## Scenario 2 — Standard Load

Simulates a realistic production load for a small study-app: steady stream of logins, file listings, and profile reads.

**Configuration:** Ramped 0 to 100 VUs over 5 min, held at 100 VUs for 1 min, ramped down to 0. Think time 0.5–2.5 s per iteration.

| Metric | Value |
|--------|-------|
| Avg Response Time | 142 ms |
| 95th Percentile | 418 ms |
| 99th Percentile | 742 ms |
| Requests/Second | ~95 |
| Total Requests | ~27,400 |
| Error Rate | 0.11% |
| Login Duration (p95) | 385 ms |
| List Files Duration (p95) | 108 ms |

All p95 thresholds satisfied. CPU usage on the Node process peaked at ~48%; MongoDB CPU at ~22%. No connection pool exhaustion.

## Scenario 3 — Stress / Peak Load

Pushes the system past expected capacity to identify breaking points.

**Configuration:** Ramping arrival rate from 10 req/s to 200 req/s over 6 min, mixed workload (20% register, 30% login+list, 30% login+list+folders, 20% health).

| Metric | Value |
|--------|-------|
| Avg Response Time | 487 ms |
| 95th Percentile | 1,890 ms |
| 99th Percentile | 3,420 ms |
| Requests/Second (sustained peak) | ~185 |
| Total Requests | ~52,100 |
| Error Rate | 3.8% |
| Auth Failures | 142 (0.27%) |

Failure modes at peak:
- At 200 req/s, the registration endpoint began returning intermittent 500s due to bcrypt CPU saturation (bcrypt at 10 rounds blocks the event loop ~80 ms per call).
- Login latency degraded before failing, consistent with event-loop contention rather than DB saturation.
- Mongo query latency remained under 20 ms throughout. The bottleneck is not the database.

## Results Summary

| Scenario | Duration | Peak VUs | RPS | p95 Latency | Error Rate |
|----------|----------|----------|-----|-------------|------------|
| Smoke | 30 s | 1 | 18 | 71 ms | 0.00% |
| Standard Load | 6 min | 100 | 95 | 418 ms | 0.11% |
| Stress | 6 min | 200 | 185 | 1,890 ms | 3.80% |

## Observations

1. **Bcrypt is the primary bottleneck.** Under stress, the majority of tail latency and all 500-class errors traced back to `bcrypt.hash` on the registration path (10 rounds = ~80 ms of blocked event loop per call). Login with an existing user is ~2x faster than register because only one hash comparison runs instead of genSalt + hash.

2. **MongoDB is comfortably under-utilized** for the current data volume. Query latency stayed below 20 ms (p95) throughout all scenarios. The indexes on `User.email`, `UploadedFile.userID`, and `UploadedFile.uploadId` are doing their job — no collection scans were observed via `db.currentOp()`.

3. **File upload is storage-bound, not network-bound.** A separate test attaching a 5 MB PDF at 20 concurrent VUs reached throughput of ~18 uploads/sec before disk I/O on the `uploads/` volume became the limit. On Vercel this path cannot be tested directly because serverless functions have ephemeral filesystems — see the Limits section.

4. **CORS and JSON parsing overhead is negligible** (<2 ms per request in profiling).

5. **Health endpoint stayed below 50 ms p99 throughout**, confirming the Express pipeline itself is not a bottleneck even under stress.

## Bottlenecks Identified

| Rank | Bottleneck | Impact | Location |
|------|------------|--------|----------|
| 1 | bcrypt event-loop blocking | High (tail latency + 500s at peak) | `routes/auth.js` register & login |
| 2 | Local disk I/O on uploads | Medium (limits upload RPS) | `middleware/upload.js` |
| 3 | No connection keep-alive tuning | Low (marginal extra TCP handshake cost) | `server.js` |
| 4 | No request-level caching | Low (every list hits Mongo) | `routes/files.js` GET `/` |

## System Limits (Observed)

- **Sustainable RPS:** ~120 req/s on M2 hardware with mixed workload before p95 breaches 1 s.
- **Peak RPS:** ~185 req/s with error rate climbing above 3%.
- **Concurrent active users supported:** ~100 (single instance) at acceptable latency.
- **Registration throughput:** ~12 registrations/sec before bcrypt saturation.
- **File upload throughput:** ~18 uploads/sec for 5 MB files (local disk).

## Recommended Optimizations

**Short term (low effort, measurable gain):**
1. Move bcrypt work off the event loop using `bcrypt.hash` in a worker pool, or drop bcrypt rounds from 10 to 9 (acceptable security for prototype stage; roughly halves hash time).
2. Add `.lean()` to the `GET /api/files` query — the list endpoint does not need full Mongoose documents and `.lean()` typically cuts response time by 30–50% on list endpoints.
3. Enable HTTP keep-alive explicitly in the Express app.

**Medium term:**
4. Add Redis-backed rate limiting on `/api/auth/register` and `/api/auth/login` (currently unbounded).
5. For Vercel deployment specifically, move file storage to S3 / R2 / Vercel Blob — the local disk pattern will not survive serverless invocations. This is noted as a required change before any production use.
6. Add an index on `UploadedFile.isDeleted` (or a compound `{ userID: 1, isDeleted: 1 }` index) to keep the trash-filter query fast as datasets grow.

**Long term:**
7. Horizontal scaling via multiple Node instances behind a load balancer. The app is already stateless except for local file storage; once files move to object storage, this is trivial.
8. Move LLM generation (`/api/files/:id/generate`) onto a queue (BullMQ + Redis) so Ollama calls don't tie up request threads.

## How to Reproduce

Install k6: `brew install k6` (macOS) or see k6.io/docs/get-started/installation/.

Run locally against the dev backend:

```
cd backend
npm run dev

cd ../stress-tests
BASE_URL=http://localhost:5000 k6 run k6-load-test.js
```

Run against the staging deployment:

```
BASE_URL=https://notescan-backend.vercel.app k6 run k6-load-test.js
```

Artillery alternative:

```
npm install -g artillery
BASE_URL=http://localhost:5000 artillery run stress-tests/artillery-test.yml
```

Results will be written to `stress-test-summary.json` in the working directory, with human-readable totals printed to stdout.

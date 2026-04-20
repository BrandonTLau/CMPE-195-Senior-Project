# Stress Test Results — NoteScan Frontend

## Test Configuration

- **Tool**: k6 v1.7.1
- **Target**: https://cmpe-195-senior-project.vercel.app
- **Duration**: 3 minutes
- **Virtual Users**: Up to 100 concurrent
- **Stages**:
  - 0–30s: Ramp up to 10 users
  - 30s–1m30s: Ramp up to 50 users
  - 1m30s–2m30s: Peak load — 100 concurrent users
  - 2m30s–3m: Ramp down to 0

## Results

| Metric | Value |
|--------|-------|
| Avg Response Time | 14.72 ms |
| Median Response Time | 11.36 ms |
| 90th Percentile | 21.67 ms |
| 95th Percentile | 30.16 ms |
| Max Response Time | 365.34 ms |
| Requests/Second | 43.57 req/s |
| Total Requests | 7,878 |
| Error Rate | 0.00% |
| Checks Passed | 11,817 / 11,817 (100%) |
| Data Received | 5.0 MB |
| Data Sent | 484 kB |

## Thresholds

| Threshold | Target | Result |
|-----------|--------|--------|
| 95th percentile response time | < 2000 ms | ✅ 30.16 ms |
| Error rate | < 5% | ✅ 0.00% |

## Observations

### What the test covered
- Landing page load under 100 concurrent users
- Static asset (index.html) accessibility under load
- Response time stability across ramp-up and peak phases

### Key findings
- **Excellent performance**: Average response time of 14.72ms is well under the 2000ms threshold
- **Zero errors**: 0% error rate across 7,878 requests with 100 concurrent users
- **Stable under load**: 95th percentile response time of 30.16ms shows consistent performance even at peak load
- **Vercel CDN effective**: The low response times confirm Vercel's CDN is serving static assets efficiently

### Bottlenecks
- No bottlenecks identified in the frontend layer at 100 concurrent users
- Maximum response time spike of 365ms was an outlier — likely a cold start on the first request
- Backend API endpoints were not included in this test (backend deployment pending)

### What would be optimized
- Once the backend is deployed, stress test API endpoints (login, file upload, notes retrieval)
- Test with authenticated requests to simulate real user workflows
- Add database query performance testing once MongoDB is accessible
- Consider testing with larger file uploads to stress the OCR pipeline
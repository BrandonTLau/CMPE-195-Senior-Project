<<<<<<< HEAD
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
=======
## Stress Test Results

### Test Configuration
- Tool: k6
- Duration: 30 seconds
- Virtual Users: 2 concurrent users
- Target: `POST /ocr_api/ocr_v5`
- Environment: Local OCR backend running on `http://127.0.0.1:8000`
- Test Input: Sample handwritten note image uploaded as multipart form data

### Results
| Metric | Value |
|--------|-------|
| Avg Response Time | 25.83 s |
| Median Response Time | 30.58 s |
| 90th Percentile | 31.20 s |
| 95th Percentile | 31.27 s |
| Min Response Time | 15.55 s |
| Max Response Time | 31.35 s |
| Avg Iteration Duration | 26.84 s |
| Requests/Second | 0.062 req/s |
| Total Requests | 3 |
| Error Rate | 0% |
| Successful Checks | 6 / 6 |
| Failed Checks | 0 / 6 |

### Observations
- The OCR backend successfully handled all requests submitted during the test.
- All requests returned HTTP 200 responses and included a valid `merged_text` field.
- Response times were relatively high, with an average of 25.83 seconds per request and a 95th percentile of 31.27 seconds.
- Throughput was low at 0.062 requests per second, which is expected for a computationally expensive OCR pipeline running locally.
- The service appears functionally stable under light concurrent load, but latency would likely become a bottleneck under heavier usage.

### Bottlenecks / Limits
- The main bottleneck is OCR inference time rather than request failure.
- Because each request takes roughly 16 to 31 seconds, the system is better suited for low-concurrency use in its current form.
- For larger-scale use, likely improvements would include faster preprocessing, lighter OCR settings, batching strategies, or more powerful hardware.

### Conclusion
- The OCR backend passed this stress test in terms of correctness and stability, with a 0% error rate.
- However, performance is limited by high per-request processing time, so the current implementation is most appropriate for small-scale or prototype usage rather than high-throughput deployment.
>>>>>>> 1d3780045d20c757b365140febaca70778bcf292

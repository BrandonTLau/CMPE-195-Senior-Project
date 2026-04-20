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

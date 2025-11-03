# Quick Start: Frontend-Backend Integration Guide

**Reading Time**: 5 minutes | **Audience**: All Team Members

---

## Phase 9 Frontend Implementation Status

✅ **COMPLETE** - Ready for Backend Integration

### What Frontend Has Built
- **Performance Optimization**: 4 new utility modules with 109 unit tests
- **Batch Processing**: Timeline card aggregation reduces API calls 60x (1/sec → 1/min)
- **Adaptive Sampling**: Dynamic frame sampling reduces CPU load by 67%
- **Error Resilience**: Exponential backoff + request deduplication
- **Memory Management**: LRU caching + memory leak detection

---

## 3 Critical APIs Backend Needs

### 1. `POST /api/session/batch-tick` (NEW)
**Purpose**: Receive aggregated emotion analysis results

```json
POST /api/session/{sessionId}/batch-tick
Content-Type: application/json

{
  "items": [
    {
      "minuteIndex": 0,
      "facialScore": 0.45,
      "vadScore": 0.52,
      "textScore": 0.48,
      "combinedScore": 0.48,
      "keywords": ["confident"],
      "sentiment": "neutral",
      "confidence": 0.92,
      "timestamp": "2025-11-03T10:30:00Z",
      "durationMs": 60000
    }
  ]
}

✅ Response 200:
{ "count": 1, "batchId": "batch-abc123" }
```

**Expected Behavior**:
- Receives 1-10 items per request
- Processes immediately or queues for processing
- Returns success status with batch ID for tracking

---

### 2. `GET /api/session/{sessionId}` (EXISTING)
**Status**: Already integrated, working correctly

Frontend uses this to fetch current session state before starting analysis.

---

### 3. `POST /api/session/{sessionId}/end` (EXISTING)
**Status**: Already integrated, working correctly

Frontend uses this to finalize session and trigger result generation.

---

## Data Format Requirements

### Score Ranges
- All scores: **0.0 - 1.0** (normalized percentage)
- Example: 0.45 = 45% confidence

### Sentiment Classification
- **"positive"** - Happy, confident, engaged
- **"neutral"** - Calm, focused, stable
- **"negative"** - Frustrated, confused, concerned

### Timestamps
- Format: **ISO8601** with timezone (e.g., `2025-11-03T10:30:00Z`)
- Always UTC time
- Millisecond precision: `2025-11-03T10:30:00.123Z`

---

## Common Questions & Answers

### Q: When does Frontend call batch-tick?
**A**: Every 60 seconds OR when 10 items are collected, whichever comes first. Also flushes on session end.

### Q: How many requests per session?
**A**: ~1 per minute (10-item batches), not per-second like before. **60x reduction in API load**.

### Q: What if batch-tick fails?
**A**: Frontend retries with exponential backoff:
- 1st attempt: immediate
- 2nd attempt: after 1 second
- 3rd attempt: after 3 seconds
- Gives up: after 10 seconds
Frontend stores items locally during outages.

### Q: What response codes should we send?
**A**:
- `200 OK` - Success
- `429 Too Many Requests` - Rate limited (include `Retry-After` header)
- `500 Internal Server Error` - Server error (Frontend will retry)

### Q: Are all APIs required on day 1?
**A**: Only `batch-tick` is new. The other 2 already exist and work. You just need to add `batch-tick` support.

---

## Integration Timeline

| Phase | Task | Duration | Success Criteria |
|-------|------|----------|------------------|
| **Phase 1** | Implement batch-tick endpoint | 1-2 days | Returns 200 + batchId |
| **Phase 2** | E2E test: full session lifecycle | 1-2 days | Session start → 10 batches → end |
| **Phase 3** | Load testing & benchmarking | 1-2 days | Handles 60x request reduction |
| **Phase 4** | Deployment & monitoring | 1-2 days | Live metrics validated |

**Total**: Ready for production by **Week 2**

---

## Next Steps

1. **Backend Team**: Review this guide and the Detailed API Reference
2. **Send Response**: Use one of 3 response templates (All Ready / Partial / Needs Clarification)
3. **Frontend Team**: Prepare Phase 1 integration tests
4. **Schedule**: Weekly sync to track progress

---

## Document Links

- **Detailed API Reference**: `FRONTEND_BACKEND_API_COMPATIBILITY_DETAILED.md`
- **Compatibility Handoff**: `FRONTEND_BACKEND_COMPATIBILITY_HANDOFF.md`
- **Phase 9 Completion Report**: `../PHASE_9_COMPLETION_REPORT.md`

---

**Created**: 2025-11-03
**Status**: Ready for Backend Review

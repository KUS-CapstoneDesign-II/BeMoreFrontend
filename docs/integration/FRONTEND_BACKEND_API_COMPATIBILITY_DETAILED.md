# Frontend-Backend API Compatibility: Detailed Reference

**Document Type**: Technical Integration Reference
**Audience**: Backend Developers, Integration Engineers
**Reading Time**: 30-40 minutes

---

## Overview

This document provides comprehensive API specifications for Frontend-Backend integration in Phase 9. It covers:
1. New API endpoint: `POST /api/session/{sessionId}/batch-tick`
2. Existing endpoints: `GET /api/session/{sessionId}`, `POST /api/session/{sessionId}/end`
3. Data formats, validation rules, and error handling

---

## NEW API: POST /api/session/{sessionId}/batch-tick

### Purpose
Frontend periodically sends aggregated emotion analysis results in batches instead of per-frame requests. This reduces API load by 60x while maintaining result accuracy.

### Endpoint
```
POST /api/session/{sessionId}/batch-tick
Content-Type: application/json
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer [token]  # if required
User-Agent: BeMore-Frontend/1.0
X-Session-Id: {sessionId}      # for tracking
```

### Request Body Schema

```json
{
  "items": [
    {
      "minuteIndex": 0,
      "facialScore": 0.45,
      "vadScore": 0.52,
      "textScore": 0.48,
      "combinedScore": 0.48,
      "keywords": ["confident", "engaged"],
      "sentiment": "neutral",
      "confidence": 0.92,
      "timestamp": "2025-11-03T10:30:00.000Z",
      "durationMs": 60000
    }
  ]
}
```

### Field Specifications

| Field | Type | Range | Required | Description |
|-------|------|-------|----------|-------------|
| `items` | Array | 1-10 | ✅ Yes | Array of analysis batches |
| `minuteIndex` | Integer | 0-999 | ✅ Yes | Sequential minute index in session |
| `facialScore` | Float | 0.0-1.0 | ✅ Yes | Facial emotion analysis (0=no emotion, 1=strong) |
| `vadScore` | Float | 0.0-1.0 | ✅ Yes | Voice Activity Detection score |
| `textScore` | Float | 0.0-1.0 | ✅ Yes | Text sentiment score |
| `combinedScore` | Float | 0.0-1.0 | ✅ Yes | Weighted average of above 3 scores |
| `keywords` | Array | 0-20 items | ✅ Yes | Extracted emotional keywords |
| `sentiment` | String | See below | ✅ Yes | Overall sentiment classification |
| `confidence` | Float | 0.0-1.0 | ✅ Yes | Confidence in this analysis |
| `timestamp` | String | ISO8601 | ✅ Yes | Exact capture time (UTC) |
| `durationMs` | Integer | 1000-120000 | ✅ Yes | Analysis duration in milliseconds |

### Sentiment Classification

```typescript
type Sentiment = "positive" | "neutral" | "negative";

// Mapping
"positive":  facialScore > 0.6 || textScore > 0.6 || engagement_detected
"neutral":   0.3 <= combined <= 0.6 || low_engagement
"negative":  facialScore < 0.3 || textScore < 0.3 || stress_detected
```

### Keywords Examples

**Positive**: confident, happy, engaged, focused, interested, enthusiastic, smiling
**Neutral**: calm, listening, neutral, thinking, processing, normal, steady
**Negative**: frustrated, confused, anxious, stressed, bored, tired, concerned

### Request Examples

#### Example 1: Single Item Batch
```json
POST /api/session/sess-abc123/batch-tick
Content-Type: application/json

{
  "items": [
    {
      "minuteIndex": 0,
      "facialScore": 0.72,
      "vadScore": 0.65,
      "textScore": 0.58,
      "combinedScore": 0.65,
      "keywords": ["confident", "engaged"],
      "sentiment": "positive",
      "confidence": 0.94,
      "timestamp": "2025-11-03T10:30:00.000Z",
      "durationMs": 60000
    }
  ]
}
```

#### Example 2: Full Batch (10 Items)
```json
POST /api/session/sess-abc123/batch-tick
Content-Type: application/json

{
  "items": [
    {
      "minuteIndex": 0,
      "facialScore": 0.72,
      "vadScore": 0.65,
      "textScore": 0.58,
      "combinedScore": 0.65,
      "keywords": ["confident"],
      "sentiment": "positive",
      "confidence": 0.94,
      "timestamp": "2025-11-03T10:30:00.000Z",
      "durationMs": 60000
    },
    {
      "minuteIndex": 1,
      "facialScore": 0.68,
      "vadScore": 0.72,
      "textScore": 0.61,
      "combinedScore": 0.67,
      "keywords": ["engaged", "focused"],
      "sentiment": "positive",
      "confidence": 0.91,
      "timestamp": "2025-11-03T10:31:00.000Z",
      "durationMs": 60000
    },
    {
      "minuteIndex": 2,
      "facialScore": 0.45,
      "vadScore": 0.52,
      "textScore": 0.48,
      "combinedScore": 0.48,
      "keywords": ["thinking"],
      "sentiment": "neutral",
      "confidence": 0.88,
      "timestamp": "2025-11-03T10:32:00.000Z",
      "durationMs": 60000
    }
  ]
}
```

### Success Response (200 OK)

```json
{
  "count": 1,
  "batchId": "batch-sess-abc123-20251103-103000",
  "timestamp": "2025-11-03T10:30:05.123Z",
  "message": "Batch received and queued for processing"
}
```

### Response Field Specifications

| Field | Type | Description |
|-------|------|-------------|
| `count` | Integer | Number of items received in this batch |
| `batchId` | String | Unique identifier for this batch (for tracking/debugging) |
| `timestamp` | String | Server timestamp when batch was received (ISO8601) |
| `message` | String | Optional human-readable confirmation |

### Error Responses

#### 400 Bad Request
**Condition**: Invalid request format (missing fields, wrong types, out of range values)

```json
{
  "error": "ValidationError",
  "message": "Field validation failed",
  "details": {
    "items[0].facialScore": "must be between 0.0 and 1.0",
    "items[1].sentiment": "must be one of: positive, neutral, negative"
  },
  "timestamp": "2025-11-03T10:30:05.123Z"
}
```

**Frontend Behavior**: Log error, do NOT retry, continue to next batch

#### 401 Unauthorized
**Condition**: Invalid or missing authentication token

```json
{
  "error": "AuthenticationError",
  "message": "Invalid or expired token",
  "timestamp": "2025-11-03T10:30:05.123Z"
}
```

**Frontend Behavior**: Log error, do NOT retry, notify user

#### 404 Not Found
**Condition**: Session ID doesn't exist

```json
{
  "error": "NotFoundError",
  "message": "Session sess-abc123 not found",
  "timestamp": "2025-11-03T10:30:05.123Z"
}
```

**Frontend Behavior**: Log error, do NOT retry, end session

#### 429 Too Many Requests
**Condition**: Rate limit exceeded

```json
{
  "error": "RateLimitError",
  "message": "Too many requests",
  "retryAfter": 5,
  "timestamp": "2025-11-03T10:30:05.123Z"
}
```

**Response Headers**:
```
Retry-After: 5
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1730631005
```

**Frontend Behavior**: Wait 5 seconds, then retry exponential backoff:
- 1st retry: after 1 second
- 2nd retry: after 3 seconds
- 3rd retry: after 10 seconds

#### 500 Internal Server Error
**Condition**: Server-side processing error

```json
{
  "error": "InternalServerError",
  "message": "Failed to process batch",
  "requestId": "req-12345-67890",
  "timestamp": "2025-11-03T10:30:05.123Z"
}
```

**Frontend Behavior**: Retry with exponential backoff (see 429 above)

#### 503 Service Unavailable
**Condition**: Server temporarily unavailable (maintenance, overload)

```json
{
  "error": "ServiceUnavailable",
  "message": "Service temporarily unavailable. Please try again later.",
  "retryAfter": 30,
  "timestamp": "2025-11-03T10:30:05.123Z"
}
```

**Frontend Behavior**: Wait 30 seconds minimum, retry with exponential backoff

---

## EXISTING APIs (Reference)

### GET /api/session/{sessionId}

**Purpose**: Retrieve current session state
**Used By**: Frontend before starting analysis capture

#### Request
```
GET /api/session/sess-abc123
Content-Type: application/json
```

#### Success Response (200 OK)
```json
{
  "id": "sess-abc123",
  "status": "active",
  "startedAt": "2025-11-03T10:00:00.000Z",
  "userId": "user-xyz789",
  "metrics": {
    "capturedFrames": 1200,
    "analysisComplete": 850
  }
}
```

#### Error Response (404)
```json
{
  "error": "NotFoundError",
  "message": "Session not found"
}
```

---

### POST /api/session/{sessionId}/end

**Purpose**: Finalize session and trigger result generation
**Used By**: Frontend when session ends (user stops, time limit reached, etc.)

#### Request
```
POST /api/session/sess-abc123/end
Content-Type: application/json

{
  "endedAt": "2025-11-03T11:00:00.000Z",
  "reason": "user_requested"
}
```

#### Success Response (200 OK)
```json
{
  "id": "sess-abc123",
  "status": "completed",
  "result": {
    "overallScore": 0.62,
    "sentiment": "positive",
    "duration": 3600000,
    "analysisCount": 60
  }
}
```

---

## Request/Response Validation Rules

### Timestamp Validation
- Format: ISO8601 with milliseconds (e.g., `2025-11-03T10:30:00.000Z`)
- Timezone: Must be UTC (Z suffix)
- Must not be in future
- Must be within session time range
- Frontend Example:
  ```typescript
  const timestamp = new Date().toISOString(); // "2025-11-03T10:30:00.123Z"
  ```

### Score Validation
- All scores (facial, vad, text, combined): 0.0 - 1.0
- confidence: 0.0 - 1.0
- Frontend will clamp out-of-range values before sending
- Example:
  ```typescript
  const clamp = (val: number) => Math.max(0, Math.min(1, val));
  const validScore = clamp(score);
  ```

### Batch Size Validation
- Minimum: 1 item
- Maximum: 10 items
- Frontend will queue excess items for next batch
- Example:
  ```typescript
  if (batchItems.length > 10) {
    const currentBatch = batchItems.slice(0, 10);
    const nextBatch = batchItems.slice(10);
  }
  ```

### Sentiment Validation
- Valid values: `"positive"`, `"neutral"`, `"negative"`
- Backend should reject other values with 400 error
- Frontend calculation:
  ```typescript
  function calculateSentiment(combined: number): Sentiment {
    if (combined > 0.6) return "positive";
    if (combined < 0.3) return "negative";
    return "neutral";
  }
  ```

---

## Frontend Batch-Tick Behavior

### Flush Triggers
1. **Size-based**: 10 items collected → send immediately
2. **Time-based**: 60 seconds elapsed → send (even if <10 items)
3. **Session-end**: Session finalized → send remaining items
4. **Explicit**: On error recovery → flush pending items

### Retry Strategy
```
Initial Request
    ↓ [Success 200] ✅ → Batch accepted
    ↓ [Error 429/5xx] → Exponential Backoff

1st Retry (wait 1s)
    ↓ [Success 200] ✅ → Batch accepted
    ↓ [Error 429/5xx] → Continue backoff

2nd Retry (wait 3s)
    ↓ [Success 200] ✅ → Batch accepted
    ↓ [Error 429/5xx] → Continue backoff

3rd Retry (wait 10s)
    ↓ [Success 200] ✅ → Batch accepted
    ↓ [Error 429/5xx] → Give up, log error
```

**Max Attempts**: 3
**Total Time**: ~15 seconds maximum
**Retry Conditions**:
- 429 Too Many Requests
- 500+ server errors
- Network timeouts
- Connection refused

**No Retry Conditions** (fail fast):
- 400 Bad Request (validation error)
- 401 Unauthorized
- 404 Not Found
- 403 Forbidden

---

## Testing Scenarios

### Scenario 1: Happy Path (Full Batch)
```
1. Frontend accumulates 10 items over 60 seconds
2. Sends batch-tick request with 10 items
3. Backend responds with 200 OK + batchId
4. Frontend logs success
5. Frontend resets batch counter
Expected Result: ✅ All items stored
```

### Scenario 2: Timeout Flush
```
1. Frontend accumulates 3 items
2. 60 seconds pass (no new items)
3. Frontend sends batch-tick with 3 items
4. Backend responds with 200 OK
Expected Result: ✅ 3 items stored
```

### Scenario 3: Session End Flush
```
1. Frontend has 7 pending items
2. User ends session
3. Frontend sends batch-tick with 7 items
4. Backend responds with 200 OK
5. Frontend sends POST session/end
Expected Result: ✅ 7 items stored, session finalized
```

### Scenario 4: Rate Limit Recovery
```
1. Frontend sends batch (success 200)
2. Frontend sends next batch immediately
3. Backend responds 429 (rate limited)
4. Frontend waits 1 second
5. Frontend retries batch
6. Backend responds 200 OK
Expected Result: ✅ Both batches stored
```

### Scenario 5: Server Error Recovery
```
1. Frontend sends batch
2. Backend responds 500 (server error)
3. Frontend waits 1 second, retries
4. Backend responds 500 again
5. Frontend waits 3 seconds, retries
6. Backend responds 200 OK
Expected Result: ✅ Batch stored after 2 retries
```

---

## Performance Expectations

### Request Timing
- **Average batch**: 1 item → ~100-150ms response time
- **Full batch**: 10 items → ~200-300ms response time
- **Queued processing**: <5 minute total latency from capture to database

### Request Volume
- **Per 60-minute session**: ~60 requests (1 per minute)
- **Per 1000 concurrent sessions**: ~1,000 batch-tick requests/min
- **Average batch size**: 6-10 items (depends on engagement)

### Data Volume
- **Per request**: ~500-800 bytes JSON
- **Per session**: ~30-50 KB total (60 requests × ~500-800 bytes)
- **Per 1000 sessions**: ~30-50 MB/hour

---

## Monitoring & Debugging

### Key Metrics to Track
1. **Batch Success Rate**: % of requests returning 200 OK
2. **Retry Rate**: % of requests requiring retry
3. **Average Latency**: Response time per batch
4. **Error Distribution**: % breakdown by error type

### Debug Information
Frontend includes in request headers:
```
X-Session-Id: sess-abc123
X-Batch-Number: 5
X-Client-Version: 1.0.0
```

Backend should log:
```
{
  "timestamp": "2025-11-03T10:30:05.123Z",
  "sessionId": "sess-abc123",
  "batchId": "batch-sess-abc123-20251103-103000",
  "itemCount": 10,
  "processingTime": 145,
  "status": "success",
  "requestId": "req-12345-67890"
}
```

---

## Appendix: Data Type Definitions

### TypeScript Interfaces
```typescript
interface BatchTickRequest {
  items: AnalysisItem[];
}

interface AnalysisItem {
  minuteIndex: number;
  facialScore: number;
  vadScore: number;
  textScore: number;
  combinedScore: number;
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  timestamp: string; // ISO8601
  durationMs: number;
}

interface BatchTickResponse {
  count: number;
  batchId: string;
  timestamp: string; // ISO8601
  message?: string;
}

interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string>;
  timestamp: string;
}
```

### Python Type Hints
```python
from dataclasses import dataclass
from typing import List

@dataclass
class AnalysisItem:
    minuteIndex: int
    facialScore: float
    vadScore: float
    textScore: float
    combinedScore: float
    keywords: List[str]
    sentiment: str  # "positive" | "neutral" | "negative"
    confidence: float
    timestamp: str  # ISO8601
    durationMs: int

@dataclass
class BatchTickRequest:
    items: List[AnalysisItem]

@dataclass
class BatchTickResponse:
    count: int
    batchId: str
    timestamp: str
    message: str = None
```

---

## Support & Questions

**For Implementation Questions**: Contact Frontend Integration Lead
**For Data Format Clarifications**: Refer to examples section above
**For Error Handling Specifics**: See Error Responses section above
**For Testing Scenarios**: See Testing Scenarios section above

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Status**: ✅ Ready for Backend Implementation

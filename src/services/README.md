# Service Layer Architecture

Modular service layer with domain-specific API modules and shared utilities.

## Directory Structure

```
src/services/
├── api/
│   ├── auth.api.ts          # Authentication & user profile
│   ├── user.api.ts           # User preferences
│   ├── session.api.ts        # Session lifecycle & metrics
│   ├── stt.api.ts            # Speech-to-text
│   ├── monitoring.api.ts     # System health & errors
│   ├── dashboard.api.ts      # Dashboard data
│   ├── emotion.api.ts        # Emotion analysis
│   └── index.ts              # Barrel exports
├── shared/
│   ├── apiClient.ts          # Axios instance & interceptors
│   ├── errorHandler.ts       # Error logging & CORS detection
│   ├── types.ts              # Common types
│   └── index.ts              # Barrel exports
├── websocket.ts              # WebSocket management (to be modularized)
├── api.ts                    # Backward compatibility layer
└── README.md                 # This file
```

## Usage

### New Code (Recommended)

Import from specific modules for better tree-shaking:

```typescript
import { authAPI } from '@/services/api/auth.api';
import { sessionAPI } from '@/services/api/session.api';

const user = await authAPI.login(email, password);
const session = await sessionAPI.start(userId, counselorId);
```

### Existing Code (Backward Compatible)

Existing imports continue to work:

```typescript
import { authAPI, sessionAPI } from '@/services/api';

const user = await authAPI.login(email, password);
```

## API Modules

### Authentication API (`auth.api.ts`)

User authentication and profile management.

**Methods**:
- `login(email, password)` - User login
- `signup(email, password, username)` - User registration
- `logout()` - User logout
- `updateProfile(data)` - Update user profile
- `refreshToken(refreshToken)` - Refresh access token
- `me()` - Get current user info

### User API (`user.api.ts`)

User preferences and settings.

**Methods**:
- `getPreferences()` - Get user preferences (with retry)
- `setPreferences(preferences)` - Save user preferences (with retry)

### Session API (`session.api.ts`)

Session lifecycle, timeline metrics, and reports.

**Methods**:
- `start(userId, counselorId)` - Start session (with retry)
- `get(sessionId)` - Get session details
- `pause(sessionId)` - Pause session
- `resume(sessionId)` - Resume session
- `end(sessionId)` - End session (with retry)
- `getStats()` - Get session statistics
- `getReport(sessionId)` - Get session report
- `getSummary(sessionId)` - Get session summary
- `downloadPdf(sessionId)` - Download PDF report
- `downloadCsv(sessionId, kind)` - Download CSV data
- `submitFeedback(sessionId, feedback)` - Submit session feedback
- `tick(sessionId, timelineCard)` - Send 1-minute metric (with deduplication)
- `batchTick(sessionId, timelineCards)` - Send batch metrics (with retry)
- `checkDevices()` - Check camera/microphone/network (with retry)

### Other APIs

- **STT API** (`stt.api.ts`): `transcribe(audioBlob)` - Speech-to-text
- **Monitoring API** (`monitoring.api.ts`): `getErrorStats()`, `healthCheck()` - System monitoring
- **Dashboard API** (`dashboard.api.ts`): `summary()` - Dashboard data (with retry)
- **Emotion API** (`emotion.api.ts`): `analyze(text)` - Emotion analysis

## Shared Layer

### API Client (`apiClient.ts`)

Centralized Axios instance with:
- **Request Interceptors**: Security headers, auth tokens, CSRF tokens
- **Response Interceptors**: Rate limiting, error handling, CORS detection
- **Token Refresh**: Automatic 401 handling with refresh token flow
- **API Monitoring**: Performance tracking and metrics

### Error Handler (`errorHandler.ts`)

Common error handling utilities:
- `detectCORSError(error)` - Detect and classify CORS errors
- `logApiError(error, requestId, serverReqId)` - Unified error logging

### Types (`types.ts`)

Shared TypeScript types:
- `ApiResponse<T>` - Standard API response wrapper
- `ApiError` - API error structure
- `ApiResult<T>` - Explicit success/failure type
- `RateLimitInfo` - Rate limiting headers
- `CORSErrorDetails` - CORS error details

## Features

### Automatic Retry

Critical endpoints use `retryWithBackoff` for resilience:
- Session start/end (3 attempts)
- User preferences (2 attempts)
- Dashboard summary (2 attempts)
- Timeline metrics (3 attempts)

### Request Deduplication

`sessionAPI.tick` and `sessionAPI.batchTick` use `requestDeduplicator` to prevent duplicate requests.

### Security

All requests include:
- `X-Request-ID` - Unique request identifier
- `X-Client-Version` - Client version tracking
- `X-Device-ID` - Device identification
- `X-Timestamp` - Request timestamp
- `Authorization` - JWT bearer token (when available)
- `X-CSRF-Token` - CSRF protection (POST/PUT/DELETE/PATCH)

### Token Refresh

Automatic 401 handling with refresh token flow:
1. Detect 401 error on protected endpoint
2. Request new access token using refresh token
3. Update Authorization header
4. Retry original request
5. Queue concurrent requests during refresh

### CORS Detection

Automatic CORS error detection and logging:
- Preflight failures
- Missing CORS headers
- Detailed error messages for debugging

## Testing

To be implemented: Unit tests for each API module in `src/services/__tests__/`.

Target coverage: ≥80%

## Migration Guide

### From Old `api.ts` to New Structure

**Before** (995-line monolith):
```typescript
// All in one file
import { authAPI, sessionAPI } from '@/services/api';
```

**After** (Modular):
```typescript
// Import specific modules
import { authAPI } from '@/services/api/auth.api';
import { sessionAPI } from '@/services/api/session.api';
```

**Backward Compatibility**: Old imports still work via re-exports in `api.ts`.

## Benefits

1. **Maintainability**: Domain-specific files are easier to understand and modify
2. **Testability**: Each module can be tested independently
3. **Tree-Shaking**: Unused modules can be eliminated from bundle
4. **Scalability**: Easy to add new API domains
5. **Separation of Concerns**: Clear boundaries between different API domains

## Next Steps

- [ ] Implement unit tests for all API modules
- [ ] Modularize `websocket.ts` into `websocket/` directory
- [ ] Add JSDoc comments for all public methods
- [ ] Create Swagger/OpenAPI documentation
- [ ] Add request/response interceptor hooks for testing

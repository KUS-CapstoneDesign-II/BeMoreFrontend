# API Setup Guide - BeMoreFrontend

## Overview

This guide explains how to set up and configure the API for BeMoreFrontend development.

## Current Architecture

- **Frontend Dev Server**: `http://localhost:5173` (Vite)
- **Backend API Server**: `http://localhost:8000` (Expected)
- **API Proxy**: Vite dev server proxies `/api` calls to backend

### Configuration Files

- `.env.development` - Development environment variables
- `vite.config.ts` - Vite server configuration with API proxy
- `src/services/api.ts` - Axios API client configuration

---

## Setup Options

### Option 1: Use Mock API (Recommended for Frontend-Only Development)

**Best for**: Frontend development without backend dependency

#### Steps:

1. **Enable Mock API in `.env.development`**:
   ```env
   VITE_ENABLE_MOCK_API=true
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

3. **Check console** - You should see:
   ```
   🎭 Mock API Interceptor initialized
   ```

#### What happens:

- API calls are intercepted and return mock responses
- No network requests to actual backend
- Simulated network latency (100-300ms)
- All user preferences/dashboard data is mocked

#### Mock Endpoints Available:

| Endpoint | Response |
|----------|----------|
| `/api/user/preferences` | User settings (font scale, language, etc.) |
| `/api/dashboard/summary` | Dashboard stats (sessions, completion, etc.) |
| `/api/monitoring/health` | Health check response |
| `/api/monitoring/error-stats` | Error statistics |

#### Adding More Mock Endpoints:

Edit `src/utils/mockAPI.ts`:

```typescript
const mockResponses: Record<string, MockResponse> = {
  '/api/your-endpoint': {
    success: true,
    data: {
      // your mock data
    },
  },
  // ... more endpoints
};
```

---

### Option 2: Run Backend Server Locally

**Best for**: Full stack development with real API

#### Prerequisites:

- Backend repository cloned and set up
- Node.js/Python environment for backend
- Port 8000 available

#### Steps:

1. **Start backend server** (in separate terminal):
   ```bash
   # From backend directory
   npm start  # or: python app.py, etc.
   ```

2. **Ensure `.env.development` has**:
   ```env
   VITE_ENABLE_MOCK_API=false
   VITE_API_URL=http://localhost:8000
   ```

3. **Start frontend dev server**:
   ```bash
   npm run dev
   ```

#### Verification:

Check browser console - you should see:
```
📡 API Request [req_xxx]: GET /api/user/preferences
✅ API Response [req_xxx]: /api/user/preferences (200)
```

---

### Option 3: Use Deployed Backend

**Best for**: Testing against production-like API

#### Steps:

1. **Update `.env.development`**:
   ```env
   VITE_API_URL=https://your-api.example.com
   VITE_ENABLE_MOCK_API=false
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

#### Notes:

- CORS might need to be configured on backend
- API credentials/tokens may be required
- Network latency will be higher

---

## Troubleshooting

### Problem: API calls failing with "unknown" error

**Solution 1**: Enable mock API
```bash
# Edit .env.development
VITE_ENABLE_MOCK_API=true
```

**Solution 2**: Check if backend is running
```bash
# Test backend connectivity
curl http://localhost:8000/api/monitoring/health
```

**Solution 3**: Check Vite proxy configuration
- Ensure `vite.config.ts` has correct proxy target
- Clear browser cache and restart dev server

### Problem: CORS errors

**Solution**:
- Backend needs CORS headers configured
- Check backend's CORS settings for `http://localhost:5173`
- Or use mock API instead

### Problem: Timeout errors

**Solution 1**: Increase timeout in `src/services/api.ts`:
```typescript
const api = axios.create({
  timeout: 60000, // Increase from 30000
  // ...
});
```

**Solution 2**: Check network connectivity
```bash
ping localhost:8000
```

### Problem: "Failed to load remote preferences, using local defaults"

**Expected behavior** - This happens when:
1. Backend API is not running
2. API call times out
3. Network is unreachable

**Solution**:
- Use mock API by setting `VITE_ENABLE_MOCK_API=true`
- OR start backend server
- This is not an error, frontend handles it gracefully

---

## API Response Format

All API responses follow this format:

```typescript
{
  success: boolean;
  data?: any;           // Response data (when success=true)
  error?: {
    message: string;    // Error description
    code: string;       // Error code
  };
}
```

### Example Success Response:

```json
{
  "success": true,
  "data": {
    "fontScale": "md",
    "language": "ko"
  }
}
```

### Example Error Response:

```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
}
```

---

## Available API Endpoints

### User API

#### Get Preferences
```
GET /api/user/preferences
```
Returns user settings (font scale, language, density, notifications).

#### Set Preferences
```
PUT /api/user/preferences
Body: { preferences: {...} }
```
Updates user settings.

### Dashboard API

#### Get Summary
```
GET /api/dashboard/summary
```
Returns dashboard statistics (total sessions, completion, etc.).

### Monitoring API

#### Health Check
```
GET /api/monitoring/health
```
Returns backend health status.

#### Error Stats
```
GET /api/monitoring/error-stats
```
Returns error statistics.

### Session API

Full session management API (start, pause, resume, end, report, etc.). See `src/services/api.ts` for full list.

---

## Development Workflow

### Recommended Workflow:

```bash
# Terminal 1: Start Frontend Dev Server
npm run dev
# Frontend runs on http://localhost:5173

# Terminal 2 (Optional): Start Backend Server
cd ../BeMoreBackend
npm start  # or appropriate command
# Backend runs on http://localhost:8000
```

### Quick Setup (Frontend Only):

```bash
# Just run frontend with mock API
VITE_ENABLE_MOCK_API=true npm run dev
# No backend needed!
```

---

## Advanced Configuration

### Custom API Base URL

Edit `src/services/api.ts`:

```typescript
const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  (runtimeEnv.API_URL as string) ||
  'http://localhost:8000'; // Change default here
```

### Custom Request Headers

Add to request interceptor in `src/services/api.ts`:

```typescript
api.interceptors.request.use((config) => {
  config.headers['X-Custom-Header'] = 'value';
  return config;
});
```

### API Monitoring

Access API metrics in browser console:

```javascript
// View overall stats
window.__apiMonitoring.getStats()

// View per-endpoint stats
window.__apiMonitoring.getEndpointStats()

// View all metrics
window.__apiMonitoring.getMetrics()

// Reset metrics
window.__apiMonitoring.reset()
```

---

## Next Steps

1. **Choose your setup**: Mock API or real backend
2. **Update `.env.development`** accordingly
3. **Run dev server**: `npm run dev`
4. **Check console** for API initialization logs
5. **Start developing!**

For issues, check the Troubleshooting section above.

---

## Related Files

- Configuration: `vite.config.ts`
- Environment: `.env.development`, `.env.production`
- API Service: `src/services/api.ts`
- Mock API: `src/utils/mockAPI.ts`
- API Monitoring: `src/utils/apiMonitoring.ts`
- Contexts: `src/contexts/SettingsContext.tsx`, etc.

---

**Last Updated**: 2025-11-05

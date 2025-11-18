# 🚨 백엔드 긴급 이슈 - 즉시 조치 필요

**작성일**: 2025-01-XX
**우선순위**: P0 (Critical) - 서비스 작동 불가
**담당**: 백엔드 팀

---

## 🔴 P0: CORS 에러 - 로그인/API 호출 불가

### 현상
```
Access to XMLHttpRequest at 'https://bemorebackend.onrender.com/api/auth/login'
from origin 'https://be-more-frontend.vercel.app' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 영향도
- **심각도**: Critical (P0)
- **영향 범위**: 전체 서비스 작동 불가
- **현재 상태**: 프로덕션 환경에서 로그인/인증 완전 차단

### 원인
백엔드 서버가 프론트엔드 도메인(`https://be-more-frontend.vercel.app`)을 CORS 허용 목록에 추가하지 않음

### 해결 방법

#### 1. Express.js 사용 시
```javascript
// server.js or app.js
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',                    // 로컬 개발
  'http://localhost:3000',                    // 로컬 개발 (alternative)
  'https://be-more-frontend.vercel.app',      // 프로덕션
  'https://be-more-frontend-*.vercel.app',    // Vercel 프리뷰 배포
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,                          // 쿠키/인증 정보 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

#### 2. FastAPI 사용 시
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://be-more-frontend.vercel.app",
    "https://be-more-frontend-*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 3. Django 사용 시
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://be-more-frontend.vercel.app",
]

CORS_ALLOW_CREDENTIALS = True
```

### 확인 방법
```bash
# CORS 헤더 확인
curl -I -X OPTIONS \
  -H "Origin: https://be-more-frontend.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  https://bemorebackend.onrender.com/api/auth/login

# 예상 응답에 포함되어야 할 헤더:
# Access-Control-Allow-Origin: https://be-more-frontend.vercel.app
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Credentials: true
```

### 배포 후 테스트
1. Vercel 프로덕션에서 로그인 시도
2. 브라우저 콘솔에서 CORS 에러 사라짐 확인
3. API 호출 성공 확인

---

## 🟡 P1: Analytics 엔드포인트 누락

### 현상
```
POST /api/analytics/vitals 404
POST /api/analytics/alert 404
```

### 영향도
- **심각도**: Medium (P1)
- **영향 범위**: 성능 모니터링 불가 (서비스는 작동)
- **현재 상태**: 프론트엔드에서 반복적인 404 에러 발생

### 원인
프론트엔드가 성능 메트릭을 전송하려 하지만 백엔드 엔드포인트가 구현되지 않음

### 해결 방법 (2가지 옵션)

#### 옵션 1: 백엔드 엔드포인트 추가 (권장)

```javascript
// Express.js 예시
app.post('/api/analytics/vitals', async (req, res) => {
  try {
    const { metric, value, pathname } = req.body;

    // 메트릭 저장 (DB, 로깅, 모니터링 서비스 등)
    await saveMetric({
      metric,
      value,
      pathname,
      timestamp: new Date(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to save metric' });
  }
});

app.post('/api/analytics/alert', async (req, res) => {
  try {
    const { metric, value, threshold } = req.body;

    // 알림 저장/발송
    await sendAlert({
      metric,
      value,
      threshold,
      timestamp: new Date(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Alert error:', error);
    res.status(500).json({ error: 'Failed to send alert' });
  }
});
```

**요청 형식**:
```typescript
// POST /api/analytics/vitals
{
  metric: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB',
  value: number,
  pathname: string
}

// POST /api/analytics/alert
{
  metric: string,
  value: number,
  threshold: number
}
```

#### 옵션 2: 프론트엔드 임시 비활성화
프론트엔드 팀에게 해당 기능 임시 비활성화 요청 (FRONTEND_TASKS.md 참고)

### 우선순위
- **당장 필수 아님**: 프론트엔드에서 임시 비활성화 가능
- **장기적으로 권장**: 성능 모니터링은 서비스 품질 관리에 중요

---

## 📋 체크리스트

백엔드 팀이 완료해야 할 작업:

### P0 (즉시)
- [ ] CORS 설정 추가/수정
- [ ] 프로덕션 배포
- [ ] CORS 헤더 확인 (curl 테스트)
- [ ] Vercel 프로덕션에서 로그인 테스트
- [ ] 프론트엔드 팀에게 배포 완료 알림

### P1 (이번 주)
- [ ] Analytics 엔드포인트 구현 여부 결정
- [ ] 구현 시: 엔드포인트 추가 및 배포
- [ ] 구현 안 할 시: 프론트엔드 팀에게 알림
- [ ] API 문서 업데이트

---

## 🤝 추가 협업 요청

### 1. API 응답 형식 확인
BACKEND_COMMUNICATION.md에서 요청한 3가지 API 응답 형식 확인 부탁드립니다:
1. VAD 메트릭 형식 (`audioLevel`, `vadState`)
2. 에러 응답 형식 (`message`, `requestId`)
3. 기기 점검 API 형식

### 2. 에러 응답에 requestId 추가 제안
모든 에러 응답에 `requestId` 포함 시 디버깅 효율 향상:

```javascript
// 제안: 에러 응답 형식
{
  "error": {
    "message": "카메라 권한이 거부되었습니다",
    "requestId": "req_uuid_v4_here",
    "code": "CAMERA_PERMISSION_DENIED",  // optional
    "timestamp": "2025-01-11T11:00:00Z"   // optional
  }
}
```

---

## 📞 연락처

**긴급 문의**: 프론트엔드 팀 [연락처]
**관련 문서**:
- [BACKEND_COMMUNICATION.md](./BACKEND_COMMUNICATION.md) - 상세 API 확인 요청사항
- [FRONTEND_TASKS.md](./FRONTEND_TASKS.md) - 프론트엔드 임시 조치사항

**예상 작업 시간**:
- CORS 수정: 10분
- Analytics 엔드포인트: 30분~1시간

---

**TL;DR**:
1. ⚠️ **즉시 필요**: CORS 설정 추가하여 프론트엔드 도메인 허용 (서비스 작동 불가 상태)
2. 📊 **선택 사항**: Analytics 엔드포인트 구현 또는 프론트엔드에서 비활성화

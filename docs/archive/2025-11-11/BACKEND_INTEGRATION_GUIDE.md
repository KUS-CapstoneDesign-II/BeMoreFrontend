# Backend Integration Guide - Error Handling & Analytics

**작성일**: 2025-01-11
**프론트엔드 버전**: Phase 0-1 (P0: CORS Error Handler, P1: Analytics Feature Flag)
**목적**: 백엔드-프론트엔드 에러 처리 시스템 통합 및 Analytics 엔드포인트 준비

---

## 📋 목차

1. [완료된 프론트엔드 작업](#완료된-프론트엔드-작업)
2. [백엔드 요청 사항](#백엔드-요청-사항)
3. [통합 테스트 시나리오](#통합-테스트-시나리오)
4. [프론트엔드 검증 체크리스트](#프론트엔드-검증-체크리스트)
5. [FAQ](#faq)

---

## ✅ 완료된 프론트엔드 작업

### P0: CORS-Friendly Error Handler System

**구현 내용**: 사용자 친화적 에러 메시지 시스템 구축

**Commits**:
- `b7ffdab` - P0: Add CORS-friendly error handler with userMessage
- `cefe50d` - feat: integrate userMessage in error handling system

**동작 방식**:

```typescript
// 1. axios interceptor에서 에러 발생 시 userMessage 추가
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 사용자 친화적 메시지 생성
    const userMessage = getUserFriendlyErrorMessage(error);
    error.userMessage = userMessage; // ⭐ 여기에 추가

    return Promise.reject(error);
  }
);

// 2. UI에서 에러 처리
catch (error) {
  const message = getErrorMessage(error); // userMessage 우선 사용
  setErrors({ general: message });
}
```

**현재 매핑된 에러 메시지**:

| 에러 유형 | 감지 조건 | 사용자 메시지 |
|----------|----------|-------------|
| **CORS Error** | `status === 0 && message.includes('Failed to fetch')` | "서버 설정 작업이 진행 중입니다. 잠시 후 다시 시도해주세요." |
| **Timeout** | `code === 'ECONNABORTED' \|\| message.includes('timeout')` | "요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요." |
| **Network Error** | `message.includes('Network Error') \|\| code === 'ERR_NETWORK'` | "서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요." |
| **5xx Server Error** | `status >= 500` | "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요." |
| **4xx Client Error** | `status >= 400 && status < 500` | *백엔드가 제공한 `error.message` 사용* |

**파일 위치**:
- [src/services/shared/errorHandler.ts](src/services/shared/errorHandler.ts#L119-L171) - `getUserFriendlyErrorMessage()`
- [src/services/shared/apiClient.ts](src/services/shared/apiClient.ts#L168-L170) - axios interceptor
- [src/utils/errorHandler.ts](src/utils/errorHandler.ts#L47-L76) - `getErrorMessage()` 통합

---

### P1: Analytics Feature Flag System

**구현 내용**: Analytics 엔드포인트 비활성화 시스템 (404 에러 방지)

**Commit**: `242fc2c` - feat: add Analytics Feature Flag system (P1)

**동작 방식**:

```typescript
// src/config/features.ts
export const FEATURE_FLAGS = {
  ANALYTICS_ENABLED: false, // 기본값: 비활성화
  // ...
};

export function getAnalyticsEnabled(): boolean {
  // 환경 변수 우선
  if (import.meta.env.VITE_ANALYTICS_ENABLED !== undefined) {
    return import.meta.env.VITE_ANALYTICS_ENABLED === 'true';
  }
  return FEATURE_FLAGS.ANALYTICS_ENABLED;
}
```

**적용된 엔드포인트**:
- `/api/analytics/vitals` (Web Vitals 성능 메트릭)
- `/api/analytics/alert` (성능 임계값 경고)

**활성화 방법** (백엔드 준비 완료 시):
```bash
# .env 파일에 추가
VITE_ANALYTICS_ENABLED=true
```

**파일 위치**:
- [src/config/features.ts](src/config/features.ts) - Feature Flag 설정
- [src/utils/webVitals.ts](src/utils/webVitals.ts#L247-L249) - `/api/analytics/vitals` 체크
- [src/utils/performanceReporting.ts](src/utils/performanceReporting.ts#L238-L243) - `/api/analytics/alert` 체크

---

## 🔧 백엔드 요청 사항

### 1️⃣ **에러 응답 형식 표준화** (P0 - 높은 우선순위)

#### 현재 프론트엔드 기대 형식

프론트엔드는 다음 순서로 에러 메시지를 추출합니다:

```typescript
// 우선순위:
// 1. userMessage (axios interceptor가 자동 생성 - CORS/timeout/network)
// 2. response.data.error.message (백엔드가 제공하는 사용자 친화적 메시지)
// 3. Error.message (기본 에러 메시지)
// 4. UNKNOWN_ERROR (폴백)
```

#### 백엔드 구현 요청

**✅ 권장 형식** (모든 4xx 에러에 사용자 친화적 메시지 포함):

```typescript
// ❌ 나쁜 예 (기술적 메시지)
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Authentication failed: invalid email/password combination",
    "requestId": "req_abc123"
  }
}

// ✅ 좋은 예 (사용자 친화적 메시지)
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다.", // ⭐ 한국어, 사용자 친화적
    "requestId": "req_abc123"
  }
}
```

**📝 예시 - 주요 엔드포인트별 권장 메시지**:

| 엔드포인트 | HTTP 상태 | 에러 코드 | 권장 메시지 (error.message) |
|-----------|-----------|----------|---------------------------|
| `POST /api/auth/login` | 401 | `INVALID_CREDENTIALS` | "이메일 또는 비밀번호가 올바르지 않습니다." |
| `POST /api/auth/signup` | 409 | `EMAIL_ALREADY_EXISTS` | "이미 사용 중인 이메일입니다." |
| `POST /api/auth/login` | 429 | `TOO_MANY_REQUESTS` | "로그인 시도 횟수를 초과했습니다. 5분 후 다시 시도해주세요." |
| `POST /api/session/start` | 400 | `INVALID_SESSION_DATA` | "세션을 시작할 수 없습니다. 입력 정보를 확인해주세요." |
| `POST /api/session/{id}/end` | 404 | `SESSION_NOT_FOUND` | "세션을 찾을 수 없습니다." |
| `GET /api/session/{id}/report` | 403 | `UNAUTHORIZED_ACCESS` | "접근 권한이 없습니다." |
| All endpoints | 500 | `INTERNAL_SERVER_ERROR` | "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요." |

**🎯 핵심 원칙**:
1. **한국어 사용**: 모든 `error.message`는 한국어로 작성
2. **구체적 안내**: "다시 시도해주세요" 같은 행동 지침 포함
3. **기술 용어 배제**: "Authentication failed" ❌ → "로그인에 실패했습니다" ✅
4. **일관된 tone**: 존댓말 사용 (~입니다, ~주세요)

---

### 2️⃣ **CORS 헤더 설정** (P0 - 필수)

#### 현재 상황
- 프론트엔드는 CORS 에러 시 "서버 설정 작업이 진행 중입니다" 메시지 표시
- 실제 CORS 설정 필요 (프리플라이트 요청 지원)

#### 백엔드 구현 요청

**필수 응답 헤더**:
```http
Access-Control-Allow-Origin: https://your-frontend-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID, X-Client-Version, X-Device-ID, X-Timestamp, X-CSRF-Token
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

**프리플라이트 요청 처리** (OPTIONS 메서드):
```typescript
// 예시 (Express.js)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Client-Version, X-Device-ID, X-Timestamp, X-CSRF-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});
```

**⚠️ 주의사항**:
- 개발 환경: `Access-Control-Allow-Origin: *` 허용
- 프로덕션: 특정 도메인만 허용 (보안)

---

### 3️⃣ **Analytics 엔드포인트 구현** (P1 - 중간 우선순위)

#### 필요한 엔드포인트

**1) Web Vitals 수집 엔드포인트**

```http
POST /api/analytics/vitals
Content-Type: application/json

Request Body:
{
  "name": "LCP" | "FID" | "CLS" | "TTFB" | "FCP" | "INP",
  "value": 1234.56,
  "rating": "good" | "needs-improvement" | "poor",
  "timestamp": "2025-01-11T12:34:56.789Z"
}

Response (성공):
{
  "success": true,
  "data": {
    "received": true,
    "metricId": "metric_abc123"
  }
}
```

**호출 시점**: 페이지 로드 완료 후 각 Web Vitals 메트릭이 측정될 때마다

**2) 성능 경고 엔드포인트**

```http
POST /api/analytics/alert
Content-Type: application/json

Request Body:
{
  "message": "🚨 Critical: LCP (4500ms)",
  "timestamp": "2025-01-11T12:34:56.789Z",
  "url": "https://frontend.com/app/session/active"
}

Response (성공):
{
  "success": true,
  "data": {
    "alertId": "alert_xyz789"
  }
}
```

**호출 시점**: 성능 메트릭이 임계값을 초과할 때 (warning/critical)

#### 백엔드 구현 상태 확인

**✅ 구현 완료 시 프론트엔드에 알려주세요**:

```markdown
## Analytics 엔드포인트 구현 완료

- [x] POST /api/analytics/vitals 구현 완료
- [x] POST /api/analytics/alert 구현 완료
- [x] CORS 헤더 설정 완료
- [x] 요청 데이터 검증 완료
- [x] 데이터베이스 저장 로직 완료 (선택 사항)

**활성화 방법**: 프론트엔드에서 `.env`에 `VITE_ANALYTICS_ENABLED=true` 추가
**테스트 URL**: https://backend.com/api/analytics/vitals
```

**❌ 구현 불필요한 경우**:

```markdown
## Analytics 엔드포인트 미구현

현재 단계에서는 Analytics 기능이 필요하지 않습니다.
프론트엔드는 Feature Flag로 비활성화하여 404 에러가 발생하지 않습니다.

필요 시점: Phase 2 성능 모니터링 단계
```

---

### 4️⃣ **보안 헤더 확인** (참고용)

프론트엔드가 모든 요청에 자동으로 추가하는 보안 헤더:

```http
X-Request-ID: req_1736585696789_a1b2c3
X-Client-Version: 1.0.0
X-Device-ID: device_a1b2c3d4e5f6
X-Timestamp: 1736585696789
X-CSRF-Token: csrf_abc123xyz (POST/PUT/DELETE/PATCH만)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**백엔드 확인 사항**:
- ✅ `X-Request-ID`: 로그에 기록하여 요청 추적 가능하게
- ✅ `X-CSRF-Token`: CSRF 방어 검증 (선택 사항)
- ✅ `Authorization`: JWT 토큰 검증

---

## 🧪 통합 테스트 시나리오

### 시나리오 1: 로그인 에러 처리

**테스트 케이스**:

```bash
# 1. 잘못된 비밀번호
curl -X POST https://backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# 기대 응답:
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다.", # ⭐ 한국어
    "requestId": "req_abc123"
  }
}

# 프론트엔드 UI 표시:
# "이메일 또는 비밀번호가 올바르지 않습니다."
```

**검증 항목**:
- [ ] HTTP 상태 코드 401
- [ ] `error.message`가 한국어
- [ ] 프론트엔드 UI에 메시지 정상 표시
- [ ] 기술적 스택 트레이스 노출되지 않음

---

### 시나리오 2: CORS 에러 처리

**테스트 케이스**:

```bash
# 1. OPTIONS 프리플라이트 요청
curl -X OPTIONS https://backend.com/api/auth/login \
  -H "Origin: https://frontend.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"

# 기대 응답:
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://frontend.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID, X-Client-Version, X-Device-ID, X-Timestamp, X-CSRF-Token
Access-Control-Allow-Credentials: true
```

**검증 항목**:
- [ ] OPTIONS 요청에 204 응답
- [ ] `Access-Control-Allow-Origin` 헤더 포함
- [ ] `Access-Control-Allow-Headers`에 모든 필수 헤더 포함
- [ ] 프론트엔드에서 실제 POST 요청 성공

---

### 시나리오 3: Analytics 엔드포인트

**테스트 케이스**:

```bash
# 1. Web Vitals 전송
curl -X POST https://backend.com/api/analytics/vitals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "LCP",
    "value": 2345.67,
    "rating": "good",
    "timestamp": "2025-01-11T12:34:56.789Z"
  }'

# 기대 응답:
{
  "success": true,
  "data": {
    "received": true,
    "metricId": "metric_abc123"
  }
}
```

**검증 항목**:
- [ ] HTTP 상태 코드 200
- [ ] `success: true` 응답
- [ ] 프론트엔드 콘솔에 404 에러 없음
- [ ] 데이터베이스에 메트릭 저장 확인 (선택 사항)

---

## ✅ 프론트엔드 검증 체크리스트

백엔드 구현 완료 후, 프론트엔드 팀이 다음 항목을 검증합니다:

### Phase 1: 에러 처리 검증

**1. 로그인 에러 시나리오**

```markdown
테스트 환경: https://frontend.com/auth/login

- [ ] **잘못된 비밀번호 입력**
  - 기대 메시지: "이메일 또는 비밀번호가 올바르지 않습니다."
  - 확인: 기술적 메시지(Authentication failed) 노출 안 됨

- [ ] **존재하지 않는 이메일**
  - 기대 메시지: "이메일 또는 비밀번호가 올바르지 않습니다."
  - 확인: 보안상 동일한 메시지 표시

- [ ] **Rate Limit 초과**
  - 기대 메시지: "로그인 시도 횟수를 초과했습니다. 5분 후 다시 시도해주세요."
  - 확인: 구체적인 재시도 시간 안내

- [ ] **서버 5xx 에러**
  - 기대 메시지: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
  - 확인: 기술적 스택 트레이스 노출 안 됨
```

**2. 회원가입 에러 시나리오**

```markdown
테스트 환경: https://frontend.com/auth/signup

- [ ] **중복 이메일**
  - 기대 메시지: "이미 사용 중인 이메일입니다."
  - 확인: error.code === 'EMAIL_ALREADY_EXISTS'

- [ ] **유효하지 않은 데이터**
  - 기대 메시지: 백엔드가 제공한 구체적 메시지
  - 확인: 어떤 필드가 문제인지 명확히 표시
```

**3. 네트워크 에러 시나리오**

```markdown
- [ ] **백엔드 서버 다운**
  - 기대 메시지: "서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
  - 확인: axios interceptor의 userMessage 사용

- [ ] **타임아웃 (30초)**
  - 기대 메시지: "요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요."
  - 확인: 사용자가 네트워크 문제를 인지
```

---

### Phase 2: CORS 검증

```markdown
테스트 환경: https://frontend.com/app

- [ ] **Cross-Origin 요청 성공**
  - 확인: 브라우저 콘솔에 CORS 에러 없음
  - 확인: Network 탭에서 OPTIONS 프리플라이트 204 응답

- [ ] **인증 헤더 포함 요청**
  - 확인: Authorization 헤더가 백엔드에 정상 전달
  - 확인: X-Request-ID 등 커스텀 헤더 전달 성공

- [ ] **개발 환경 vs 프로덕션**
  - 개발: localhost:5173 → backend.com (CORS 허용)
  - 프로덕션: frontend.com → backend.com (CORS 허용)
```

---

### Phase 3: Analytics 검증 (선택 사항)

```markdown
**전제 조건**: .env에 VITE_ANALYTICS_ENABLED=true 설정

테스트 환경: https://frontend.com/app

- [ ] **Web Vitals 전송**
  - 확인: 페이지 로드 후 LCP/FID/CLS 메트릭 전송
  - 확인: 브라우저 콘솔에 404 에러 없음
  - 확인: Network 탭에서 POST /api/analytics/vitals 성공 (200)

- [ ] **성능 경고 전송**
  - 확인: 임계값 초과 시 POST /api/analytics/alert 호출
  - 확인: 백엔드 로그에서 경고 기록 확인

- [ ] **Feature Flag 동작**
  - VITE_ANALYTICS_ENABLED=false → 요청 안 보냄
  - VITE_ANALYTICS_ENABLED=true → 요청 보냄
```

---

### 검증 완료 보고 템플릿

백엔드 구현 완료 후, 프론트엔드 팀이 다음 형식으로 검증 결과를 보고합니다:

```markdown
## 프론트엔드 통합 검증 결과

**검증일**: 2025-01-11
**검증자**: [이름]
**백엔드 버전**: v1.2.3

### ✅ 통과한 항목

- [x] 로그인 에러 메시지 (INVALID_CREDENTIALS)
- [x] 회원가입 중복 이메일 (EMAIL_ALREADY_EXISTS)
- [x] CORS 프리플라이트 요청 (OPTIONS)
- [x] Analytics vitals 엔드포인트

### ❌ 실패한 항목

- [ ] Rate Limit 에러 메시지
  - 문제: 백엔드 응답이 영어로 옴 ("Too many requests")
  - 기대: "로그인 시도 횟수를 초과했습니다. 5분 후 다시 시도해주세요."
  - 조치 필요: backend/auth.controller.ts:45 한국어 메시지 추가

### 📝 추가 논의 필요

- Analytics alert 엔드포인트 구현 여부 확인
```

---

## ❓ FAQ

### Q1. 백엔드가 영어 메시지를 반환하면 어떻게 되나요?

**A**: 프론트엔드가 한국어로 변환하지 않습니다. 백엔드에서 **반드시 한국어 메시지**를 제공해야 합니다.

```typescript
// ❌ 나쁜 예 - 프론트엔드가 변환 안 함
{
  "error": {
    "message": "Invalid credentials" // 그대로 사용자에게 표시됨
  }
}

// ✅ 좋은 예
{
  "error": {
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
  }
}
```

---

### Q2. CORS 에러가 계속 발생하면?

**A**: 백엔드 CORS 설정 확인이 필요합니다.

**체크리스트**:
1. `Access-Control-Allow-Origin` 헤더에 프론트엔드 도메인 포함?
2. `Access-Control-Allow-Headers`에 커스텀 헤더 포함? (X-Request-ID 등)
3. OPTIONS 요청에 204 응답?
4. `Access-Control-Allow-Credentials: true` 설정?

---

### Q3. Analytics 엔드포인트를 구현하지 않으면?

**A**: 문제없습니다. 프론트엔드는 Feature Flag로 비활성화합니다.

```typescript
// src/config/features.ts
export const FEATURE_FLAGS = {
  ANALYTICS_ENABLED: false, // 기본값: 비활성화
};
```

**현재 상태**: Analytics 비활성화, 404 에러 발생 안 함
**구현 시**: `.env`에 `VITE_ANALYTICS_ENABLED=true` 추가하면 활성화

---

### Q4. error.code는 어떻게 사용되나요?

**A**: 프론트엔드는 `error.message`를 우선 사용하고, `error.code`는 로깅 및 특수 처리에만 사용합니다.

```typescript
// 프론트엔드 동작
if (error.code === 'EMAIL_ALREADY_EXISTS') {
  // 특수 처리: 이메일 필드에 포커스
  emailInputRef.current?.focus();
}

// 사용자에게는 error.message 표시
setErrors({ email: error.message }); // "이미 사용 중인 이메일입니다."
```

---

### Q5. 4xx 에러에 대해 모두 한국어 메시지를 제공해야 하나요?

**A**: 네, 사용자에게 표시되는 모든 에러는 한국어여야 합니다.

**우선순위**:
- **P0 (필수)**: 로그인, 회원가입 관련 에러 (401, 409, 429)
- **P1 (중요)**: 세션 관련 에러 (400, 403, 404)
- **P2 (권장)**: 기타 모든 4xx 에러

**5xx 에러**는 generic 메시지로 통일:
```json
{
  "error": {
    "message": "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
  }
}
```

---

## 📞 연락처

**프론트엔드 담당자**: [이름/이메일]
**백엔드 담당자**: [이름/이메일]

**Slack 채널**: #backend-frontend-integration
**이슈 트래킹**: [GitHub Issues / Jira]

---

## 📚 참고 자료

- [프론트엔드 에러 처리 구현 PR](https://github.com/org/BeMoreFrontend/pull/xxx)
- [백엔드 API 스펙 문서](https://docs.backend.com/api)
- [CORS 설정 가이드](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**작성**: 프론트엔드 팀
**최종 업데이트**: 2025-01-11
**버전**: 1.0.0

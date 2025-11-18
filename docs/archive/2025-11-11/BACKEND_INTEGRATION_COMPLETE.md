# 🔗 프론트엔드 Phase 11 Backend Integration 완료 안내

**날짜**: 2025-01-11
**대상**: 백엔드 개발팀
**발신**: 프론트엔드 팀
**프로젝트**: BeMore Frontend

---

## 📋 요약

프론트엔드에서 **Phase 11 Backend Integration** 작업을 완료했습니다.

백엔드 팀에서 3가지 항목을 구현해주시면 프로덕션 배포가 가능합니다:
1. ✅ **에러 메시지 한국어 변환** (필수 ⭐)
2. ✅ **CORS 설정 개선** (필수 ⭐)
3. 🔲 **Analytics 엔드포인트** (선택 사항)

---

## ✅ 프론트엔드 완료 작업

### 1. CORS-Friendly Error Handler (P0)
- **목적**: 사용자에게 친화적인 한국어 에러 메시지 제공
- **구현**: axios interceptor에 `userMessage` 추가
- **커밋**: `b7ffdab`, `cefe50d`

**효과**:
- ❌ Before: "CORS policy: No 'Access-Control-Allow-Origin' header..."
- ✅ After: "서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요."

### 2. Analytics Feature Flag System (P1)
- **목적**: 백엔드 Analytics 엔드포인트 준비 전까지 404 에러 방지
- **구현**: `src/config/features.ts` Feature Flag 시스템
- **커밋**: `242fc2c`

**기본 설정**:
```typescript
// src/config/features.ts
ANALYTICS_ENABLED: false  // 기본값: 비활성화
```

**활성화 방법** (백엔드 준비 완료 후):
```bash
# .env.production
VITE_ANALYTICS_ENABLED=true
```

### 3. 통합 문서 작성
- **Backend Integration Guide** (14KB) - 상세 가이드
- **Backend Integration Brief** (3KB) - 3분 요약
- **Frontend Verification Checklist** (12KB) - 검증 절차
- **커밋**: `770e9b1`

---

## 🎯 백엔드 요청 사항

### 📌 필수 항목 (⭐)

#### 1. 에러 메시지 한국어 변환

**현재 상태**: 백엔드가 영어 메시지 반환 중
**요청 사항**: 모든 에러 응답의 `error.message`를 한국어로 변환

**에러 응답 형식** (표준):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."  // ← 한국어 필수
  }
}
```

**주요 엔드포인트별 권장 메시지**:

| 엔드포인트 | HTTP 상태 | error.code | 권장 메시지 (한국어) |
|-----------|----------|------------|---------------------|
| `POST /api/auth/login` | 401 | `INVALID_CREDENTIALS` | 이메일 또는 비밀번호가 올바르지 않습니다. |
| `POST /api/auth/signup` | 409 | `EMAIL_ALREADY_EXISTS` | 이미 사용 중인 이메일입니다. |
| `POST /api/auth/signup` | 400 | `WEAK_PASSWORD` | 비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다. |
| `POST /api/auth/verify-email` | 400 | `INVALID_TOKEN` | 인증 링크가 만료되었습니다. 다시 시도해주세요. |
| `POST /api/auth/reset-password` | 404 | `USER_NOT_FOUND` | 등록되지 않은 이메일입니다. |
| 모든 엔드포인트 | 429 | `RATE_LIMIT_EXCEEDED` | 요청이 너무 많습니다. 잠시 후 다시 시도해주세요. |
| 모든 엔드포인트 | 500 | `INTERNAL_SERVER_ERROR` | 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요. |
| 모든 엔드포인트 | 503 | `SERVICE_UNAVAILABLE` | 서비스 점검 중입니다. 잠시 후 다시 시도해주세요. |

**전체 목록**: [BACKEND_INTEGRATION_BRIEF.md](./BACKEND_INTEGRATION_BRIEF.md#주요-엔드포인트별-권장-메시지)

#### 2. CORS 설정 개선

**현재 상태**: 프리플라이트 요청 처리 필요
**요청 사항**: OPTIONS 요청 및 커스텀 헤더 허용

**필수 CORS 헤더**:
```http
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID, X-Client-Version, X-Device-ID, X-Timestamp
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

**프로덕션 Origin 추가** (배포 시):
```
https://bemore-frontend.vercel.app  # 예시
https://www.bemore.com              # 예시
```

**빠른 테스트 방법**:
```bash
# OPTIONS 프리플라이트 요청 테스트
curl -X OPTIONS https://bemorebackend.onrender.com/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, X-Request-ID" \
  -v

# 기대 결과: HTTP 204 No Content
# 기대 헤더: Access-Control-Allow-* 헤더 4개
```

---

### 🔲 선택 항목

#### 3. Analytics 엔드포인트 (선택)

**현재 상태**: Feature Flag로 비활성화 중 (404 에러 방지)
**요청 사항**: Web Vitals 수집 엔드포인트 구현 (선택 사항)

**엔드포인트 스펙**:
```http
POST /api/analytics/vitals
Content-Type: application/json

{
  "metric": "LCP",           // LCP, FID, CLS, TTFB, FCP, INP
  "value": 2345.67,          // 밀리초 (CLS는 비율)
  "pathname": "/app",        // 페이지 경로
  "id": "v3-1234567890123-1234567890123.1234567890",
  "navigationType": "navigate"  // navigate, reload, back_forward
}
```

**응답**:
```json
{
  "success": true,
  "message": "Metric received"
}
```

**구현 우선순위**: 낮음 (추후 구현 가능)

---

## 📚 상세 문서

### 읽는 순서 (권장)

1. **[BACKEND_INTEGRATION_BRIEF.md](./BACKEND_INTEGRATION_BRIEF.md)** (3분)
   - 요청 사항 요약
   - 주요 엔드포인트별 메시지 표
   - 빠른 테스트 방법
   - **👉 먼저 읽어주세요!**

2. **[BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)** (15-20분)
   - 프론트엔드 완료 작업 상세
   - 백엔드 요청 사항 상세 (4개 섹션)
   - 통합 테스트 시나리오 (3개)
   - FAQ (5개)
   - **👉 구현 전 필독!**

3. **[FRONTEND_VERIFICATION_CHECKLIST.md](./FRONTEND_VERIFICATION_CHECKLIST.md)** (참고)
   - 프론트엔드 검증 절차 (백엔드 구현 후)
   - 6개 에러 시나리오 테스트
   - CORS 검증
   - Analytics 검증

---

## 🧪 통합 테스트 시나리오

백엔드 구현 완료 후 다음 시나리오를 함께 테스트합니다:

### 시나리오 1: 로그인 실패 (401)
```bash
# 요청
POST /api/auth/login
{ "email": "test@example.com", "password": "wrongpassword" }

# 기대 응답
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."  // ← 한국어
  }
}

# 프론트엔드 UI
빨간색 에러 박스: "이메일 또는 비밀번호가 올바르지 않습니다."
```

### 시나리오 2: 회원가입 중복 (409)
```bash
# 요청
POST /api/auth/signup
{ "email": "existing@example.com", "password": "ValidPass123!" }

# 기대 응답
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 사용 중인 이메일입니다."  // ← 한국어
  }
}

# 프론트엔드 UI
이메일 필드 아래 에러: "이미 사용 중인 이메일입니다."
```

### 시나리오 3: CORS 프리플라이트
```bash
# OPTIONS 요청 (브라우저 자동 발생)
OPTIONS /api/auth/login
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type, X-Request-ID

# 기대 응답
HTTP 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, ..., X-Request-ID, ...
Access-Control-Allow-Credentials: true
```

**전체 시나리오**: [BACKEND_INTEGRATION_GUIDE.md - 통합 테스트](./BACKEND_INTEGRATION_GUIDE.md#통합-테스트-시나리오)

---

## 🔄 프로세스

### 1. 백엔드 구현 (예상: 2-3시간)

**필수**:
- [ ] 에러 메시지 한국어 변환 (1-1.5시간)
- [ ] CORS 설정 개선 (30분-1시간)

**선택**:
- [ ] Analytics 엔드포인트 (30분-1시간)

### 2. 백엔드 → 프론트엔드 전달 (구현 완료 후)

**전달 방법**: Slack #backend-frontend-integration 채널에 다음 정보 공유

```markdown
## 백엔드 Phase 11 구현 완료

**구현 항목**:
- [x] 에러 메시지 한국어 변환 (8개 엔드포인트)
- [x] CORS 설정 개선 (OPTIONS 지원)
- [ ] Analytics 엔드포인트 (미구현 / 추후)

**배포 정보**:
- 환경: Staging / Production
- URL: https://bemorebackend.onrender.com
- 커밋: [커밋 해시]
- 배포 시간: [시간]

**다음 단계**: 프론트엔드 팀 검증 시작 (40-60분)
```

### 3. 프론트엔드 검증 (백엔드 구현 후, 40-60분)

**프론트엔드 팀 작업**:
1. `.env.local` 설정 (프로덕션 URL 연결)
2. [FRONTEND_VERIFICATION_CHECKLIST.md](./FRONTEND_VERIFICATION_CHECKLIST.md) 절차 진행
3. [VERIFICATION_RESULT.md](./VERIFICATION_RESULT.md) 결과 기록
4. Slack에 검증 결과 공유

### 4. 프로덕션 배포
- 모든 필수 항목 통과 ✅
- 프론트엔드: `VITE_ANALYTICS_ENABLED=true` (Analytics 구현된 경우)
- 배포 일정 조율

---

## 🚨 중요 참고사항

### 에러 메시지 작성 가이드

**✅ 좋은 예**:
- "이메일 또는 비밀번호가 올바르지 않습니다." (구체적, 친절)
- "이미 사용 중인 이메일입니다." (명확한 원인)
- "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." (해결 방법 제시)

**❌ 나쁜 예**:
- "Authentication failed" (영어, 기술적)
- "Error 401" (숫자만, 불친절)
- "Invalid input" (모호함)
- "서버 오류" (해결 방법 없음)

### CORS 설정 주의사항

**보안**:
- 프로덕션에서는 `Access-Control-Allow-Origin: *` 절대 사용 금지
- 허용할 Origin 명시: `http://localhost:5173`, `https://your-domain.com`
- `Access-Control-Allow-Credentials: true` 필수 (쿠키 사용)

**성능**:
- `Access-Control-Max-Age: 86400` 설정 (24시간 캐싱)
- OPTIONS 요청 응답 최적화 (빈 body, 204 상태)

---

## 📞 문의

**Slack**: #backend-frontend-integration
**이슈 트래커**: [GitHub Issues](https://github.com/your-org/bemore-backend/issues)
**긴급 문의**: 프론트엔드 팀 리드

---

## 📎 첨부 파일

| 파일 | 크기 | 용도 |
|------|------|------|
| [BACKEND_INTEGRATION_BRIEF.md](./BACKEND_INTEGRATION_BRIEF.md) | 3KB | 3분 요약 (먼저 읽기) |
| [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) | 14KB | 상세 가이드 (구현 전 필독) |
| [FRONTEND_VERIFICATION_CHECKLIST.md](./FRONTEND_VERIFICATION_CHECKLIST.md) | 12KB | 검증 절차 (구현 후) |
| [VERIFICATION_RESULT.md](./VERIFICATION_RESULT.md) | 3KB | 결과 템플릿 |

---

**생성일**: 2025-01-11
**프론트엔드 커밋**: `6b88dcc` (Phase 11 완료)
**문서 버전**: 1.0

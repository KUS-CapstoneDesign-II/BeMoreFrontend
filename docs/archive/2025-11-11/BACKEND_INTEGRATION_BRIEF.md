# Backend Integration Brief - Quick Reference

**빠른 참조용 문서** | 전체 가이드: [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)

---

## 🎯 요청 사항 요약 (3분 만에 읽기)

### ✅ 1. 에러 메시지는 **반드시 한국어**로

```json
// ❌ 나쁜 예
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Authentication failed: invalid email/password combination"
  }
}

// ✅ 좋은 예
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
  }
}
```

**프론트엔드는 `error.message`를 그대로 사용자에게 표시합니다.**

---

### ✅ 2. CORS 헤더 설정 필수

**필요한 헤더**:
```http
Access-Control-Allow-Origin: https://frontend.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID, X-Client-Version, X-Device-ID, X-Timestamp, X-CSRF-Token
Access-Control-Allow-Credentials: true
```

**OPTIONS 요청 처리**: 모든 엔드포인트에서 OPTIONS 메서드에 204 응답

---

### ✅ 3. Analytics 엔드포인트 (선택 사항)

**구현 필요 시**:
- `POST /api/analytics/vitals` - Web Vitals 수집
- `POST /api/analytics/alert` - 성능 경고

**구현 불필요 시**: 프론트엔드가 Feature Flag로 비활성화 (현재 상태)

---

## 📋 주요 엔드포인트별 권장 메시지

| 엔드포인트 | 상태 | 메시지 (한국어) |
|-----------|------|---------------|
| `POST /api/auth/login` | 401 | "이메일 또는 비밀번호가 올바르지 않습니다." |
| `POST /api/auth/signup` | 409 | "이미 사용 중인 이메일입니다." |
| `POST /api/auth/login` | 429 | "로그인 시도 횟수를 초과했습니다. 5분 후 다시 시도해주세요." |
| All endpoints | 500 | "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요." |

**전체 목록**: [BACKEND_INTEGRATION_GUIDE.md - 섹션 2.1](./BACKEND_INTEGRATION_GUIDE.md#1%EF%B8%8F⃣-에러-응답-형식-표준화-p0---높은-우선순위)

---

## 🧪 빠른 테스트

### 로그인 에러 테스트
```bash
curl -X POST https://backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# 기대 응답 (한국어 확인)
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "requestId": "req_abc123"
  }
}
```

### CORS 테스트
```bash
curl -X OPTIONS https://backend.com/api/auth/login \
  -H "Origin: https://frontend.com" \
  -H "Access-Control-Request-Method: POST"

# 기대 응답: 204 + CORS 헤더
```

---

## ✅ 구현 완료 체크리스트

백엔드 구현 완료 후 다음 항목을 체크하여 프론트엔드에 알려주세요:

```markdown
## 백엔드 구현 완료 보고

### 에러 처리
- [ ] 모든 4xx 에러 응답에 한국어 `error.message` 포함
- [ ] 로그인 에러 (401) - "이메일 또는 비밀번호가 올바르지 않습니다."
- [ ] 중복 이메일 (409) - "이미 사용 중인 이메일입니다."
- [ ] Rate Limit (429) - "로그인 시도 횟수를 초과했습니다. X분 후 다시 시도해주세요."
- [ ] 서버 에러 (5xx) - "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요."

### CORS 설정
- [ ] OPTIONS 프리플라이트 요청 처리 (204 응답)
- [ ] Access-Control-Allow-Origin 헤더 설정
- [ ] Access-Control-Allow-Headers에 커스텀 헤더 포함
  - X-Request-ID
  - X-Client-Version
  - X-Device-ID
  - X-Timestamp
  - X-CSRF-Token

### Analytics (선택 사항)
- [ ] POST /api/analytics/vitals 구현
- [ ] POST /api/analytics/alert 구현
- [ ] 또는 "구현하지 않음" 명시

**프론트엔드 조치**:
- [ ] `.env`에 `VITE_ANALYTICS_ENABLED=true` 추가 (Analytics 구현 시)
```

이 체크리스트를 복사하여 Slack이나 이슈 트래커에 붙여넣어 주세요.

---

## 🚨 흔한 실수

### ❌ 실수 1: 영어 메시지
```json
{ "error": { "message": "Invalid credentials" } }
```
→ **해결**: 한국어로 변경 ("이메일 또는 비밀번호가 올바르지 않습니다.")

### ❌ 실수 2: CORS 헤더 누락
```
Access-Control-Allow-Headers: Content-Type, Authorization
```
→ **해결**: `X-Request-ID, X-Client-Version, X-Device-ID, X-Timestamp` 추가

### ❌ 실수 3: OPTIONS 요청 미처리
```
OPTIONS /api/auth/login → 405 Method Not Allowed
```
→ **해결**: 모든 엔드포인트에서 OPTIONS 메서드 허용 (204 응답)

---

## 📞 질문이 있다면?

- **전체 가이드**: [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)
- **Slack**: #backend-frontend-integration
- **프론트엔드 담당자**: [이름/이메일]

---

**작성**: 프론트엔드 팀
**업데이트**: 2025-01-11

# Frontend Verification Checklist

**목적**: 백엔드 구현 완료 후 프론트엔드 팀이 통합 검증할 때 사용하는 체크리스트
**사용 시점**: 백엔드 팀이 "구현 완료" 알림을 보낸 후

---

## 📋 검증 프로세스 개요

```
백엔드 "구현 완료" 알림
    ↓
1. 로컬 환경 설정 업데이트
    ↓
2. 에러 처리 시나리오 테스트 (30분)
    ↓
3. CORS 검증 (10분)
    ↓
4. Analytics 검증 (선택, 15분)
    ↓
5. 검증 결과 보고
```

**예상 소요 시간**: 40-60분

---

## 🔧 1단계: 로컬 환경 설정

### 1.1 백엔드 API URL 업데이트

**파일**: `.env.local` (또는 `.env`)

```bash
# 백엔드 URL 확인 및 업데이트
VITE_API_URL=https://bemorebackend.onrender.com  # 또는 백엔드가 제공한 URL

# Analytics 활성화 (백엔드가 구현한 경우만)
VITE_ANALYTICS_ENABLED=false  # 일단 false로 시작
```

### 1.2 개발 서버 재시작

```bash
npm run dev
```

**확인**: 브라우저 콘솔에서 Feature Flag 로그 확인
```
🚩 Feature Flags: {
  ANALYTICS_ENABLED: false,
  PERFORMANCE_MONITORING: true,
  ERROR_REPORTING: true
}
```

---

## 🧪 2단계: 에러 처리 시나리오 테스트 (30분)

### 시나리오 1: 로그인 - 잘못된 비밀번호 (필수 ⭐)

**테스트 경로**: `http://localhost:5173/auth/login`

**테스트 단계**:
1. 이메일: `test@example.com`
2. 비밀번호: `wrongpassword123`
3. "로그인" 버튼 클릭

**검증 항목**:
```markdown
- [ ] **HTTP 상태**: Network 탭에서 401 확인
- [ ] **에러 메시지**: "이메일 또는 비밀번호가 올바르지 않습니다." (한국어)
- [ ] **UI 표시**: 빨간색 에러 메시지 박스에 표시됨
- [ ] **기술 메시지 노출 없음**: "Authentication failed" 같은 영어 메시지 안 보임
- [ ] **콘솔 로그**: 개발 환경에서 `❌ API Error` 로그 확인
```

**스크린샷**: 에러 메시지 UI 캡처하여 저장

**실패 시 백엔드에 전달**:
```markdown
❌ 로그인 에러 메시지 검증 실패

**문제**: 백엔드 응답이 영어로 옴
**실제 응답**:
{
  "error": {
    "message": "Authentication failed: invalid credentials"
  }
}

**기대 응답**:
{
  "error": {
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
  }
}

**조치 요청**: backend/controllers/auth.controller.ts에서 에러 메시지 한국어로 변경
```

---

### 시나리오 2: 회원가입 - 중복 이메일 (필수 ⭐)

**테스트 경로**: `http://localhost:5173/auth/signup`

**사전 준비**: 테스트 계정 생성 (`test@example.com`)

**테스트 단계**:
1. 이메일: `test@example.com` (이미 존재하는 이메일)
2. 비밀번호: `ValidPass123!`
3. 이름: `테스트유저`
4. "회원가입" 버튼 클릭

**검증 항목**:
```markdown
- [ ] **HTTP 상태**: Network 탭에서 409 확인
- [ ] **에러 메시지**: "이미 사용 중인 이메일입니다." (한국어)
- [ ] **UI 표시**: 이메일 입력 필드 아래 빨간색 메시지
- [ ] **error.code**: 콘솔에서 "EMAIL_ALREADY_EXISTS" 확인
```

---

### 시나리오 3: Rate Limit - 로그인 시도 초과 (중요)

**테스트 경로**: `http://localhost:5173/auth/login`

**테스트 단계**:
1. 동일한 이메일로 5-10회 연속 로그인 실패 시도
2. Rate Limit 발생 확인

**검증 항목**:
```markdown
- [ ] **HTTP 상태**: Network 탭에서 429 확인
- [ ] **에러 메시지**: "로그인 시도 횟수를 초과했습니다. X분 후 다시 시도해주세요." (한국어)
- [ ] **구체적 안내**: 재시도 가능 시간이 명시됨
- [ ] **UI 표시**: 에러 메시지 박스에 표시
```

**백엔드 미구현 시**:
```markdown
⚠️ Rate Limit 미구현

현재 백엔드에서 Rate Limiting이 구현되지 않았습니다.
보안상 권장하지만, Phase 1에서는 선택 사항입니다.

**권장 구현 시점**: Phase 2 보안 강화 단계
```

---

### 시나리오 4: 서버 에러 (5xx) (필수 ⭐)

**테스트 방법**: 백엔드 팀에 일부러 500 에러를 발생시키는 테스트 엔드포인트 요청

또는 직접 시뮬레이션:
```typescript
// src/services/shared/apiClient.ts에 임시 추가
apiClient.interceptors.response.use(
  (response) => {
    // 임시: 500 에러 시뮬레이션
    if (response.config.url?.includes('/auth/login')) {
      throw { response: { status: 500, data: { error: { message: 'Internal Server Error' } } } };
    }
    return response;
  }
);
```

**검증 항목**:
```markdown
- [ ] **에러 메시지**: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요." (한국어)
- [ ] **기술 스택 트레이스 노출 없음**: 사용자에게 서버 내부 정보 노출 안 됨
- [ ] **UI 표시**: 일반적인 에러 메시지 박스
```

**시뮬레이션 코드 제거**: 테스트 후 반드시 임시 코드 삭제

---

### 시나리오 5: 네트워크 오프라인 (필수 ⭐)

**테스트 방법**:
1. Chrome DevTools → Network 탭 → "Offline" 선택
2. 로그인 시도

**검증 항목**:
```markdown
- [ ] **에러 메시지**: "서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요." (한국어)
- [ ] **userMessage 사용**: axios interceptor가 생성한 메시지
- [ ] **콘솔 로그**: "❌ API Error - Network Error" 확인
```

**테스트 후**: Network 탭에서 "Online"으로 복원

---

### 시나리오 6: 타임아웃 (30초) (중요)

**테스트 방법**:
1. Chrome DevTools → Network 탭 → "Slow 3G" 선택
2. 백엔드 팀에 30초 이상 걸리는 테스트 엔드포인트 요청

또는 시뮬레이션:
```typescript
// src/services/shared/apiClient.ts에서 timeout 값 임시 변경
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // 5초로 줄여서 테스트
});
```

**검증 항목**:
```markdown
- [ ] **에러 메시지**: "요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요." (한국어)
- [ ] **userMessage 사용**: axios interceptor가 생성한 메시지
- [ ] **UI 표시**: 타임아웃 안내
```

---

## 🌐 3단계: CORS 검증 (10분)

### 3.1 OPTIONS 프리플라이트 요청 확인

**테스트 경로**: `http://localhost:5173/auth/login`

**테스트 단계**:
1. Chrome DevTools → Network 탭 열기
2. 로그인 시도 (정상 또는 실패 무관)
3. Network 탭에서 OPTIONS 요청 확인

**검증 항목**:
```markdown
- [ ] **OPTIONS 요청 존재**: `/api/auth/login`에 대한 OPTIONS 요청 확인
- [ ] **HTTP 상태**: 204 No Content
- [ ] **응답 헤더 확인**:
  - [ ] `Access-Control-Allow-Origin: http://localhost:5173`
  - [ ] `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
  - [ ] `Access-Control-Allow-Headers: ... X-Request-ID ...` (커스텀 헤더 포함)
  - [ ] `Access-Control-Allow-Credentials: true`
```

**스크린샷**: Network 탭 OPTIONS 요청 헤더 캡처

---

### 3.2 실제 POST 요청 CORS 확인

**테스트 단계**:
1. 로그인 시도
2. Network 탭에서 POST 요청 확인

**검증 항목**:
```markdown
- [ ] **CORS 에러 없음**: 콘솔에 CORS 관련 에러 메시지 없음
- [ ] **요청 헤더 전달**:
  - [ ] `Authorization: Bearer ...` (로그인 후 요청 시)
  - [ ] `X-Request-ID: req_...`
  - [ ] `X-Client-Version: 1.0.0`
  - [ ] `X-Device-ID: device_...`
  - [ ] `X-Timestamp: ...`
- [ ] **응답 수신**: 정상적으로 응답 받음 (200/400/401 등)
```

---

### 3.3 CORS 에러 발생 시 백엔드 전달

```markdown
❌ CORS 검증 실패

**문제**: 브라우저 콘솔에 CORS 에러 발생
**에러 메시지**:
```
Access to XMLHttpRequest at 'https://backend.com/api/auth/login' from origin 'http://localhost:5173' has been blocked by CORS policy: Request header field x-request-id is not allowed by Access-Control-Allow-Headers in preflight response.
```

**원인**: OPTIONS 응답에 커스텀 헤더가 누락됨

**요청 사항**:
Access-Control-Allow-Headers에 다음 헤더 추가:
- X-Request-ID
- X-Client-Version
- X-Device-ID
- X-Timestamp
- X-CSRF-Token

**참고**: [BACKEND_INTEGRATION_GUIDE.md - CORS 섹션](./BACKEND_INTEGRATION_GUIDE.md#2%EF%B8%8F⃣-cors-헤더-설정-p0---필수)
```

---

## 📊 4단계: Analytics 검증 (선택, 15분)

**⚠️ 주의**: 백엔드가 Analytics 엔드포인트를 구현한 경우에만 진행

### 4.1 Analytics 활성화

**파일**: `.env.local`

```bash
VITE_ANALYTICS_ENABLED=true
```

**개발 서버 재시작**:
```bash
npm run dev
```

**확인**: 브라우저 콘솔에서 Feature Flag 변경 확인
```
🚩 Feature Flags: {
  ANALYTICS_ENABLED: true,  // ← true로 변경됨
  ...
}
```

---

### 4.2 Web Vitals 전송 확인

**테스트 경로**: `http://localhost:5173/app` (로그인 후 대시보드)

**테스트 단계**:
1. 페이지 로드
2. 3-5초 대기 (Web Vitals 측정 완료)
3. Network 탭 확인

**검증 항목**:
```markdown
- [ ] **POST /api/analytics/vitals 요청 확인**:
  - [ ] 여러 요청 발생 (LCP, FID, CLS 등 각각)
  - [ ] HTTP 상태: 200
  - [ ] 요청 Body에 메트릭 데이터 포함:
    ```json
    {
      "name": "LCP",
      "value": 2345.67,
      "rating": "good",
      "timestamp": "2025-01-11T12:34:56.789Z"
    }
    ```
- [ ] **콘솔 에러 없음**: 404 에러 발생하지 않음
- [ ] **개발 환경 로그**: 콘솔에 Web Vitals 로그 표시
  ```
  📊 Web Vitals: LCP { value: '2345ms', rating: 'good', id: 'v3-...' }
  ```
```

**스크린샷**: Network 탭에서 `/api/analytics/vitals` 요청 캡처

---

### 4.3 성능 경고 전송 확인 (선택)

**테스트 방법**: 의도적으로 느린 페이지 로드 시뮬레이션

1. Chrome DevTools → Network 탭 → "Slow 3G" 선택
2. 페이지 새로고침
3. LCP가 4000ms 이상 걸리도록 대기

**검증 항목**:
```markdown
- [ ] **POST /api/analytics/alert 요청 확인**:
  - [ ] HTTP 상태: 200
  - [ ] 요청 Body에 경고 메시지 포함:
    ```json
    {
      "message": "⚠️ Warning: LCP (4500ms)",
      "timestamp": "2025-01-11T12:34:56.789Z",
      "url": "http://localhost:5173/app"
    }
    ```
- [ ] **개발 환경 로그**: 콘솔에 경고 로그 표시
```

---

### 4.4 Analytics 비활성화 재확인

**파일**: `.env.local`

```bash
VITE_ANALYTICS_ENABLED=false
```

**개발 서버 재시작** 후 확인:

```markdown
- [ ] **요청 발생 안 함**: Network 탭에 `/api/analytics/*` 요청 없음
- [ ] **콘솔 로그만 표시**: 개발 환경에서 로컬 로그만 출력
- [ ] **404 에러 없음**: Feature Flag가 정상 동작
```

---

## 📝 5단계: 검증 결과 보고

### 5.1 검증 결과 문서 작성

**파일**: `VERIFICATION_RESULT.md` (프로젝트 루트에 생성)

```markdown
# Frontend Integration Verification Result

**검증일**: 2025-01-11
**검증자**: [이름]
**백엔드 버전**: [백엔드 팀이 제공한 버전]
**백엔드 URL**: https://bemorebackend.onrender.com

---

## ✅ 통과한 항목

### 에러 처리
- [x] 로그인 - 잘못된 비밀번호 (401)
  - 메시지: "이메일 또는 비밀번호가 올바르지 않습니다."
  - 스크린샷: [screenshots/login-error-401.png]

- [x] 회원가입 - 중복 이메일 (409)
  - 메시지: "이미 사용 중인 이메일입니다."
  - 스크린샷: [screenshots/signup-error-409.png]

- [x] 서버 에러 (5xx)
  - 메시지: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요."

- [x] 네트워크 오프라인
  - 메시지: "서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요."

### CORS
- [x] OPTIONS 프리플라이트 요청 (204)
- [x] 커스텀 헤더 전달 (X-Request-ID, X-Client-Version, ...)
- [x] 실제 POST 요청 성공
- [x] 콘솔에 CORS 에러 없음

---

## ❌ 실패한 항목

### Rate Limit (429)
- [ ] 백엔드에서 Rate Limiting 미구현
- **상태**: Phase 1에서는 선택 사항, Phase 2 보안 강화 단계에서 구현 권장
- **조치 필요**: 없음 (선택 사항)

---

## ⚠️ 부분 통과 / 개선 필요

### 타임아웃 (30초)
- [x] 에러 메시지 정상 표시
- [ ] 실제 30초 타임아웃 테스트 불가 (백엔드 테스트 엔드포인트 없음)
- **조치**: 실제 프로덕션에서 재확인 필요

---

## 📊 Analytics (선택 사항)

- [ ] **미구현**: 백엔드에서 Analytics 엔드포인트를 구현하지 않음
- **프론트엔드 조치**: Feature Flag로 비활성화 유지 (VITE_ANALYTICS_ENABLED=false)
- **영향**: 없음 (Phase 1에서는 선택 사항)

---

## 🎯 종합 평가

**통과율**: 8/10 (80%)

**P0 필수 항목**: ✅ 모두 통과
- 에러 메시지 한국어 표시
- CORS 설정 정상
- 네트워크 에러 처리

**P1 선택 항목**: ⚠️ 부분 통과
- Rate Limiting 미구현 (선택 사항)
- Analytics 미구현 (선택 사항)

**프로덕션 배포 가능 여부**: ✅ 가능
- 모든 필수 항목 통과
- 선택 항목은 향후 단계에서 구현 가능

---

## 📸 스크린샷

- [screenshots/login-error-401.png] - 로그인 에러 UI
- [screenshots/signup-error-409.png] - 회원가입 중복 이메일
- [screenshots/network-cors-options.png] - OPTIONS 프리플라이트 요청
- [screenshots/network-post-headers.png] - POST 요청 커스텀 헤더

---

## 💬 피드백 및 개선 제안

### 백엔드 팀에 전달
- [선택] Rate Limiting 구현 권장 (Phase 2)
- [선택] Analytics 엔드포인트 구현 (Phase 2-3)

### 프론트엔드 팀 자체 개선
- 없음

---

**검증 완료일**: 2025-01-11
**다음 검증**: Phase 2 배포 전
```

---

### 5.2 Slack/이메일 알림

**Slack 채널**: `#backend-frontend-integration`

**메시지 템플릿**:
```
🎉 백엔드 통합 검증 완료!

**검증일**: 2025-01-11
**백엔드 버전**: v1.2.3
**통과율**: 8/10 (80%)

**✅ 통과**: 로그인/회원가입 에러, CORS 설정, 네트워크 에러 처리
**⚠️ 선택 사항 미구현**: Rate Limiting, Analytics (Phase 2에서 구현 가능)

**프로덕션 배포**: ✅ 가능

상세 결과: [VERIFICATION_RESULT.md 링크]
스크린샷: [Google Drive/Notion 링크]

질문 있으시면 답글 부탁드립니다! 👍
```

---

## 🔄 재검증이 필요한 경우

다음 경우에는 이 체크리스트를 다시 실행해야 합니다:

1. **백엔드 에러 메시지 변경 시**
   - 에러 처리 시나리오 1-6 재실행

2. **백엔드 CORS 설정 변경 시**
   - CORS 검증 3.1-3.2 재실행

3. **백엔드 Analytics 엔드포인트 신규 구현 시**
   - Analytics 검증 4.1-4.4 실행

4. **프로덕션 배포 전**
   - 전체 체크리스트 재실행 (프로덕션 URL로)

---

## 📚 참고 자료

- [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) - 백엔드 요청 사항 전체 가이드
- [BACKEND_INTEGRATION_BRIEF.md](./BACKEND_INTEGRATION_BRIEF.md) - 빠른 참조용
- [Chrome DevTools Network 가이드](https://developer.chrome.com/docs/devtools/network/)

---

**작성**: 프론트엔드 팀
**최종 업데이트**: 2025-01-11
**버전**: 1.0.0

# 백엔드 팀 전달용 이메일 템플릿

**To**: backend-team@company.com
**Cc**: project-manager@company.com
**Subject**: [BeMore] 프론트엔드 Phase 11 완료 - 백엔드 구현 요청 (2-3시간 예상)

---

안녕하세요 백엔드 팀,

프론트엔드에서 **Phase 11 Backend Integration** 작업을 완료했습니다.

백엔드 팀에서 2가지 필수 항목을 구현해주시면 프로덕션 배포가 가능합니다.

---

## 📋 요약

**프론트엔드 완료**:
- ✅ CORS-Friendly Error Handler (사용자 친화적 한국어 에러 메시지)
- ✅ Analytics Feature Flag System (404 에러 방지)
- ✅ 통합 문서 4개 작성

**백엔드 요청** (2-3시간 예상):
- ⭐ **필수 1**: 에러 메시지 한국어 변환 (1-1.5시간)
- ⭐ **필수 2**: CORS 설정 개선 (30분-1시간)
- 🔲 **선택**: Analytics 엔드포인트 (30분-1시간, 추후 가능)

---

## 🎯 백엔드 요청 사항 (상세)

### 1. 에러 메시지 한국어 변환 ⭐

**현재 상태**: 백엔드가 영어 메시지 반환 중
**요청 사항**: 모든 에러 응답의 `error.message`를 한국어로 변환

**에러 응답 형식**:
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
- `POST /api/auth/login` (401): "이메일 또는 비밀번호가 올바르지 않습니다."
- `POST /api/auth/signup` (409): "이미 사용 중인 이메일입니다."
- Rate Limit (429): "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
- Server Error (500): "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."

**전체 메시지 목록**: 첨부 문서 [BACKEND_INTEGRATION_BRIEF.md] 참고

### 2. CORS 설정 개선 ⭐

**요청 사항**: OPTIONS 프리플라이트 요청 및 커스텀 헤더 허용

**필수 CORS 헤더**:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID, X-Client-Version, X-Device-ID, X-Timestamp
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

**빠른 테스트**:
```bash
curl -X OPTIONS https://bemorebackend.onrender.com/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

기대 결과: HTTP 204 No Content + Access-Control-Allow-* 헤더 4개

### 3. Analytics 엔드포인트 (선택) 🔲

**요청 사항**: Web Vitals 수집 엔드포인트 (추후 구현 가능)

```http
POST /api/analytics/vitals
Content-Type: application/json

{
  "metric": "LCP",
  "value": 2345.67,
  "pathname": "/app",
  "id": "v3-1234567890123-1234567890123.1234567890",
  "navigationType": "navigate"
}
```

**우선순위**: 낮음 (프론트엔드에서 Feature Flag로 비활성화 중)

---

## 🧪 통합 테스트 시나리오

구현 완료 후 다음 3가지 시나리오를 함께 테스트합니다:

**시나리오 1**: 로그인 실패 (401) → 한국어 에러 메시지 확인
**시나리오 2**: 회원가입 중복 (409) → 한국어 에러 메시지 확인
**시나리오 3**: CORS 프리플라이트 → OPTIONS 요청 처리 확인

**전체 시나리오**: 첨부 문서 [BACKEND_INTEGRATION_GUIDE.md - 통합 테스트] 참고

---

## 📚 첨부 문서

**읽는 순서** (권장):

1. **BACKEND_INTEGRATION_BRIEF.md** (3분) - 먼저 읽어주세요!
   - 요청 사항 요약
   - 주요 엔드포인트별 메시지 표
   - 빠른 테스트 방법

2. **BACKEND_INTEGRATION_GUIDE.md** (15분) - 구현 전 필독!
   - 상세 구현 가이드
   - 통합 테스트 시나리오
   - FAQ (5개)

3. **BACKEND_INTEGRATION_COMPLETE.md** (10분) - 전체 프로세스
   - 프론트엔드 완료 작업
   - 프로세스 워크플로우
   - 주의사항

4. **FRONTEND_VERIFICATION_CHECKLIST.md** (참고)
   - 프론트엔드 검증 절차 (구현 후)

**문서 위치**: GitHub 저장소 루트 디렉토리
**프론트엔드 커밋**: `0ed506e` (Phase 11 완료)

---

## 🔄 다음 단계

### 1. 백엔드 구현 (예상: 2-3시간)
- [ ] 에러 메시지 한국어 변환
- [ ] CORS 설정 개선
- [ ] (선택) Analytics 엔드포인트

### 2. 구현 완료 후 회신
다음 정보를 회신 또는 Slack #backend-frontend-integration 채널에 공유 부탁드립니다:

```
구현 항목: [완료된 항목]
배포 환경: Staging / Production
배포 URL: https://bemorebackend.onrender.com
커밋 해시: [커밋 해시]
배포 시간: [시간]
```

### 3. 프론트엔드 검증 (40-60분)
프론트엔드 팀에서 FRONTEND_VERIFICATION_CHECKLIST.md 절차 진행

### 4. 프로덕션 배포
모든 필수 항목 통과 후 배포 일정 조율

---

## 📞 문의

**Slack**: #backend-frontend-integration
**이메일**: frontend-team@company.com
**긴급 문의**: 프론트엔드 팀 리드 (010-XXXX-XXXX)

구현 중 궁금하신 점이나 논의가 필요한 사항이 있으시면 언제든지 연락 주세요!

감사합니다.

---

**프론트엔드 팀**
**날짜**: 2025-01-11
**문서 버전**: 1.0

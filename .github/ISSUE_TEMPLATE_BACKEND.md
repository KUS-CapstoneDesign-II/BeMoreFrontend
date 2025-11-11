---
name: Backend Integration Request (Phase 11)
about: 프론트엔드 Phase 11 완료에 따른 백엔드 구현 요청
title: '[Phase 11] Backend Integration - 에러 메시지 한국어 & CORS 설정'
labels: backend, integration, P0
assignees: ''
---

## 📋 요약

프론트엔드 Phase 11 Backend Integration 작업 완료에 따라 백엔드 구현을 요청드립니다.

**핸드오프 문서**: [BACKEND_INTEGRATION_COMPLETE.md](../BACKEND_INTEGRATION_COMPLETE.md)

---

## ✅ 백엔드 요청 사항

### 필수 (⭐)

- [ ] **에러 메시지 한국어 변환** (1-1.5시간)
  - 모든 에러 응답 `error.message` 필드를 한국어로 변환
  - 8개 주요 엔드포인트 (로그인, 회원가입, 비밀번호 재설정 등)
  - 권장 메시지 표: [BACKEND_INTEGRATION_BRIEF.md](../BACKEND_INTEGRATION_BRIEF.md#주요-엔드포인트별-권장-메시지)

- [ ] **CORS 설정 개선** (30분-1시간)
  - OPTIONS 프리플라이트 요청 처리
  - 커스텀 헤더 허용: `X-Request-ID`, `X-Client-Version`, `X-Device-ID`, `X-Timestamp`
  - `Access-Control-Allow-Credentials: true` 설정
  - 설정 가이드: [BACKEND_INTEGRATION_GUIDE.md - CORS](../BACKEND_INTEGRATION_GUIDE.md#2-cors-헤더-설정)

### 선택 (추후 구현 가능)

- [ ] **Analytics 엔드포인트** (30분-1시간)
  - `POST /api/analytics/vitals` - Web Vitals 수집
  - 스펙: [BACKEND_INTEGRATION_GUIDE.md - Analytics](../BACKEND_INTEGRATION_GUIDE.md#3-analytics-엔드포인트-구현-선택)

---

## 🧪 통합 테스트 시나리오

구현 완료 후 다음 시나리오를 함께 테스트합니다:

### 시나리오 1: 로그인 실패 (401)
```json
// 요청: POST /api/auth/login
{ "email": "test@example.com", "password": "wrongpassword" }

// 기대 응답
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."  // ← 한국어
  }
}
```

### 시나리오 2: 회원가입 중복 (409)
```json
// 요청: POST /api/auth/signup
{ "email": "existing@example.com", "password": "ValidPass123!" }

// 기대 응답
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 사용 중인 이메일입니다."  // ← 한국어
  }
}
```

### 시나리오 3: CORS 프리플라이트
```bash
# OPTIONS 요청 테스트
curl -X OPTIONS https://bemorebackend.onrender.com/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v

# 기대 응답: HTTP 204 No Content
# 기대 헤더: Access-Control-Allow-* 4개
```

**전체 시나리오**: [BACKEND_INTEGRATION_GUIDE.md - 통합 테스트](../BACKEND_INTEGRATION_GUIDE.md#통합-테스트-시나리오)

---

## 📚 상세 문서

**읽는 순서** (권장):

1. **[BACKEND_INTEGRATION_BRIEF.md](../BACKEND_INTEGRATION_BRIEF.md)** (3분)
   - 요청 사항 요약
   - 주요 엔드포인트별 메시지 표
   - 👉 **먼저 읽어주세요!**

2. **[BACKEND_INTEGRATION_GUIDE.md](../BACKEND_INTEGRATION_GUIDE.md)** (15분)
   - 상세 구현 가이드
   - 통합 테스트 시나리오
   - FAQ
   - 👉 **구현 전 필독!**

3. **[BACKEND_INTEGRATION_COMPLETE.md](../BACKEND_INTEGRATION_COMPLETE.md)** (10분)
   - 전체 프로세스
   - 프론트엔드 완료 작업
   - 주의사항

4. **[FRONTEND_VERIFICATION_CHECKLIST.md](../FRONTEND_VERIFICATION_CHECKLIST.md)** (참고)
   - 프론트엔드 검증 절차 (구현 후)

---

## 🔄 다음 단계

### 백엔드 구현 (2-3시간 예상)
- [ ] 에러 메시지 한국어 변환
- [ ] CORS 설정 개선
- [ ] (선택) Analytics 엔드포인트

### 백엔드 → 프론트엔드 전달
구현 완료 후 다음 정보를 Slack #backend-frontend-integration 채널에 공유:

```markdown
## 백엔드 Phase 11 구현 완료

**구현 항목**:
- [x] 에러 메시지 한국어 변환
- [x] CORS 설정 개선
- [ ] Analytics 엔드포인트 (미구현/추후)

**배포 정보**:
- 환경: Staging / Production
- URL: https://bemorebackend.onrender.com
- 커밋: [커밋 해시]
- 배포 시간: [시간]

**다음 단계**: 프론트엔드 팀 검증 시작 (40-60분)
```

### 프론트엔드 검증 (40-60분)
프론트엔드 팀에서 [FRONTEND_VERIFICATION_CHECKLIST.md](../FRONTEND_VERIFICATION_CHECKLIST.md) 진행

### 프로덕션 배포
모든 필수 항목 통과 후 배포 일정 조율

---

## 📞 문의

**Slack**: #backend-frontend-integration
**긴급 문의**: 프론트엔드 팀 리드

---

**생성일**: 2025-01-11
**프론트엔드 커밋**: `0ed506e`
**예상 소요 시간**: 2-3시간

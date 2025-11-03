# Backend → Frontend 공식 전달 메시지

**발신**: Backend Team (Phase 4 완료)
**수신**: Frontend 개발 팀
**날짜**: 2025-11-03
**주제**: Phase 9 Frontend 구현과의 통합 준비 완료

---

## 🎉 좋은 소식!

Backend Phase 4 구현이 완료되었으며, **Frontend Phase 9와의 통합 준비가 완벽하게 완료**되었습니다. 🚀

당신들이 Phase 9에서 구현한 모든 것과 완벽하게 호환되며, 바로 통합을 시작할 수 있습니다.

---

## ⚡ 5분 요약

### ✅ Backend에서 완료된 것

- ✅ **20+ API 엔드포인트** - 모두 구현 완료
- ✅ **신규 batch-tick** - Frontend의 배치 처리를 위한 새로운 엔드포인트 ✨
- ✅ **Rate Limiting 보호** - 429 상태코드 + Retry-After 헤더
- ✅ **멀티모달 데이터 수집** - 표정, 음성, 텍스트
- ✅ **1분 주기 분석** - 감정 점수 자동 계산
- ✅ **완전한 문서화** - 4가지 포맷 제공
- ✅ **테스트 스크립트** - demo.http, demo.sh 제공

### 📊 Request Volume 개선

| 메트릭 | 기존 | 신규 | 개선 |
|--------|------|------|------|
| 분당 요청 수 | 60-120 | 1 | **60배 ↓** |
| 세션당 요청 수 | 180-360 | 3-5 | **60배 ↓** |
| 네트워크 효율성 | - | - | **10배 집계** |

---

## 📚 문서 읽기 순서

### 1️⃣ 빠른 시작 (5분) - **모든 개발자 필수** 👈

📄 **QUICK_START_INTEGRATION.md** 읽을 내용:
- 최소 필수 API 3개 (start, batch-tick, end)
- 데이터 형식 (점수 범위, sentiment, 타임스탐프)
- 재시도 처리 및 에러 코드
- 통합 체크리스트

| 항목 | 내용 |
|------|------|
| **소요시간** | 5분 |
| **대상** | 전체 팀 |
| **액션** | 전체 이해, 최소 API 파악 |

---

### 2️⃣ 공식 전달서 (15분) - **Frontend 팀 리더**

📄 **FRONTEND_BACKEND_COMPATIBILITY_HANDOFF.md** 읽을 내용:
- 공식 호환성 선언
- 전체 API 요약 (20+ 엔드포인트)
- batch-tick 상세 스펙 + 예제
- 5단계 통합 가이드 (코드 예제 포함)
- 재시도 정책 및 Rate Limiting
- Q&A 섹션

| 항목 | 내용 |
|------|------|
| **소요시간** | 15분 |
| **대상** | Frontend 팀 리더 |
| **액션** | 팀 공유, 구현 계획 수립 |

---

### 3️⃣ 상세 기술 참고 (30분) - **기술 리더/엔지니어**

📄 **FRONTEND_BACKEND_API_COMPATIBILITY_DETAILED.md** 읽을 내용:
- API별 상세 사양
- 요청/응답 예제 코드
- Rate Limiting 구현 상세
- 에러 코드 명세
- 성능 특성 및 SLA
- 액션 아이템 체크리스트

| 항목 | 내용 |
|------|------|
| **소요시간** | 30분 |
| **대상** | 기술 리더, Backend 개발자 |
| **액션** | 호환성 확인, 기술 사전 검토 |

---

## 🧪 테스트 방법

### 방법 1️⃣: REST Client (추천) ⭐

```
VSCode에서 아래 파일을 열고 "Send Request" 클릭

📄 docs/integration/test-scripts/demo.http
```

**장점**:
- 한 번에 전체 2분 세션 워크플로우 테스트
- 변수 자동 체이닝 (@sessionId 등)
- UI에서 응답 실시간 확인
- 재시도 로직 검증 가능

**테스트 순서**:
```
1. POST /api/session/start → sessionId 획득
2. POST /api/session/batch-tick (1분 배치 데이터)
3. GET /api/session/{sessionId} → 상태 확인
4. POST /api/session/{sessionId}/end → 종료
```

---

### 방법 2️⃣: Bash 자동화 스크립트

```bash
# 터미널에서 실행
bash docs/integration/test-scripts/demo.sh

# 또는 더 긴 세션 테스트 (10분 시뮬레이션)
bash docs/integration/test-scripts/demo.sh --long
```

**장점**:
- 자동화된 전체 플로우
- 색상 코딩 출력
- 상세 로깅
- 배치 처리 연속 테스트

---

### 방법 3️⃣: JavaScript/Fetch (Frontend 코드)

```javascript
// 1단계: 세션 생성
const response = await fetch('http://localhost:8000/api/session/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_001',
    counselorId: 'counselor_001'
  })
});

const { data } = await response.json();
const sessionId = data.sessionId;

// 2단계: batch-tick 호출 (1분마다)
await fetch('http://localhost:8000/api/session/batch-tick', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    items: [{
      minuteIndex: 0,
      facialScore: 0.85,
      vadScore: 0.72,
      textScore: 0.60,
      combinedScore: 0.747,
      sentiment: 'positive',
      confidence: 0.92,
      timestamp: new Date().toISOString(),
      durationMs: 60000,
      keywords: ['confident', 'engaged']
    }]
  })
});

// 3단계: 세션 종료
await fetch(`http://localhost:8000/api/session/${sessionId}/end`, {
  method: 'POST'
});
```

---

## 📋 통합 체크리스트

### Phase 1: 검토 (오늘/내일)

- [ ] QUICK_START_INTEGRATION.md 읽기 (모든 팀)
- [ ] FRONTEND_BACKEND_COMPATIBILITY_HANDOFF.md 검토 (팀 리더)
- [ ] FRONTEND_BACKEND_API_COMPATIBILITY_DETAILED.md 확인 (기술 리더)
- [ ] 팀 미팅 진행: 통합 계획 수립

**예상 시간**: 1시간

---

### Phase 2: 로컬 테스트 (1-2일)

- [ ] Backend API 로컬 실행 확인
- [ ] demo.http 또는 demo.sh로 전체 워크플로우 테스트
- [ ] batch-tick 엔드포인트 동작 확인
- [ ] Rate Limit 테스트 (429 응답 확인)
- [ ] 재시도 로직 검증

**예상 시간**: 4-8시간

---

### Phase 3: 통합 구현 (2-3일)

- [ ] 세션 생성 (POST /start) 호출
- [ ] 데이터 수집 (frames, audio, stt)
- [ ] batch-tick으로 분석 결과 저장 (1분마다)
- [ ] 세션 종료 (POST /end) 호출
- [ ] 최종 리포트 확인

**예상 시간**: 16-24시간

---

### Phase 4: QA & 배포 (1-2일)

- [ ] 엔드-투-엔드 통합 테스트
- [ ] 성능 테스트 (배치 처리 효율성)
- [ ] Staging 배포
- [ ] Production 배포

**예상 시간**: 8-16시간

---

## 🔑 핵심 API 3개

### 1️⃣ 세션 시작

```bash
POST http://localhost:8000/api/session/start
Content-Type: application/json

{
  "userId": "user_001",
  "counselorId": "counselor_001"
}

# 응답
{
  "data": {
    "sessionId": "sess_20251103_143000_abc123",
    "startedAt": "2025-11-03T14:30:00Z"
  }
}
```

---

### 2️⃣ 배치 분석 저장 (NEW) ✨

```bash
POST http://localhost:8000/api/session/batch-tick
Content-Type: application/json

{
  "sessionId": "sess_20251103_143000_abc123",
  "items": [
    {
      "minuteIndex": 0,
      "facialScore": 0.85,
      "vadScore": 0.72,
      "textScore": 0.60,
      "combinedScore": 0.747,
      "sentiment": "positive",
      "confidence": 0.92,
      "timestamp": "2025-11-03T14:30:00Z",
      "durationMs": 60000,
      "keywords": ["confident", "engaged"]
    }
  ]
}

# 응답
{
  "count": 1,
  "batchId": "batch-sess_...-20251103-143000",
  "timestamp": "2025-11-03T14:30:05.123Z"
}
```

---

### 3️⃣ 세션 종료

```bash
POST http://localhost:8000/api/session/{sessionId}/end
Content-Type: application/json

# 응답
{
  "id": "sess_...",
  "status": "completed",
  "result": {
    "overallScore": 0.72,
    "sentiment": "positive",
    "duration": 600000,
    "analysisCount": 10
  }
}
```

---

## ⚠️ 주의사항

### ✅ 올바른 사용

```javascript
// batch-tick: 1-100개 항목 지원
{
  "items": [
    { "minuteIndex": 0, ... }  // 1개 ✅
  ]
}

{
  "items": [
    { "minuteIndex": 0, ... },
    { "minuteIndex": 1, ... }  // 2개 이상 ✅
  ]
}

// 점수 범위: 0-1 정규화
{
  "facialScore": 0.85     // 0-1 사이 ✅
}

// Sentiment: 정확한 값만
{
  "sentiment": "positive"   // ✅
  "sentiment": "neutral"    // ✅
  "sentiment": "negative"   // ✅
}
```

### ❌ 주의

```javascript
// batch-tick: 배열은 필수
{
  "items": []           // ❌ 에러: 최소 1개 필요
}

// 점수 범위 위반
{
  "facialScore": 1.5    // ❌ 에러: 최대 1.0
  "facialScore": -0.1   // ❌ 에러: 최소 0.0
}

// Sentiment 오타
{
  "sentiment": "Positive"   // ❌ 대문자 금지
  "sentiment": "happy"      // ❌ 정확한 값만 사용
}
```

---

## 📊 데이터 형식 상세

### 점수 (모두 0-1 범위)

```javascript
{
  "facialScore": 0.85,      // 표정 감지 (0=무표정, 1=강한 감정)
  "vadScore": 0.72,         // 음성 활동도 (0=침묵, 1=활발)
  "textScore": 0.60,        // 텍스트 감정 (0=부정, 1=긍정)
  "combinedScore": 0.747,   // 종합 점수 (3개의 가중평균)
  "confidence": 0.92        // 신뢰도 (0=낮음, 1=높음)
}
```

### Sentiment 값

```javascript
{
  "sentiment": "positive"   // 긍정적 (행복, 자신감, 몰입)
  "sentiment": "neutral"    // 중립적 (차분, 집중, 안정)
  "sentiment": "negative"   // 부정적 (좌절, 혼동, 우려)
}
```

### 타임스탐프

```javascript
{
  "timestamp": "2025-11-03T14:30:00Z"    // ISO8601 (UTC)
  "timestamp": "2025-11-03T14:30:00.123Z" // 밀리초 포함 권장
}
```

---

## 🔄 Rate Limiting 처리

### Backend에서 429 에러 반환 시

```
응답 상태: 429 Too Many Requests
응답 헤더: Retry-After: 45
의미: 45초 후에 재시도하세요
```

### Frontend의 자동 재시도 로직

```javascript
// Phase 9에서 구현된 지수 백오프:

1차 시도: 즉시
  ↓ [실패 → 429]

2차 시도: 1초 + 지터(0-20%) 대기 후
  ↓ [실패 → 429]

3차 시도: 3초 + 지터(0-20%) 대기 후
  ↓ [실패 → 429]

4차 시도: 10초 + 지터(0-20%) 대기 후
  ↓ [실패 → 429]

최종: 포기
- 로컬에 데이터 저장
- 다음 배치에서 재시도
```

---

## ❓ 자주 묻는 질문

### Q: batch-tick과 tick의 차이?

**A:**
```
batch-tick: Frontend가 계산한 점수를 저장 (배치 처리)
  - Frontend에서 호출
  - 1분마다 10개 항목씩
  - API 호출 60배 감소

tick: Backend가 저장된 frames/audio/stt로부터 계산
  - Backend 내부 처리
  - 실시간 또는 배치 모드

둘 다 사용 가능하거나, 하나만 선택 가능합니다.
```

---

### Q: batch-tick은 얼마나 자주 호출?

**A:** 약 **1분마다** (1 요청/분)
- 또는 10개 항목이 쌓였을 때 (먼저 도래하는 조건)
- 세션 종료 시 남은 항목 모두 전송

---

### Q: 배치 크기 제한?

**A:** 최대 **100개 항목** (1 요청당)
- 최소 1개 항목 필요
- 권장: 5-10개 (효율성)

---

### Q: 429 에러가 발생하면?

**A:**
```
1. 응답 헤더에서 Retry-After 값 읽기
2. 해당 시간만큼 대기 후 재시도
3. 또는 Frontend의 자동 재시도 로직 활용
4. 3회 재시도 후에도 실패하면 로컬 저장
```

---

### Q: 점수 범위가 0-1이 아니면?

**A:** Zod 검증에서 자동 거절
```json
{
  "error": "ValidationError",
  "message": "facialScore must be between 0.0 and 1.0"
}
```

상태 코드: **400 Bad Request**

---

### Q: 세션이 없으면?

**A:**
```json
{
  "error": "NotFoundError",
  "message": "Session not found"
}
```

상태 코드: **404 Not Found**

---

### Q: 인증이 필요한가?

**A:** 프로젝트 설정에 따라 다릅니다.
- 필요 시: Authorization 헤더에 Bearer 토큰 포함
- 불필요 시: 헤더 생략

---

## 📞 기술 지원

### 문제 발생 시 확인 사항

**1단계: Backend API 실행 확인**
```bash
curl http://localhost:8000/api/session/start
```

**2단계: 테스트 스크립트 실행**
```bash
# demo.http: VSCode REST Client에서 클릭
# demo.sh: 터미널에서 실행
bash docs/integration/test-scripts/demo.sh
```

**3단계: 로그 확인**
- Backend 콘솔 메시지 확인
- 에러 코드 및 메시지 확인
- request ID로 추적

---

### 문서 참조

| 문서 | 용도 | 길이 |
|------|------|------|
| QUICK_START_INTEGRATION.md | 기본 사항 | 5분 |
| FRONTEND_BACKEND_COMPATIBILITY_HANDOFF.md | 상세 가이드 | 15분 |
| FRONTEND_BACKEND_API_COMPATIBILITY_DETAILED.md | 기술 명세 | 30분 |

---

### 직접 문의

문제가 해결되지 않으면:
1. Backend 팀에 직접 문의
2. 포함된 문서의 Q&A 섹션 참조
3. 에러 로그와 함께 요청 데이터 공유

---

## 🚀 추천 일정

### 👉 즉시 (오늘/내일)

1. QUICK_START_INTEGRATION.md 읽기 (5분)
2. 팀 리더: FRONTEND_BACKEND_COMPATIBILITY_HANDOFF.md 검토 (20분)
3. 팀 미팅: 통합 계획 공유

### 👉 내일 (Day 2)

1. Backend API 로컬 실행 확인
2. demo.http 또는 demo.sh로 테스트
3. batch-tick 엔드포인트 동작 확인

### 👉 이번 주 (Day 3-5)

1. 본격적인 Frontend 통합 개발
2. 필요시 Backend 팀과 협력
3. E2E 테스트 진행

### 👉 다음 주 (Day 8-10)

1. QA 테스트
2. Staging 배포
3. Production 배포

---

## ✨ 최종 상태

### 🟢 READY FOR INTEGRATION

| 항목 | 상태 | 비고 |
|------|------|------|
| 핵심 API (3개) | ✅ 완료 | start, batch-tick, end |
| 전체 API | ✅ 완료 | 20+ 엔드포인트 |
| Rate Limiting | ✅ 완료 | 429 + Retry-After |
| 멀티모달 데이터 | ✅ 완료 | frames, audio, stt |
| 1분 분석 | ✅ 완료 | tick + batch-tick |
| 문서화 | ✅ 완료 | 4가지 포맷 |
| 테스트 스크립트 | ✅ 완료 | demo.http, demo.sh |
| **Frontend 호환성** | ✅ 완료 | Phase 9 완벽 호환 |

---

## 📎 제공 파일 목록

### 📄 메인 문서
- QUICK_START_INTEGRATION.md (2페이지)
- FRONTEND_BACKEND_COMPATIBILITY_HANDOFF.md (15페이지)
- FRONTEND_BACKEND_API_COMPATIBILITY_DETAILED.md (50KB)

### 🧪 테스트 스크립트
- docs/integration/test-scripts/demo.http (REST Client)
- docs/integration/test-scripts/demo.sh (Bash 자동화)

### 📋 참고 자료
- PHASE_9_COMPLETION_REPORT.md (Phase 9 상세 보고서)

---

## 🎯 요약

**Backend**: Phase 4 100% 완료 ✅
**Frontend**: Phase 9 100% 완료 ✅
**호환성**: 완벽함 ✅
**문서**: 충분함 ✅
**테스트**: 스크립트 제공 ✅

---

## 🎉 마치며

Frontend Phase 9과 Backend Phase 4 모두 완성되었습니다.

필요한 모든 문서, 코드 예제, 테스트 스크립트가 준비되어 있습니다.

**언제든 시작하세요!** 🚀

---

**문서 작성**: 2025-11-03
**상태**: ✅ 전달 준비 완료
**다음 단계**: Frontend 팀과의 통합 시작

질문이나 문제점은 언제든 연락주세요!

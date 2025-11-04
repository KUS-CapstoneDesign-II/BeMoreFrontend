# Backend 팀에게: VAD 데이터 형식 검증 요청

**작성일**: 2024-11-04
**From**: Frontend Team (BeMoreFrontend Phase 9)
**To**: Backend Team
**Subject**: VAD (Voice Activity Detection) 메시지 형식 검증 및 긴급 확인 요청

---

## 📋 상황 요약

### Phase 9 Frontend-Backend 통합 현황

✅ **완료된 항목**:
- API endpoint 동기화 (3가지 미스매치 수정)
- Batch submission API 호환성 확인
- Retry policy 동기화 (1s, 3s, 10s + jitter)
- Rate limiting 처리 (HTTP 429 Retry-After)
- GitHub Actions CI/CD 파이프라인 수정
- Service Worker 캐싱 정책 구현
- Keep-Alive 메커니즘 (25분 주기 health check)
- WebSocket 3채널 (landmarks, voice, session) 정상 작동

⚠️ **현재 이슈**:
- **VAD (Voice Activity Detection) 데이터가 NaN으로 표시됨**
- 리포트 페이지에 음성 활동 분석 메트릭 미표시

---

## 🔍 문제 분석

### Frontend에서 관찰한 증상

**콘솔 로그**:
```
✅ 🎤 Voice message: {type: 'vad_analysis', data: {...}}
```

**렌더링 결과**:
```
❌ 발화 비율: NaN%
❌ 침묵 비율: NaN%
❌ 평균 침묵: NaNs
❌ 최장 침묵: NaNs
```

### 근본 원인 (Frontend 분석)

Frontend VADMetrics 인터페이스:
```typescript
export interface VADMetrics {
  speechRatio: number;          // 발화 비율 (0.0-1.0)
  pauseRatio: number;           // 침묵 비율 (0.0-1.0)
  averagePauseDuration: number; // 평균 침묵 시간 (ms)
  longestPause: number;         // 최장 침묵 시간 (ms)
  speechBurstCount: number;     // 발화 버스트 개수
  averageSpeechBurst: number;   // 평균 발화 버스트 (ms)
  pauseCount: number;           // 침묵 카운트
  summary: string;              // 요약
}
```

**NaN 발생 메커니즘**:
- Backend에서 보낸 필드명이 Frontend 기대값과 다를 가능성
  - Frontend 기대: `speechRatio` (camelCase)
  - Backend 실제: `speech_ratio` (snake_case) 의심
- 필드명 불일치 → `undefined` 값 → `Math.round(undefined * 100)` = **NaN**

---

## 🎯 요청 사항

### 1️⃣ VAD 메시지 형식 정확 검증

Backend에서 `vad_analysis` 또는 `vad_realtime` 메시지를 보낼 때:

**다음을 확인해주세요**:

```json
{
  "type": "vad_analysis",
  "data": {
    "speechRatio": <number 0.0-1.0>,           // ← 필드명 확인
    "pauseRatio": <number 0.0-1.0>,
    "averagePauseDuration": <number ms>,
    "longestPause": <number ms>,
    "speechBurstCount": <number>,
    "averageSpeechBurst": <number ms>,
    "pauseCount": <number>,
    "summary": <string>
  }
}
```

**구체적 확인 항목**:

| 항목 | Frontend 기대 | Backend 확인 필요 |
|------|--------------|-----------------|
| 필드명 스타일 | `speechRatio` | snake_case vs camelCase? |
| 비율 범위 | 0.0 ~ 1.0 | 0~100 vs 0~1? |
| 시간 단위 | 밀리초(ms) | 초(s) vs 밀리초(ms)? |
| 데이터 타입 | 모두 number | 문자열 형태? |
| 필수 필드 | 모든 8개 필드 | 일부 필드만 보냄? |

---

### 2️⃣ 현재 Backend VAD 구현 코드 확인 요청

Backend에서:

1. **VAD 분석 결과 생성 코드** 공유
   - 어떤 필드를 계산하는가?
   - 필드명 규칙은 무엇인가? (camelCase/snake_case)
   - 값의 범위는 무엇인가?

2. **WebSocket으로 전송하는 부분** 확인
   ```python
   # 예상되는 Backend 코드 형태
   vad_result = {
       "speech_ratio": 0.65,  # ← 이렇게 snake_case인가?
       "pause_ratio": 0.35,
       "average_pause_ms": 1500,
       ...
   }
   ```

3. **샘플 메시지** 제공
   - 실제 Backend에서 보내는 최근 vad_analysis 메시지 1-2개

---

### 3️⃣ Test 메시지 요청

Frontend 테스트를 위해 다음 형식으로 test 메시지를 한 번 수동으로 보내주실 수 있나요?

```json
{
  "type": "vad_analysis",
  "data": {
    "speechRatio": 0.65,
    "pauseRatio": 0.35,
    "averagePauseDuration": 1500,
    "longestPause": 3000,
    "speechBurstCount": 12,
    "averageSpeechBurst": 2500,
    "pauseCount": 8,
    "summary": "정상적인 발화 패턴입니다"
  }
}
```

이 메시지를 받으면 Frontend에서 제대로 표시되는지 즉시 확인할 수 있습니다.

---

## 📊 제공할 Frontend 리소스

### 1. VAD 메시지 처리 코드

**파일**: `src/App.tsx:144-152`

```typescript
onVoiceMessage: (message) => {
  console.log('🎤 Voice message:', message);
  if (message.type === 'stt_received') {
    const d = message.data as { text?: string };
    setSttText(d?.text ?? '');
  }
  if (message.type === 'vad_analysis' || message.type === 'vad_realtime') {
    setVadMetrics(message.data as VADMetrics);  // ← 여기서 처리
  }
},
```

### 2. VAD 표시 컴포넌트

**파일**: `src/components/VAD/VADMonitor.tsx:53-82`

```typescript
<div className="text-lg font-bold text-blue-600">
  {Math.round(speechRatio * 100)}%  // ← NaN 발생 지점
</div>
```

### 3. VADMetrics 타입 정의

**파일**: `src/types/index.ts:85-94`

```typescript
export interface VADMetrics {
  speechRatio: number;
  pauseRatio: number;
  averagePauseDuration: number;
  longestPause: number;
  speechBurstCount: number;
  averageSpeechBurst: number;
  pauseCount: number;
  summary: string;
}
```

---

## 🔧 Frontend에서 임시 해결 중 (대기 중)

Frontend는 다음과 같이 준비했습니다:

### 1. 데이터 검증 함수 (준비 완료)

```typescript
// src/utils/vadValidator.ts
export function validateVADMetrics(data: unknown): VADMetrics | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  const validation = {
    speechRatio: typeof obj.speechRatio === 'number' ? obj.speechRatio : undefined,
    pauseRatio: typeof obj.pauseRatio === 'number' ? obj.pauseRatio : undefined,
    averagePauseDuration: typeof obj.averagePauseDuration === 'number' ? obj.averagePauseDuration : undefined,
    longestPause: typeof obj.longestPause === 'number' ? obj.longestPause : undefined,
    speechBurstCount: typeof obj.speechBurstCount === 'number' ? obj.speechBurstCount : undefined,
    averageSpeechBurst: typeof obj.averageSpeechBurst === 'number' ? obj.averageSpeechBurst : undefined,
    pauseCount: typeof obj.pauseCount === 'number' ? obj.pauseCount : undefined,
    summary: typeof obj.summary === 'string' ? obj.summary : '',
  };

  const hasRequired = validation.speechRatio !== undefined &&
                     validation.pauseRatio !== undefined;

  if (!hasRequired) {
    console.error('❌ VAD metrics missing required fields:', validation);
    return null;
  }

  return validation as VADMetrics;
}
```

### 2. VAD 데이터 저장소 (준비 완료)

```typescript
// src/stores/vadStore.ts (이미 존재)
export const useVADStore = create<VADState>((set) => ({
  metrics: null,
  updateMetrics: (metrics) => set({ metrics }),
  // ...
}));
```

**이 두 가지는 Backend에서 확인 후 적용 예정입니다.**

---

## 📅 타임라인

- **2024-11-04**: Frontend VAD 문제 분석 완료 및 Backend 검증 요청
- **예상**: Backend 확인 후 필드명 동기화 (24시간 이내)
- **예상**: Frontend 데이터 검증 + 리포트 페이지 VAD 섹션 추가 (12시간 소요)
- **예상**: Full integration test 및 Production deploy (2-3일)

---

## 💬 Communication 방법

### Backend 확인 결과 보고 시 포함할 내용:

```markdown
## Backend VAD 메시지 형식

현재 Backend에서 보내는 vad_analysis 메시지:

### 필드명 규칙
- [x] camelCase / [ ] snake_case / [ ] other: ___

### 샘플 메시지
```json
{
  "type": "vad_analysis",
  "data": {
    // 실제 필드들을 여기 작성
  }
}
```

### 필드 상세 정보
| 필드명 | 타입 | 범위 | 단위 | 설명 |
|-------|------|------|------|------|
| speechRatio | number | 0~1 | - | ... |
| ... | ... | ... | ... | ... |
```

---

## 🎯 다음 단계

### Backend 제공 후 즉시 실행할 Frontend 작업:

1. **필드명 동기화**
   - camelCase로 변환 또는 필드명 매핑 함수 추가

2. **데이터 검증 적용**
   - `vadValidator.ts` 적용
   - `useVADStore` 활용

3. **리포트 페이지 업데이트**
   - ReportPage.tsx에 VAD 섹션 추가
   - SessionSummaryReport에 VAD 데이터 표시

4. **E2E 테스트**
   - 전체 세션 흐름에서 VAD 데이터 표시 확인

---

## 📎 참고 자료

- **Frontend 분석 문서**: `VAD_AND_REPORT_DATA_ANALYSIS.md`
- **현재 Frontend VAD 관련 파일**:
  - `src/types/index.ts` (VADMetrics 정의)
  - `src/hooks/useVAD.ts` (Web Audio VAD 로컬 구현)
  - `src/stores/vadStore.ts` (VAD 전역 상태)
  - `src/components/VAD/VADMonitor.tsx` (VAD 표시)
  - `src/App.tsx:144-152` (메시지 처리)

---

## ✉️ 메시지 템플릿

> Backend 팀에게 좋은 협력을 위해 존댓말로 정중하게 요청합니다.
>
> **제목**: VAD 메시지 형식 검증 요청 (Frontend-Backend Phase 9)
>
> 안녕하세요.
>
> Frontend Phase 9 통합 작업 중 VAD(Voice Activity Detection) 데이터가 NaN으로 표시되는 문제를 발견했습니다.
>
> Backend에서 보내는 `vad_analysis` 메시지의 필드명과 데이터 형식을 확인해주실 수 있을까요? Frontend에서 기대하는 형식은 위 요청서를 참고해주시면 감사하겠습니다.
>
> 특히 다음 사항을 확인해주시면 좋겠습니다:
> 1. 필드명 스타일 (camelCase vs snake_case)
> 2. 비율 데이터 범위 (0~1 vs 0~100)
> 3. 시간 데이터 단위 (초 vs 밀리초)
> 4. 현재 보내고 있는 샘플 메시지
>
> 감사합니다!

---

## 📞 연락처

- Frontend Lead: [Your Name]
- Issue Tracker: Phase 9 - VAD Data Integration
- Document: `VAD_AND_REPORT_DATA_ANALYSIS.md`

---

**Status**: ⏳ Awaiting Backend Confirmation


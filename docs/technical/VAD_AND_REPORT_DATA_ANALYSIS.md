# VAD 데이터 및 리포트 분석: 상세 진단 보고서

**분석 일시**: 2024-11-04
**분석 대상**: BeMoreFrontend Phase 9 - VAD 데이터 수신 및 리포트 데이터 조직화 문제

---

## 📋 Executive Summary

콘솔 로그 분석 결과, **3가지 주요 문제**가 식별되었습니다:

1. **❌ VAD 데이터 NaN 문제**: Backend에서 수신한 VAD 메트릭이 올바르게 파싱되지 않음
2. **❌ 데이터 저장소 없음**: VAD 데이터를 저장할 전역 상태 관리 메커니즘 부재
3. **❌ 리포트에 VAD 미표시**: ReportPage와 SessionSummaryReport에서 VAD 데이터를 전혀 표시하지 않음

---

## 🔍 Line-by-Line 데이터 흐름 분석

### Phase 1: WebSocket 메시지 수신 (`src/services/websocket.ts`)

**위치**: `src/services/websocket.ts:174-182`

```typescript
this.ws.onmessage = (event) => {
  try {
    const message: WSMessage = JSON.parse(event.data);
    this.messageHandlers.forEach((handler) => handler(message));
    this.lastActivityAt = Date.now();
  } catch (error) {
    console.error(`[WebSocket] ❌ ${this.name} message parse error:`, error);
  }
};
```

**분석**:
- ✅ JSON 파싱 성공 (에러 없음)
- ✅ 모든 등록된 핸들러에 메시지 전달
- **문제**: 메시지 데이터 구조 검증 없음 → 잘못된 필드명이나 타입이면 그대로 통과

**콘솔 증거**:
```
🎤 Voice message: {type: 'vad_analysis', data: {...}}
```

---

### Phase 2: Voice 채널 메시지 핸들러 등록 (`src/hooks/useWebSocket.ts`)

**위치**: `src/hooks/useWebSocket.ts:153-155` (추정)

```typescript
if (onVoiceMessage) {
  newChannels.voice.onMessage(onVoiceMessage);
}
```

**분석**:
- ✅ 핸들러가 정상적으로 등록됨
- ✅ `channels.voice.onMessage(handler)`가 handler set에 추가됨

---

### Phase 3: App 레벨 Voice 메시지 처리 (`src/App.tsx:144-152`)

**위치**: `src/App.tsx:144-152`

```typescript
onVoiceMessage: (message) => {
  console.log('🎤 Voice message:', message);
  if (message.type === 'stt_received') {
    const d = message.data as { text?: string };
    setSttText(d?.text ?? '');
  }
  if (message.type === 'vad_analysis' || message.type === 'vad_realtime') {
    setVadMetrics(message.data as VADMetrics);  // ⚠️ Line 151: 검증 없는 타입 강제
  }
},
```

**🚨 CRITICAL ISSUE 발견**:

```typescript
setVadMetrics(message.data as VADMetrics);  // Line 151
```

**문제점**:
1. **타입 검증 없음**: `as VADMetrics`는 타입 단언(assertion)일 뿐 실제 데이터 검증이 없음
2. **필드 검증 없음**: message.data가 실제로 VADMetrics 구조를 가지는지 확인하지 않음
3. **Undefined 필드**: Backend에서 보낸 데이터에 필수 필드가 없거나 undefined일 수 있음

**콘솔 근거**:
```
🎤 Voice message: {type: 'vad_analysis', data: {...}}
```

`data` 객체 내부의 실제 필드들을 확인했을 때, 필드명이 다를 가능성이 높음.

---

### Phase 4: VADMetrics 인터페이스 정의 (`src/types/index.ts:85-94`)

**위치**: `src/types/index.ts:85-94`

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

**분석**:
- ✅ 모든 필드가 number 또는 string 타입으로 정의됨
- **문제**: 이 타입이 Backend로부터 받은 데이터와 정확히 일치하지 않을 가능성

---

### Phase 5: VADMonitor 컴포넌트 렌더링 (`src/components/VAD/VADMonitor.tsx:53-82`)

**위치**: `src/components/VAD/VADMonitor.tsx:53-82`

```typescript
<div className="text-lg font-bold text-blue-600">
  {Math.round(speechRatio * 100)}%  // Line 56: speechRatio가 undefined/null이면 NaN 발생
</div>

<div className="text-lg font-bold text-gray-600">
  {Math.round(pauseRatio * 100)}%   // Line 64: pauseRatio가 undefined/null이면 NaN 발생
</div>

<div className="text-lg font-bold text-purple-600">
  {(averagePauseDuration / 1000).toFixed(1)}s  // Line 72: undefined/null이면 NaN 발생
</div>

<div className="text-lg font-bold text-red-600">
  {(longestPause / 1000).toFixed(1)}s  // Line 80: undefined/null이면 NaN 발생
</div>
```

**🚨 NaN 생성 메커니즘**:

| 연산 | 결과 |
|------|------|
| `null * 100` | `NaN` |
| `undefined * 100` | `NaN` |
| `null / 1000` | `NaN` |
| `undefined / 1000` | `NaN` |
| `Math.round(NaN)` | `NaN` |
| `(NaN).toFixed(1)` | `"NaN"` |

**콘솔 증거**:
```
발화 비율: NaN%
침묵 비율: NaN%
평균 침묵: NaNs
최장 침묵: NaNs
```

---

## 📊 데이터 저장 및 집계 문제

### Issue 1: VAD 데이터 저장소 부재

**현재 상황**:

| Store | VAD 데이터 | 상태 |
|-------|-----------|------|
| `sessionStore` | ❌ 없음 | 세션 메타데이터만 저장 |
| `emotionStore` | ❌ 없음 | 감정 데이터만 저장 |
| `metricsStore` | ⚠️ 부분 | `vadState` ('silence'\|'speech')만 있음, 메트릭 없음 |
| `timelineStore` | ❌ 없음 | TimelineCard에 VAD 필드 없음 |
| `vadStore` | ✅ 있음 | 하지만 **어디에서도 사용되지 않음** |

**문제점**:
1. vadStore가 존재하지만 App.tsx에서 사용되지 않음
2. VAD 데이터가 `vadMetrics` state에만 저장되고, 세션 종료 시 버려짐
3. 리포트 페이지에서 VAD 데이터를 검색할 방법이 없음

---

### Issue 2: ReportPage에서 VAD 데이터 미표시

**위치**: `src/components/Session/ReportPage.tsx:1-347`

**분석**:
```typescript
// Line 43: 타임라인 통계만 가져옴 (VAD 데이터 없음)
const timelineStats = useTimelineStore((s) => s.getStatistics());
const timelineSummary = useTimelineStore((s) => s.getSummary());

// Lines 140-163: 카드 수집, 평균 점수, 감정 분포만 표시
// VAD 섹션: ❌ 없음

// Lines 182-220: 감정 분포 표시
// VAD 표시: ❌ 없음
```

**의도된 내용**:
```
예상되어야 할 섹션:
- 발화 비율
- 침묵 비율
- 평균 침묵 시간
- 최장 침묵
- 발화 패턴 분석
```

**현재 표시 내용**:
- ✅ 세션 시간
- ✅ 카드 수집
- ✅ 평균 점수
- ✅ 감정 분포
- ✅ 주요 키워드
- ❌ **VAD 메트릭 전혀 없음**

---

### Issue 3: SessionSummaryReport에서 VAD 미포함

**위치**: `src/components/Session/SessionSummaryReport.tsx:1-365`

**분석**: SessionData 인터페이스에 VAD 필드 없음

```typescript
export interface SessionData {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  messageCount: number;
  averageResponseTime: number;
  emotions: { ... };           // ✅ 감정 데이터 있음
  mainEmotion: string;         // ✅ 주요 감정 있음
  userFeedback?: { ... };      // ✅ 피드백 있음
  aiInsights: string[];        // ✅ AI 인사이트 있음
  // ❌ vadMetrics: 없음
  // ❌ vadAnalysis: 없음
}
```

---

## 🔗 데이터 흐름 전체 맵

```
Backend 서버 (WebSocket)
    ↓
    │ vad_analysis 메시지
    ↓
ReconnectingWebSocket.onmessage (ws.ts:174)
    ↓
    │ 등록된 핸들러들 호출
    ↓
App.tsx onVoiceMessage (App.tsx:144)
    ↓
    │ message.type === 'vad_analysis' 확인 (App.tsx:150)
    ↓
    │ setVadMetrics(message.data as VADMetrics) (App.tsx:151) ⚠️ 검증 없음
    ↓
vadMetrics React State (App.tsx:140)
    ↓
VADMonitor 컴포넌트 렌더링 (조건부)
    │
    ├─→ DEMO_MODE === true → demoVADMetrics 사용
    │
    └─→ DEMO_MODE === false → vadMetrics 사용 (NaN 문제 발생)

❌ 선택지 1: VAD 데이터가 저장되지 않음
❌ 선택지 2: 리포트 페이지에 표시되지 않음
```

---

## 🎯 근본 원인 분석

### Root Cause 1: 데이터 구조 불일치

**가설**:
Backend에서 보내는 데이터 구조:
```json
{
  "type": "vad_analysis",
  "data": {
    "speech_ratio": 0.65,          // ← 다른 필드명 (camelCase vs snake_case)
    "pause_ratio": 0.35,
    "average_pause_ms": 1500,
    ...
  }
}
```

Frontend에서 기대하는 구조:
```typescript
{
  speechRatio: number,
  pauseRatio: number,
  averagePauseDuration: number,
  ...
}
```

**결과**: 필드명 불일치 → undefined 값 → NaN 계산 결과

---

### Root Cause 2: 데이터 검증 부재

**현재 코드**:
```typescript
setVadMetrics(message.data as VADMetrics);  // ❌ 검증 없음
```

**올바른 방식**:
```typescript
// 검증 + 로깅 + 기본값
const processVADMessage = (data: unknown): VADMetrics | null => {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  // 필드별 검증
  if (typeof obj.speechRatio !== 'number') {
    console.warn('❌ speechRatio is not a number:', obj.speechRatio);
    return null;
  }

  return obj as VADMetrics;
};
```

---

### Root Cause 3: 전역 상태 미사용

**문제**: vadStore가 있지만 사용되지 않음

```typescript
// vadStore.ts에 정의되어 있지만...
export const useVADStore = create<VADState>((set) => ({
  metrics: null,
  updateMetrics: (metrics) => set({ metrics }),
  ...
}));

// App.tsx에서는 사용하지 않음
const vadMetrics = useState<VADMetrics | null>(null);  // ← 로컬 state 사용
```

**결과**:
- 컴포넌트 언마운트 시 데이터 손실
- 다른 컴포넌트에서 VAD 데이터 접근 불가
- 리포트에서 사용할 데이터 없음

---

### Root Cause 4: 타임라인에 VAD 데이터 미포함

**TimelineCard 구조** (`src/types/session.ts`):
```typescript
export interface TimelineCard {
  minuteIndex: number;
  facialScore: number;
  vadScore: number;           // ← 이 필드는 있지만...
  textScore: number;
  combinedScore: number;
  keywords: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence: number;
  timestamp: Date;
  durationMs: number;
}
```

**문제**:
- `vadScore`는 있지만, 전체 VADMetrics (speechRatio, pauseRatio 등)는 저장되지 않음
- 리포트 시 aggregated VAD 분석 불가

---

## 📈 콘솔 로그 증거 추적

### ✅ 성공한 부분:

```log
🎤 Voice message: {type: 'vad_analysis', data: {...}}
```
→ WebSocket 수신 성공, 메시지 파싱 성공

### ❌ 실패한 부분:

```log
발화 비율: NaN%
침묵 비율: NaN%
평균 침묵: NaNs
최장 침묵: NaNs
```
→ VADMonitor 렌더링 단계에서 필드값이 undefined/null

---

## 💡 권장 해결 방안

### Solution 1: Backend 메시지 형식 확인 (즉시)

```bash
# Backend에서 보내는 정확한 메시지 형식 확인
# 콘솔 로그에서 voice message의 data 필드 전체 출력
console.log('🎤 Voice message:', message);
console.log('🎤 Message data keys:', Object.keys(message.data));
console.log('🎤 Message data values:', message.data);
```

### Solution 2: 데이터 검증 레이어 추가 (Phase 9-1 Fix)

**파일**: `src/utils/vadValidator.ts` (신규 생성)

```typescript
export function validateVADMetrics(data: unknown): VADMetrics | null {
  if (!data || typeof data !== 'object') {
    console.warn('❌ VAD data is not an object');
    return null;
  }

  const obj = data as Record<string, unknown>;

  // 필드별 타입 검증
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

  // 필수 필드 확인
  const hasRequired = validation.speechRatio !== undefined &&
                     validation.pauseRatio !== undefined;

  if (!hasRequired) {
    console.error('❌ VAD metrics missing required fields:', validation);
    return null;
  }

  return validation as VADMetrics;
}
```

### Solution 3: vadStore 활용 (Phase 9-2 Fix)

**파일**: `src/App.tsx:151` 수정

```typescript
// Before
if (message.type === 'vad_analysis' || message.type === 'vad_realtime') {
  setVadMetrics(message.data as VADMetrics);
}

// After
if (message.type === 'vad_analysis' || message.type === 'vad_realtime') {
  const validatedMetrics = validateVADMetrics(message.data);
  if (validatedMetrics) {
    setVadMetrics(validatedMetrics);
    useVADStore.getState().updateMetrics(validatedMetrics);
    Logger.debug('✅ VAD metrics updated:', validatedMetrics);
  } else {
    Logger.error('❌ Invalid VAD metrics received');
  }
}
```

### Solution 4: 리포트에 VAD 데이터 추가 (Phase 9-3 Fix)

**파일**: `src/components/Session/ReportPage.tsx:166-221` 추가

```typescript
{/* VAD 분석 섹션 - 추가 */}
<div className="p-6 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🎤 음성 활동 분석</h2>

  {vadMetrics ? (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
        <p className="text-xs text-gray-600">발화 비율</p>
        <p className="text-lg font-bold text-blue-600">{Math.round(vadMetrics.speechRatio * 100)}%</p>
      </div>
      <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded">
        <p className="text-xs text-gray-600">침묵 비율</p>
        <p className="text-lg font-bold text-gray-600">{Math.round(vadMetrics.pauseRatio * 100)}%</p>
      </div>
      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
        <p className="text-xs text-gray-600">평균 침묵</p>
        <p className="text-lg font-bold text-purple-600">{(vadMetrics.averagePauseDuration / 1000).toFixed(1)}s</p>
      </div>
      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded">
        <p className="text-xs text-gray-600">최장 침묵</p>
        <p className="text-lg font-bold text-red-600">{(vadMetrics.longestPause / 1000).toFixed(1)}s</p>
      </div>
    </div>
  ) : (
    <p className="text-gray-500">음성 활동 데이터가 없습니다</p>
  )}
</div>
```

---

## 📋 Implementation Checklist

### Phase 9-1: Backend-Frontend 메시지 형식 동기화
- [ ] Backend에서 보내는 VAD 메시지 형식 확인
- [ ] 필드명 일치 확인 (camelCase/snake_case)
- [ ] 필드 타입 일치 확인 (모두 number인지)

### Phase 9-2: 데이터 검증 + 전역 상태 관리
- [ ] `src/utils/vadValidator.ts` 생성
- [ ] `src/App.tsx:151` 수정하여 검증 적용
- [ ] `useVADStore` 활용 코드 추가
- [ ] 콘솔 로깅 추가 (필드값 확인용)

### Phase 9-3: 리포트 데이터 표시
- [ ] `src/components/Session/ReportPage.tsx`에 VAD 섹션 추가
- [ ] `SessionSummaryReport`의 SessionData 인터페이스에 VAD 필드 추가
- [ ] 리포트 페이지에서 vadStore 데이터 조회

### Phase 9-4: 타임라인 통합
- [ ] `TimelineCard`에 `vadMetrics` 필드 추가 (선택사항)
- [ ] 리포트 생성 시 aggregated VAD 데이터 포함

---

## 🔎 다음 조사 사항

1. **Backend VAD 메시지 형식**: 실제 필드명과 타입 확인 필요
2. **Demo vs Production**: DEMO_MODE에서는 demoVADMetrics가 제대로 작동하는지 확인
3. **데이터 손실점**: 세션 종료 시 VAD 데이터가 어디로 가는지 추적

---

## 📞 결론

| 문제 | 원인 | 영향 | 우선순위 |
|------|------|------|---------|
| NaN 표시 | 필드명/구조 불일치 | UI 깨짐 | 🔴 높음 |
| 데이터 저장 없음 | vadStore 미사용 | 리포트 불완전 | 🔴 높음 |
| 리포트 미표시 | UI 구성 미완료 | 사용자 정보 부족 | 🟡 중간 |
| 데이터 검증 없음 | 원본 데이터 신뢰 | 잠재 버그 | 🟡 중간 |

**권장 액션**: 즉시 Backend 메시지 형식을 확인하고, Solution 1-3을 순서대로 구현하세요.


# 세션 종료 → 결과 생성 플로우 진단 프롬프트

## 📋 개요

이 문서는 BeMore 애플리케이션의 **세션 종료 및 결과 생성 플로우**를 체계적으로 진단하기 위한 포괄적인 프롬프트입니다.

**목표**:
- 세션 종료 버튼 클릭 시 발생하는 전체 프로세스 검증
- 팝업/모달 동작의 정확성 확인
- 결과 생성 타이밍 및 데이터 페치 흐름 검증
- 잠재적 경쟁 조건(race condition) 및 타이밍 문제 식별
- 에러 처리 및 엣지 케이스 확인

---

## 🔍 진단 범위

### Phase 1: 세션 종료 트리거 (Session End Trigger)

**파일**: `src/components/Session/ActiveSessionView.tsx`, `src/components/Session/SessionControls.tsx`

**점검 항목**:

1. **UI 제어 흐름**:
   - [ ] "세션 종료" 버튼이 정확히 어디서 렌더링되는가?
   - [ ] 버튼 클릭 시 어떤 이벤트 핸들러가 실행되는가?
   - [ ] `showQuitConfirm` 상태가 올바르게 관리되는가?
   - [ ] 확인 팝업이 모달로 제대로 표시되는가?

2. **팝업 표시**:
   - [ ] `showQuitConfirm && (...)` 조건이 올바르게 작동하는가?
   - [ ] 팝업이 "계속 진행"과 "종료 확인" 두 버튼을 제공하는가?
   - [ ] "계속 진행" 버튼이 팝업을 닫고 세션을 계속 진행하는가?
   - [ ] 팝업이 사용자에게 저장될 데이터량을 정확히 표시하는가? (`{timelineCards.length}분`)

3. **상태 전이**:
   - [ ] 팝업 표시 전 상태: `showQuitConfirm: false`
   - [ ] 팝업 표시 후 상태: `showQuitConfirm: true`
   - [ ] "계속 진행" 후 상태: `showQuitConfirm: false` (팝업 닫힘)
   - [ ] "종료 확인" 후 상태: `isEnding: true` (진행 중)

**현재 코드 검토**:

```typescript
// ActiveSessionView.tsx (라인 284-322)
const [showQuitConfirm, setShowQuitConfirm] = useState(false);
const [isEnding, setIsEnding] = useState(false);

const handleEndSession = async () => {
  setIsEnding(true);  // ← 상태 변경
  try {
    await sessionState.endSession();  // ← API 호출
    onSessionEnded();  // ← 콜백
  } catch (error) {
    setIsEnding(false);
  }
};

// 버튼
onClick={() => setShowQuitConfirm(true)}

// 팝업
{showQuitConfirm && (
  <button onClick={() => setShowQuitConfirm(false)}>계속 진행</button>
  <button onClick={handleEndSession}>종료 확인</button>
)}
```

---

### Phase 2: 세션 종료 API 호출 (Session End API Call)

**파일**: `src/services/api.ts`, `src/stores/sessionStore.ts`

**점검 항목**:

1. **API 엔드포인트 검증**:
   - [ ] `sessionAPI.end()` 메서드가 정의되어 있는가? (라인 177-183)
   - [ ] 엔드포인트: `POST /api/session/{sessionId}/end`가 올바른가?
   - [ ] 응답 상태 확인: `response.data.success` 검증이 있는가?
   - [ ] 에러 처리: 실패 시 에러 메시지 반환이 정의되어 있는가?

2. **API 호출 순서**:
   - [ ] `sessionState.endSession()`은 내부적으로 어떻게 구현되어 있는가?
   - [ ] 이것이 `sessionAPI.end(sessionId)`를 호출하는가?
   - [ ] API 타임아웃 설정: 20초 (라인 22) - 충분한가?
   - [ ] 자동 재시도 로직이 적용되는가? (`end` 메서드에는 없음)

3. **응답 처리**:
   - [ ] API 성공 응답: 어떤 데이터를 반환하는가?
   - [ ] 응답이 비어있는가? (void 타입)
   - [ ] 성공 응답 후 다음 단계가 자동으로 진행되는가?

**현재 코드 검토**:

```typescript
// api.ts (라인 177-183)
end: async (sessionId: string): Promise<void> => {
  const response = await api.post<ApiResponse>(`/api/session/${sessionId}/end`);
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to end session');
  }
},
```

**문제 지점**:
- ⚠️ `end` 메서드에는 자동 재시도(`retryWithBackoff`) 로직이 없음
- ⚠️ 다른 메서드들(`start`, `tick`, `batchTick` 등)은 재시도 로직이 있음
- ⚠️ API 호출 실패 시 `handleEndSession`에서 `isEnding`을 false로 설정하지만, 사용자에게 에러 메시지를 표시하지 않음

---

### Phase 3: 세션 종료 후 상태 관리 (Post-End State Management)

**파일**: `src/stores/sessionStore.ts`

**점검 항목**:

1. **세션 상태 업데이트**:
   - [ ] `endSession()` 메서드가 세션 상태를 어떻게 업데이트하는가?
   - [ ] 상태 변경: `status: 'active'` → `status: 'ended'` 또는 다른 값?
   - [ ] 관련 메타데이터 (종료 시간, 최종 데이터 등) 업데이트 여부?

2. **타이밍 문제 확인**:
   - [ ] API 호출이 완료되기 전에 다음 단계가 진행되는가?
   - [ ] `onSessionEnded()` 콜백이 API 완료 후 호출되는가?
   - [ ] 콜백이 UI 전환을 트리거하는가?

3. **데이터 보존**:
   - [ ] 세션 종료 후 수집된 타임라인 데이터가 보존되는가?
   - [ ] 세션 ID가 다음 단계로 전달되는가?

---

### Phase 4: 결과 페이지 로딩 (Results Page Loading)

**파일**: `src/components/Session/SessionResult.tsx`, `src/pages/*.tsx`

**점검 항목**:

1. **페이지 전환 시점**:
   - [ ] `onSessionEnded()` 콜백이 UI 라우팅을 트리거하는가?
   - [ ] 라우팅 지연이 있는가? (UI 업데이트 전 잠깐의 지연?)
   - [ ] 라우팅 중에 `sessionId`가 올바르게 전달되는가?

2. **SessionResult 컴포넌트 마운트**:
   - [ ] SessionResult가 마운트될 때 `sessionId` prop을 받는가?
   - [ ] `sessionId`가 존재하지 않으면 어떻게 되는가? (라인 45-48)
   - [ ] 초기 로딩 상태 (`loading: true`)가 올바르게 설정되는가?

3. **데이터 페치 순서**:

   **첫 번째 useEffect (라인 43-68)** - 세션 요약:
   ```typescript
   const data = await sessionAPI.getSummary(sessionId);
   ```

   **두 번째 useEffect (라인 75-119)** - 타임라인 데이터:
   ```typescript
   const report = await sessionAPI.getReport(sessionId);
   ```

   **점검**:
   - [ ] 두 API 호출이 병렬로 실행되는가 아니면 순차적으로 실행되는가?
   - [ ] 현재 코드에서는 병렬 실행 (좋음)
   - [ ] 하나가 실패해도 다른 하나는 계속 진행되는가? (라인 56-62, 106-115)
   - [ ] 둘 다 실패하면 `loading: false`가 되는가?

4. **로딩 상태 관리**:
   - [ ] 초기: `loading: true`
   - [ ] `getSummary` 완료: `loading` 상태 변경?
   - [ ] `getReport` 완료: `loading` 상태 변경?
   - [ ] **문제**: `loading` 상태가 `getSummary`의 완료 시점에만 false가 됨 (라인 64)
   - [ ] **문제**: `getReport`의 완료 시점에는 `loading` 상태를 업데이트하지 않음!

---

### Phase 5: 데이터 로딩 타이밍 (Data Loading Timing)

**점검 항목**:

1. **API 응답 시간**:
   - [ ] `getSummary()`: 응답 시간이 얼마나 되는가?
   - [ ] `getReport()`: 응답 시간이 얼마나 되는가?
   - [ ] 백엔드가 종료 신호를 받은 후 데이터를 즉시 제공하는가, 아니면 처리 시간이 필요한가?

2. **로딩 상태 표시 신뢰성**:
   - [ ] `loading` 상태가 실제 데이터 로딩을 정확히 반영하는가?
   - [ ] UI에서 `LoadingState` 또는 `ErrorState` 컴포넌트를 표시하는가? (라인 135-137)
   - [ ] 사용자가 명확한 피드백을 받는가?

3. **VAD 메트릭 데이터 흐름**:
   - [ ] SessionResult 컴포넌트가 `vadMetrics` prop을 받는가?
   - [ ] 이것은 어디에서 오는가?
   - [ ] `preservedVadMetrics` 상태 변수가 prop 업데이트를 추적하는가?
   - [ ] VAD 계산 함수 `calculateVadAverages()`가 올바르게 작동하는가?

---

### Phase 6: 에러 처리 및 엣지 케이스 (Error Handling & Edge Cases)

**점검 항목**:

1. **API 실패 시나리오**:
   - [ ] `sessionAPI.end()` 실패: 사용자에게 어떻게 알려지는가?
   - [ ] `getSummary()` 실패: 부분 데이터로 계속 진행되는가? (라인 62)
   - [ ] `getReport()` 실패: 어떻게 처리되는가? (라인 113-114)
   - [ ] 모두 실패한 경우: UI가 어떻게 표시되는가?

2. **타이밍 레이스 조건**:
   - [ ] SessionResult가 마운트되기 전에 `onSessionEnded()` 콜백이 실행되는가?
   - [ ] `sessionId`가 변경되는 중에 API 호출이 진행되는가?
   - [ ] `cleanup` 함수 (`mounted` 플래그)가 올바르게 작동하는가?

3. **네트워크 지연**:
   - [ ] API 응답이 30초 이상 지연되면 어떻게 되는가?
   - [ ] 타임아웃 처리: API 기본 타임아웃이 20초 (라인 22)
   - [ ] 사용자가 타이밍 동안 어떤 UI를 보게 되는가?

4. **사용자 상호작용**:
   - [ ] 로딩 중에 페이지를 떠나면 어떻게 되는가?
   - [ ] 브라우저를 새로고침하면 어떻게 되는가?
   - [ ] 뒤로가기 버튼을 누르면 어떻게 되는가?

---

### Phase 7: UI 피드백 메커니즘 (UI Feedback Mechanisms)

**파일**: `src/components/Common/States.tsx` (또는 유사 파일)

**점검 항목**:

1. **로딩 상태 UI**:
   - [ ] `LoadingState` 컴포넌트가 무엇을 표시하는가?
   - [ ] 텍스트: "결과를 불러오는 중..." (라인 135)
   - [ ] 로딩 애니메이션이 있는가?
   - [ ] 진행 상황을 표시하는가 (e.g., 진행률)?

2. **에러 상태 UI**:
   - [ ] `ErrorState` 컴포넌트가 무엇을 표시하는가?
   - [ ] 재시도 버튼이 있는가? (라인 137)
   - [ ] 에러 메시지가 명확한가?

3. **성공 상태 UI**:
   - [ ] 결과 데이터가 올바르게 표시되는가?
   - [ ] 탭 (요약, 세부, PDF)이 올바르게 렌더링되는가?
   - [ ] VAD 메트릭이 올바르게 표시되는가?

---

## 🔄 데이터 흐름 다이어그램

```
사용자가 "종료" 버튼 클릭
     ↓
setShowQuitConfirm(true) ← 팝업 표시
     ↓
사용자가 "종료 확인" 클릭
     ↓
setIsEnding(true)
     ↓
sessionState.endSession() ← API: POST /api/session/{sessionId}/end
     ↓
onSessionEnded() ← 콜백 실행 (라우팅?)
     ↓
SessionResult 컴포넌트 마운트 (props: sessionId)
     ↓
두 개의 병렬 API 호출:
   ├─ sessionAPI.getSummary(sessionId) ← 요약 데이터
   └─ sessionAPI.getReport(sessionId) ← 타임라인 데이터
     ↓
데이터 수신 및 상태 업데이트
     ↓
UI 렌더링 (결과 페이지)
```

---

## 🚨 의심되는 문제점

### 문제 1: 로딩 상태 관리 불완전

**현재 코드**:
```typescript
const [loading, setLoading] = useState(true);

// getSummary 완료
if (mounted) setLoading(false);  // ← 로딩 종료

// getReport 완료
if (mounted) {
  // setLoading 호출 없음! ← 문제
  setTimeline(report?.vadTimeline || []);
}
```

**문제**: `getReport`가 완료되어도 `loading` 상태를 업데이트하지 않음. 만약 `getSummary`가 먼저 완료되면 UI가 로딩 상태를 벗어남. 그 사이 `getReport`는 여전히 로딩 중일 수 있음.

**해결 방안**:
```typescript
useEffect(() => {
  if (!getSummaryLoading && !getReportLoading) {
    setLoading(false);
  }
}, [getSummaryLoading, getReportLoading]);
```

### 문제 2: 결과 페이지로의 라우팅 타이밍

**현재 코드**:
```typescript
const handleEndSession = async () => {
  setIsEnding(true);
  try {
    await sessionState.endSession();  // ← API 대기
    onSessionEnded();  // ← 콜백 실행 (라우팅?)
  } catch (error) {
    setIsEnding(false);
  }
};
```

**미확인 사항**:
- `onSessionEnded()` 콜백이 무엇을 수행하는가?
- 라우팅이 즉시 발생하는가, 아니면 지연이 있는가?
- SessionResult 컴포넌트가 `sessionId`를 올바르게 받는가?

### 문제 3: VAD 메트릭 데이터 출처

**현재 코드**:
```typescript
const vad = (summary?.vadVector as {...}) ?? calculateVadAverages();
```

**의문점**:
- `summary.vadVector`는 어디에서 오는가?
- 백엔드에서 제공되는가, 아니면 프론트엔드에서 계산되는가?
- `calculateVadAverages()`는 `timeline` 데이터가 로드되어야 작동 (순환 의존성?)

---

## 📊 진단 체크리스트

### 세션 종료 플로우
- [ ] "종료" 버튼 클릭 시 정확히 어떤 함수가 실행되는가?
- [ ] 팝업이 올바르게 표시되는가?
- [ ] "종료 확인" 버튼 클릭 후 `handleEndSession()`이 실행되는가?
- [ ] `isEnding` 상태가 올바르게 관리되는가?
- [ ] 버튼이 비활성화되는가? (라인 286)

### API 호출
- [ ] `sessionAPI.end()` 호출이 성공하는가?
- [ ] 에러 발생 시 `isEnding`이 false로 설정되는가?
- [ ] 사용자에게 에러 메시지가 표시되는가?

### 결과 페이지 전환
- [ ] `onSessionEnded()` 콜백이 올바르게 호출되는가?
- [ ] 페이지가 결과 페이지로 전환되는가?
- [ ] SessionResult 컴포넌트가 `sessionId`를 받는가?

### 데이터 로딩
- [ ] `getSummary()` 호출이 성공하는가?
- [ ] `getReport()` 호출이 성공하는가?
- [ ] 두 API 호출이 병렬로 실행되는가?
- [ ] `loading` 상태가 정확히 업데이트되는가?
- [ ] UI가 로딩 → 결과 순서로 전환되는가?

### 데이터 표시
- [ ] VAD 메트릭이 올바르게 표시되는가?
- [ ] 타임라인 데이터가 올바르게 표시되는가?
- [ ] 탭이 올바르게 작동하는가?

---

## 🔧 조사 방법

### 1. 브라우저 개발자 도구

```javascript
// 콘솔에서 실행
// API 모니터링 정보 조회 (라인 579-584)
window.__apiMonitoring.getStats()
window.__apiMonitoring.getEndpointStats()
window.__apiMonitoring.getMetrics()
```

### 2. 네트워크 탭

- [ ] 세션 종료 API 호출 (`POST /api/session/{sessionId}/end`)
- [ ] 요약 API 호출 (`GET /api/session/{sessionId}/summary`)
- [ ] 리포트 API 호출 (`GET /api/session/{sessionId}/report`)
- [ ] 각 호출의 응답 시간 측정

### 3. 콘솔 로그

현재 코드에 다음 로그가 있어야 함:
- `📡 API Request: POST /api/session/{sessionId}/end`
- `✅ API Response: /api/session/{sessionId}/end`
- `✅ API Response: /api/session/{sessionId}/summary`
- `✅ API Response: /api/session/{sessionId}/report`

부족한 로그:
- SessionResult 마운트 시점
- 각 useEffect 시작/완료 시점
- 상태 업데이트 시점

### 4. React DevTools

- [ ] 컴포넌트 마운트 순서 확인
- [ ] Props 변화 추적
- [ ] State 변화 추적

---

## 📝 권장 개선 사항

### 1. 로깅 추가

```typescript
// ActiveSessionView.tsx
const handleEndSession = async () => {
  console.log('🛑 [세션 종료] 시작');
  setIsEnding(true);
  try {
    console.log('🛑 [세션 종료] API 호출 중...');
    await sessionState.endSession();
    console.log('✅ [세션 종료] API 성공');

    console.log('🛑 [세션 종료] 콜백 실행');
    if (onSessionEnded) {
      onSessionEnded();
    }
    console.log('✅ [세션 종료] 완료');
  } catch (error) {
    console.error('❌ [세션 종료] 실패:', error);
    setIsEnding(false);
  }
};
```

### 2. 로딩 상태 개선

```typescript
// SessionResult.tsx
const [summaryLoading, setSummaryLoading] = useState(true);
const [reportLoading, setReportLoading] = useState(true);

useEffect(() => {
  setLoading(summaryLoading || reportLoading);
}, [summaryLoading, reportLoading]);
```

### 3. 에러 메시지 표시

```typescript
// ActiveSessionView.tsx
const [endError, setEndError] = useState<string | null>(null);

const handleEndSession = async () => {
  setEndError(null);
  // ... 시도
  catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    setEndError(msg);
    setIsEnding(false);
  }
};

// 팝업에 에러 표시
{endError && <div className="text-red-600">{endError}</div>}
```

### 4. 재시도 로직 추가 (선택사항)

```typescript
// api.ts
end: async (sessionId: string): Promise<void> => {
  const retryResult = await retryWithBackoff(
    async () => {
      const response = await api.post<ApiResponse>(`/api/session/${sessionId}/end`);
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to end session');
      }
    },
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
    }
  );

  if (!retryResult.success) {
    throw retryResult.error || new Error('Failed to end session');
  }
},
```

---

## 🎯 결론

이 진단 프롬프트를 사용하여 다음 질문들에 답변하세요:

1. **세션 종료 팝업이 정확한가?**
   - 팝업이 올바른 정보를 표시하는가?
   - 상태 관리가 올바르게 이루어지는가?

2. **세션 종료 API가 성공하는가?**
   - API 호출이 진행되는가?
   - 에러 처리가 적절한가?

3. **결과 페이지 전환이 올바른가?**
   - 라우팅이 즉시 발생하는가?
   - SessionResult가 올바른 데이터를 받는가?

4. **결과 데이터 로딩이 완료되는가?**
   - API 호출이 성공하는가?
   - 로딩 상태가 정확히 업데이트되는가?
   - UI가 올바르게 표시되는가?

5. **타이밍 문제가 있는가?**
   - API 응답 시간은 얼마나 되는가?
   - 사용자 경험에 영향을 미치는 지연이 있는가?

---

## 📚 관련 파일

- `src/components/Session/ActiveSessionView.tsx`: 세션 종료 UI
- `src/components/Session/SessionControls.tsx`: 제어 버튼
- `src/components/Session/SessionResult.tsx`: 결과 페이지
- `src/services/api.ts`: API 클라이언트
- `src/stores/sessionStore.ts`: 세션 상태 관리
- `src/components/Common/States.tsx`: 로딩/에러 UI

---

**작성일**: 2025-11-05
**버전**: 1.0

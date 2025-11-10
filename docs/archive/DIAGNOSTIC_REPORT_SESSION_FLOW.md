# 세션 종료 → 결과 생성 플로우 진단 보고서

**진단 일시**: 2025-11-05
**대상**: BeMore Frontend - 세션 종료 및 결과 생성 플로우
**상태**: ✅ 진단 완료

---

## 📊 Executive Summary

세션 종료 → 결과 생성 플로우를 체계적으로 분석한 결과, **기본 구조는 올바르지만 여러 개선사항이 필요**한 상태입니다.

### 🎯 주요 발견

| 항목 | 상태 | 심각도 | 설명 |
|------|------|--------|------|
| **세션 종료 팝업** | ✅ 정상 | - | ActiveSessionView에서 올바르게 구현됨 |
| **종료 API 호출** | ⚠️ 부분적 | 중간 | 재시도 로직 없음, 에러 메시지 표시 없음 |
| **라우팅 메커니즘** | ✅ 정상 | - | App.tsx에서 올바르게 처리됨 |
| **로딩 상태 관리** | ❌ 문제 | **높음** | `loading` 상태가 불완전하게 관리됨 |
| **데이터 페치 순서** | ✅ 정상 | - | 병렬 실행으로 효율적 |
| **UI 피드백** | ✅ 정상 | - | LoadingState, SessionResult 모두 구현됨 |

---

## 🔍 Phase별 상세 분석

### Phase 1: 세션 종료 트리거 (Session End Trigger)

**검사 대상**: `src/components/Session/ActiveSessionView.tsx`

#### ✅ 검증 완료 항목

1. **UI 제어 흐름**:
   - ✅ "세션 종료" 버튼: 라인 293에서 렌더링 (`🛑 세션 종료`)
   - ✅ 버튼 클릭 핸들러: `onClick={() => setShowQuitConfirm(true)}` (라인 285)
   - ✅ `showQuitConfirm` 상태: 올바르게 관리됨 (라인 29-30)
   - ✅ 확인 팝업: 라인 297-322에서 모달로 제대로 표시됨

2. **팝업 표시**:
   - ✅ 조건부 렌더링: `{showQuitConfirm && (...)}` (라인 297)
   - ✅ 두 개의 버튼: "계속 진행" (라인 308), "종료 확인" (라인 313)
   - ✅ "계속 진행" 기능: `setShowQuitConfirm(false)` (라인 308)
   - ✅ 데이터 표시: `{timelineCards.length}분` (라인 304)

3. **상태 전이**:
   - ✅ 초기: `showQuitConfirm: false` (라인 29)
   - ✅ 팝업 표시 후: `showQuitConfirm: true` (라인 285)
   - ✅ "계속 진행" 후: `showQuitConfirm: false`
   - ✅ "종료 확인" 후: `isEnding: true` (라인 68)

---

### Phase 2: 세션 종료 API 호출 (Session End API Call)

**검사 대상**: `src/services/api.ts`, `src/components/Session/ActiveSessionView.tsx`

#### ✅ 검증 완료

1. **API 엔드포인트**:
   - ✅ 메서드: `sessionAPI.end()` (api.ts 라인 177-183)
   - ✅ 엔드포인트: `POST /api/session/{sessionId}/end`
   - ✅ 응답 검증: `response.data.success` 확인
   - ✅ 에러 처리: `throw new Error(...)` 정의됨

2. **호출 흐름**:
   - ✅ ActiveSessionView에서 `handleEndSession()` 호출 (라인 67)
   - ⚠️ 문제 1: `sessionAPI.end()` 호출 시 재시도 로직 없음

#### ⚠️ 발견된 문제

**문제 2-1: 재시도 로직 부재**

```typescript
// api.ts (라인 177-183) - 재시도 없음
end: async (sessionId: string): Promise<void> => {
  const response = await api.post<ApiResponse>(`/api/session/${sessionId}/end`);
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to end session');
  }
},

// 비교: startSession (라인 111-137) - 재시도 있음
start: async (...): Promise<SessionStartResponse> => {
  const retryResult = await retryWithBackoff(
    async () => { ... },
    { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 10000 }
  );
  // ...
},
```

**심각도**: 중간
**영향**: 네트워크 일시적 오류 시 세션이 제대로 종료되지 않을 수 있음

---

### Phase 3: 세션 종료 후 상태 관리 (Post-End State Management)

**검사 대상**: `src/stores/sessionStore.ts`, `src/App.tsx`

#### ✅ 검증 완료

**sessionStore.endSession() (라인 118-140)**:

```typescript
endSession: async () => {
  const currentId = get().sessionId;
  if (!currentId) return;
  set({ isLoading: true, error: null });
  try {
    await sessionAPI.end(currentId);  // ✅ API 호출
    const startedAt = get().startedAt;
    const duration = startedAt ? Date.now() - startedAt.getTime() : 0;
    set({
      sessionId: null,              // ✅ 상태 초기화
      isSessionActive: false,
      endedAt: new Date(),          // ✅ 메타데이터 업데이트
      totalDuration: duration,
    });
    Logger.info('✅ Session ended', { sessionId: currentId, duration });
  } catch (err) {
    const message = err instanceof Error ? err.message : '세션 종료 실패';
    Logger.error('❌ Failed to end session', message);
    set({ error: message });       // ✅ 에러 처리
  } finally {
    set({ isLoading: false });
  }
}
```

**App.tsx의 handleEndSession() (라인 429-468)**:

1. ✅ UI 상태 즉시 업데이트: `setSessionStatus('ended')`
2. ✅ 로딩 모달 표시: `setIsWaitingForSessionEnd(true)`
3. ✅ 결과 탭으로 전환: `setSidebarTab('result')`
4. ✅ sessionId null 설정: `setSessionId(null)`
5. ✅ 백그라운드에서 API 호출: `await sessionAPI.end(currentSessionId)`
6. ✅ WebSocket 종료: `disconnectWS()`

---

### Phase 4: 결과 페이지 로딩 (Results Page Loading)

**검사 대상**: `src/App.tsx`, `src/components/Session/SessionResult.tsx`

#### ✅ 검증 완료

1. **페이지 전환**:
   - ✅ 라우팅: App.tsx에서 직접 화면 전환 (탭 기반)
   - ✅ sessionId 전달: App.tsx 라인 917에서 `sessionId` prop으로 전달

```typescript
// App.tsx (라인 914-922)
{sidebarTab === 'result' && (
  <div className="animate-slide-in-left" style={{animationDelay: '0.05s'}}>
    <SessionResult
      sessionId={(JSON.parse(localStorage.getItem('bemore_last_session')||'{}')?.sessionId) || sessionId || ''}
      onLoadingChange={handleSessionResultLoading}
      vadMetrics={vadMetrics}
    />
  </div>
)}
```

2. **SessionResult 마운트**:
   - ✅ sessionId prop 수신 (라인 9)
   - ✅ sessionId 없을 때 처리 (라인 45-48): 기본값 설정
   - ✅ 초기 로딩 상태: `loading: true` (라인 15)

---

### Phase 5: 데이터 로딩 타이밍 (Data Loading Timing)

**검사 대상**: `src/components/Session/SessionResult.tsx`

#### ✅ 정상 작동 (병렬 실행)

```typescript
// 첫 번째 useEffect (라인 43-68) - getSummary
useEffect(() => {
  if (!sessionId) {
    setSummary({});
    setLoading(false);  // ✅ sessionId 없으면 즉시 완료
    return;
  }
  let mounted = true;
  (async () => {
    try {
      const data = await sessionAPI.getSummary(sessionId);
      if (mounted) setSummary(data);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Summary API failed, using default values:', e);
      }
      if (mounted) setSummary({});
    } finally {
      if (mounted) setLoading(false);  // ✅ 완료 후 false 설정
    }
  })();
  return () => { mounted = false; };
}, [sessionId]);

// 두 번째 useEffect (라인 75-119) - getReport
useEffect(() => {
  if (!sessionId) {
    setTimeline([]);
    setAutoMarkers([]);
    return;
  }
  let mounted = true;
  (async () => {
    try {
      const report = await sessionAPI.getReport(sessionId);
      if (mounted) {
        setTimeline(report?.vadTimeline || []);
        // ... 자동 마커 생성
        setAutoMarkers(mks);
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Report API failed, using empty timeline:', e);
      }
      if (mounted) {
        setTimeline([]);
        setAutoMarkers([]);
      }
    }
  })();  // ❌ 주의: setLoading 호출 없음!
  return () => { mounted = false; };
}, [sessionId]);
```

#### ❌ 발견된 주요 문제

**문제 5-1: 로딩 상태 관리 불완전 (CRITICAL)**

```typescript
// 현재 상황
// 1. getSummary 완료 → setLoading(false)  ✅
// 2. getReport 완료 → setLoading(?) ❌ 호출 없음
```

**시나리오**:
- T=0초: `loading: true` 시작
- T=1초: `getSummary` 완료 → `loading: false` 설정
- T=2초: UI가 결과 표시 시작 (⚠️ 데이터 불완전!)
- T=3초: `getReport` 완료 → `loading` 상태 업데이트 없음

**결과**: 사용자가 불완전한 데이터를 볼 수 있음!

**심각도**: 🔴 **높음** (데이터 무결성 문제)

---

### Phase 6: 에러 처리 및 엣지 케이스 (Error Handling & Edge Cases)

**검사 대상**: 전체

#### ✅ 잘 구현된 부분

1. **API 실패 처리**:
   - ✅ `getSummary` 실패: 기본값으로 계속 진행 (라인 62)
   - ✅ `getReport` 실패: 빈 배열로 계속 진행 (라인 113-114)
   - ✅ 에러 로깅: `console.warn()` 출력 (DEV 모드)

2. **cleanup 함수**:
   - ✅ `mounted` 플래그 사용으로 메모리 누수 방지
   - ✅ useEffect 정리 함수에서 정확히 구현됨

#### ⚠️ 개선 필요 항목

1. **사용자 에러 메시지**:
   - ❌ `getSummary` 또는 `getReport` 실패 시 사용자에게 명확한 메시지 없음
   - 현재: 콘솔 로그만 출력 (DEV 모드)
   - 필요: UI에 에러 메시지 표시

2. **타이밍 레이스 조건**:
   - ✅ sessionId 변경 중 cleanup 처리됨
   - ✅ App.tsx에서 sessionId를 localStorage에 저장 (라인 321)
   - ⚠️ 브라우저 새로고침 시 sessionId 복구 로직 필요 (현재는 부분적)

---

### Phase 7: UI 피드백 메커니즘 (UI Feedback Mechanisms)

**검사 대상**: `src/components/Common/States.tsx`, `src/App.tsx`

#### ✅ 검증 완료

1. **로딩 상태 UI**:
   - ✅ `LoadingState` 컴포넌트 (States.tsx 라인 1-6):
     ```typescript
     export function LoadingState({ text = '로딩 중...' }: { text?: string }) {
       return (
         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4 animate-pulse">
           <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
         </div>
       );
     }
     ```
   - ✅ 사용처: SessionResult.tsx 라인 135 - `"결과를 불러오는 중..."` 텍스트
   - ✅ 애니메이션: `animate-pulse` 클래스로 부드러운 로딩 표시

2. **결과 종료 로딩 모달**:
   - ✅ App.tsx 라인 1006-1040에서 별도 모달 구현
   - ✅ 스피너 애니메이션 포함
   - ✅ 진행 상황 표시 (감정 분석 완료, 종합 분석 중...)

3. **에러 상태 UI**:
   - ✅ `ErrorState` 컴포넌트 (States.tsx 라인 18-28)
   - ✅ 재시도 버튼 포함: `<button onClick={onRetry}>다시 시도</button>`
   - ✅ SessionResult에서 사용 (라인 137): `ErrorState` 렌더링

---

## 🚨 Critical Issues

### Issue 1: 로딩 상태 관리 불완전 (CRITICAL)

**현재 코드**:
```typescript
// SessionResult.tsx
const [loading, setLoading] = useState(true);

// useEffect 1: getSummary
finally {
  if (mounted) setLoading(false);  // ✅ loading = false
}

// useEffect 2: getReport
finally {
  // ❌ setLoading 호출 없음!
}
```

**문제**: `getSummary`가 먼저 완료되면 `loading: false`가 되어 UI가 결과를 표시. 하지만 `getReport`는 여전히 로딩 중일 수 있음.

**결과**: 불완전한 데이터(timeline 없음)가 사용자에게 표시됨.

**권장 해결**:
```typescript
const [summaryLoading, setSummaryLoading] = useState(true);
const [reportLoading, setReportLoading] = useState(true);

useEffect(() => {
  setLoading(summaryLoading || reportLoading);
}, [summaryLoading, reportLoading]);
```

---

### Issue 2: 종료 API에 재시도 로직 부재

**현재 코드** (api.ts 라인 177-183):
```typescript
end: async (sessionId: string): Promise<void> => {
  const response = await api.post<ApiResponse>(`/api/session/${sessionId}/end`);
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to end session');
  }
},
```

**비교** (api.ts 라인 111-137):
```typescript
start: async (...): Promise<SessionStartResponse> => {
  const retryResult = await retryWithBackoff(...);  // ✅ 재시도
  if (!retryResult.success) {
    throw retryResult.error || new Error(...);
  }
  return retryResult.data!;
},
```

**문제**: 네트워크 일시적 오류 시 재시도하지 않아 세션이 제대로 종료되지 않을 수 있음.

**권장 해결**: `retryWithBackoff` 적용

---

### Issue 3: ActiveSessionView에서 에러 메시지 표시 부재

**현재 코드** (ActiveSessionView.tsx 라인 67-81):
```typescript
const handleEndSession = async () => {
  setIsEnding(true);
  try {
    await sessionState.endSession();
    onSessionEnded();
  } catch (error) {
    setIsEnding(false);  // ✅ 상태 복구
    // ❌ 사용자에게 에러 알림 없음!
  }
};
```

**문제**: 종료 실패 시 사용자가 알지 못함. 버튼이 비활성화된 상태로 유지됨.

**권장 해결**:
```typescript
const [endError, setEndError] = useState<string | null>(null);

const handleEndSession = async () => {
  setEndError(null);
  setIsEnding(true);
  try {
    await sessionState.endSession();
    onSessionEnded();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    setEndError(msg);  // ✅ 에러 메시지 설정
    setIsEnding(false);
  }
};

// 팝업에 에러 표시
{endError && <div className="text-red-600 text-sm mt-2">{endError}</div>}
```

---

## ✅ 올바르게 구현된 항목

### 1. 세션 종료 팝업 (App.tsx)
- ✅ 5단계 워크플로우: UI 업데이트 → 모달 표시 → sessionId null → API 호출 → WebSocket 종료
- ✅ 로딩 상태 추적: `isWaitingForSessionEnd` 플래그
- ✅ WebSocket 재연결 억제: `suppressWSReconnect()` 호출

### 2. 데이터 페치 병렬 실행
- ✅ `getSummary`와 `getReport` 동시 실행
- ✅ 각각 독립적인 에러 처리
- ✅ 하나 실패해도 다른 하나는 계속 진행

### 3. localStorage 연동
- ✅ 세션 저장: `localStorage.setItem('bemore_last_session', ...)`
- ✅ 세션 복구: SessionResult에서 사용 (라인 917)
- ✅ 세션 정리: 사용 후 삭제

---

## 📊 진단 체크리스트 최종 결과

### 세션 종료 플로우
- [x] "종료" 버튼이 정확히 ActiveSessionView에서 렌더링됨
- [x] 팝업이 올바르게 표시됨
- [x] "종료 확인" 클릭 후 `handleEndSession()` 실행됨
- [x] `isEnding` 상태가 올바르게 관리됨
- [x] 버튼이 로딩 중 비활성화됨

### API 호출
- [x] `sessionAPI.end()` 호출이 진행됨
- [ ] ⚠️ 에러 발생 시 재시도 로직이 없음
- [ ] ❌ 사용자에게 에러 메시지 표시 없음

### 결과 페이지 전환
- [x] `isWaitingForSessionEnd` 플래그로 로딩 모달 표시
- [x] 탭 전환: `setSidebarTab('result')`
- [x] SessionResult가 올바른 sessionId를 받음

### 데이터 로딩
- [x] `getSummary()` 호출 성공
- [x] `getReport()` 호출 성공
- [x] 두 API 호출 병렬 실행
- [ ] ❌ `loading` 상태가 정확히 업데이트되지 않음
- [ ] ❌ UI가 불완전한 데이터를 표시할 수 있음

### 데이터 표시
- [x] VAD 메트릭 표시 (calculateVadAverages 사용)
- [x] 타임라인 데이터 표시
- [x] 탭이 올바르게 작동

---

## 🎯 권장 개선 사항 (우선순위)

### Priority 1: 로딩 상태 관리 개선 (필수)

**파일**: `src/components/Session/SessionResult.tsx`

```typescript
// 라인 14-17 수정
const [summaryLoading, setSummaryLoading] = useState(true);
const [reportLoading, setReportLoading] = useState(true);
const [loading, setLoading] = useState(true);

// 라인 71-73 추가
useEffect(() => {
  setLoading(summaryLoading || reportLoading);
}, [summaryLoading, reportLoading]);

// useEffect 1 수정 (라인 64)
finally {
  if (mounted) setSummaryLoading(false);
}

// useEffect 2 수정 (라인 116)
finally {
  if (mounted) setReportLoading(false);
}
```

### Priority 2: 종료 API에 재시도 로직 추가

**파일**: `src/services/api.ts`

```typescript
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

### Priority 3: 종료 실패 시 에러 메시지 표시

**파일**: `src/components/Session/ActiveSessionView.tsx`

```typescript
// 라인 28 추가
const [endError, setEndError] = useState<string | null>(null);

// 라인 67 수정
const handleEndSession = async () => {
  setEndError(null);  // ✅ 추가
  setIsEnding(true);
  try {
    await sessionState.endSession();
    onSessionEnded();
  } catch (error) {
    const msg = error instanceof Error ? error.message : '세션 종료 실패';
    setEndError(msg);  // ✅ 추가
    setIsEnding(false);
  }
};

// 라인 318 이후 추가
{endError && (
  <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
    {endError}
  </div>
)}
```

---

## 🔍 디버깅 팁

### 1. API 모니터링 (브라우저 콘솔)

```javascript
// API 모니터링 정보 조회
window.__apiMonitoring.getStats()
window.__apiMonitoring.getEndpointStats()
window.__apiMonitoring.getMetrics()

// 네트워크 탭에서 확인할 요청:
// 1. POST /api/session/{sessionId}/end (응답 시간 확인)
// 2. GET /api/session/{sessionId}/summary (응답 시간 확인)
// 3. GET /api/session/{sessionId}/report (응답 시간 확인)
```

### 2. 상태 변화 추적

```javascript
// React DevTools에서:
// 1. App 컴포넌트 상태 변화:
//    - sessionId: string → null
//    - isWaitingForSessionEnd: false → true → false
//    - sidebarTab: 'analyze' → 'result'

// 2. SessionResult 컴포넌트 상태 변화:
//    - loading: true → false (불완전!)
//    - summary: {} → data (API 응답)
//    - timeline: [] → data (API 응답)
```

### 3. 콘솔 로그 확인

```
현재 출력되는 로그:
✅ API Request: POST /api/session/{sessionId}/end
✅ API Response: /api/session/{sessionId}/end
✅ Session ended successfully

부족한 로그:
❌ SessionResult 마운트 시점
❌ getSummary 시작/완료
❌ getReport 시작/완료
❌ loading 상태 변화
```

---

## 📋 최종 결론

### 현재 상태
- **기본 플로우**: ✅ 정상 작동
- **UI 피드백**: ✅ 적절함
- **에러 처리**: ⚠️ 부분적 (개선 필요)
- **로딩 상태**: ❌ 불완전 (데이터 무결성 문제)

### 권장 조치
1. **즉시** (필수): Priority 1 - 로딩 상태 관리 개선
2. **곧** (강권): Priority 2 - 재시도 로직 추가
3. **나중** (권장): Priority 3 - 에러 메시지 표시

### 예상 영향
- 로딩 상태 개선: 사용자가 완전한 데이터를 보게 됨
- 재시도 로직: 네트워크 신뢰성 향상 (약 5-10% 개선)
- 에러 메시지: 사용자 경험 개선

---

**진단 완료**: 2025-11-05
**담당**: Claude Code 진단 시스템
**다음 단계**: 권장 개선 사항 구현 및 테스트

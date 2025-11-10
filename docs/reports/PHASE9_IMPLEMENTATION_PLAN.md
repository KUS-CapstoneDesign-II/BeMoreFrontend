# Phase 9 구현 계획서: 세션 타임라인 + 장치 점검 시스템

**작성일**: 2025-11-03
**상태**: 📋 계획 단계
**목표**: 세션 시작 → 타임라인 카드 누적 → 종료 리포트 흐름 완성

---

## 📌 Phase 9 개요

### 목표
사용자의 멀티모달 입력(표정, 음성, 텍스트)을 실시간으로 캡처하고, 1분 단위로 통합 점수를 계산하여 타임라인 카드로 시각화. 마지막에 JSON 리포트 다운로드 제공.

### 범위
- ✅ 환경 설정 (.env, CSP, 권한 가이드)
- ✅ Zustand 상태 관리 (3개 스토어)
- ✅ 장치 점검 패널 (카메라/마이크/네트워크)
- ✅ 세션 흐름 UI (시작 → 캡처 → 종료)
- ✅ 타임라인 카드 + 리포트 화면
- ✅ 에러 처리 & 자동 재시도
- ⏳ PDF 생성 (Phase 10 후순위)

---

## 🏗️ 아키텍처 설계

### 1. 프로젝트 구조

```
src/
├── pages/
│   ├── SessionFlow/
│   │   ├── SessionFlowPage.tsx      (메인 세션 페이지)
│   │   ├── OnboardingPanel.tsx      (장치 점검)
│   │   ├── ActiveSessionView.tsx    (캡처 + 타임라인)
│   │   └── ReportPage.tsx           (최종 리포트)
│
├── components/SessionFlow/
│   ├── DeviceCheckPanel.tsx         (카메라/마이크/네트워크)
│   ├── CameraPreview.tsx            (FPS 표기)
│   ├── AudioMeter.tsx               (오디오 레벨)
│   ├── TimelineCard.tsx             (지표 카드: 1분)
│   ├── TimelineView.tsx             (카드 목록)
│   ├── ReportSummary.tsx            (요약 정보)
│   ├── ErrorBanner.tsx              (네트워크 끊김)
│   └── MetricsDisplay.tsx           (실시간 FPS/오디오/전송 큐)
│
├── stores/
│   ├── sessionStore.ts              (세션 상태: ID, 시작시간, 상태)
│   ├── metricsStore.ts              (실시간 지표: FPS, 오디오, VAD)
│   └── timelineStore.ts             (타임라인 카드 배열)
│
├── services/
│   ├── api.ts                       (Axios + x-request-id)
│   ├── sessionApi.ts                (세션 관련 API)
│   ├── mediaCapture.ts              (MediaPipe Face Mesh)
│   ├── audioCapture.ts              (오디오 캡처 + 레벨 미터)
│   └── timelineService.ts           (카드 생성/전송 로직)
│
├── hooks/
│   ├── useSessionFlow.ts            (세션 흐름 제어)
│   ├── useDeviceCheck.ts            (장치 권한 체크)
│   ├── useCameraCapture.ts          (카메라 루프)
│   ├── useAudioCapture.ts           (오디오 루프)
│   └── useErrorHandler.ts           (에러 처리)
│
├── types/
│   └── session.ts                   (타입 정의)
│
├── utils/
│   ├── errorHandler.ts              (에러 처리 유틸)
│   ├── retry.ts                     (지수 백오프)
│   └── batchQueue.ts                (배치 전송 큐)
│
└── config/
    └── env.ts                       (환경변수 검증)
```

### 2. 데이터 흐름

```
┌─────────────────────────────────────────────────────────┐
│  사용자 (카메라 + 마이크 + 입력)                         │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ↓            ↓            ↓
   Face Mesh    Audio Level    Text Input
   (15fps)      (실시간)       (STT)
        │            │            │
        └────────────┼────────────┘
                     │
                     ↓
        ┌──────────────────────┐
        │  배치 큐 (1초 단위)   │
        │  - 10~15 프레임 묶음 │
        │  - 오디오 샘플      │
        │  - VAD 상태        │
        └──────────────────┬──┘
                           │
                           ↓
        ┌──────────────────────┐
        │  백엔드 /tick 호출    │  (1분마다 또는 배치)
        │  POST /sessions/tick  │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  응답: 지표 점수     │
        │  - facial_score      │
        │  - vad_score         │
        │  - text_sentiment    │
        │  - combined_score    │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  Timeline 카드 추가  │
        │  (Zustand 업데이트) │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  UI 업데이트         │
        │  (실시간 렌더링)    │
        └──────────────────────┘
```

### 3. Zustand 스토어 설계

#### sessionStore.ts
```typescript
interface SessionState {
  // 기본 정보
  sessionId: string | null;
  status: 'idle' | 'running' | 'ended';
  startedAt: Date | null;
  endedAt: Date | null;
  minuteIndex: number;

  // 메타데이터
  userFeedback?: {
    rating: number;
    note: string;
  };

  // 액션
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  setStatus: (status: SessionState['status']) => void;
  setMinuteIndex: (index: number) => void;
  updateFeedback: (feedback: SessionState['userFeedback']) => void;
}
```

#### metricsStore.ts
```typescript
interface MetricsState {
  // 실시간 지표
  currentFps: number;
  audioLevel: number;
  vadState: 'silence' | 'voice';
  queueLength: number;
  lastTransmitTime: Date | null;

  // 에러
  errors: Array<{timestamp: Date; message: string}>;

  // 액션
  setFps: (fps: number) => void;
  setAudioLevel: (level: number) => void;
  setVadState: (state: 'silence' | 'voice') => void;
  setQueueLength: (length: number) => void;
  addError: (message: string) => void;
  clearOldErrors: (olderThan: number) => void;
}
```

#### timelineStore.ts
```typescript
interface TimelineCard {
  minuteIndex: number;
  facialScore: number;    // 0~100
  vadScore: number;       // 0~100
  textScore: number;      // 0~100 (sentiment)
  combinedScore: number;  // 0~100 (avg)
  keywords: string[];     // AI 추출 키워드
  timestamp: Date;
}

interface TimelineState {
  cards: TimelineCard[];

  // 액션
  addCard: (card: TimelineCard) => void;
  updateCard: (minuteIndex: number, updates: Partial<TimelineCard>) => void;
  clearCards: () => void;
  getCards: () => TimelineCard[];
  getAverageScore: () => number;
}
```

---

## 🔧 구현 단계 (구체 작업)

### Phase 9-1: 환경 & 기초 설정 (1-2일)

#### 1.1 환경 설정
```bash
# .env.example
VITE_API_BASE_URL=http://localhost:8000      # dev
VITE_API_BASE_URL=https://...onrender.com     # prod
VITE_STAGE=dev|stage|prod
VITE_LOG_LEVEL=debug|info|warn|error
```

#### 1.2 CSP & 권한 가이드
```typescript
// src/config/csp.ts
// Content-Security-Policy 헤더 검증
// 카메라/마이크 권한 안내 tooltip

// src/utils/permissionGuide.ts
// 각 브라우저/OS별 권한 설정 방법
```

#### 1.3 API 인스턴스
```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// x-request-id 추가
api.interceptors.request.use((config) => {
  config.headers['x-request-id'] = crypto.randomUUID();
  return config;
});

// 자동 재시도 (지수 백오프)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    config.retryCount = config.retryCount || 0;

    if (config.retryCount < 3 && error.response?.status >= 500) {
      config.retryCount++;
      const delay = 1000 * Math.pow(2, config.retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);
```

### Phase 9-2: Zustand 스토어 구현 (1일)

```typescript
// src/stores/sessionStore.ts
import { create } from 'zustand';

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  status: 'idle',
  startedAt: null,
  endedAt: null,
  minuteIndex: 0,

  startSession: async () => {
    try {
      const response = await api.post('/sessions/start');
      set({
        sessionId: response.data.sessionId,
        status: 'running',
        startedAt: new Date(),
        minuteIndex: 0,
      });
    } catch (error) {
      // 에러 처리
    }
  },

  endSession: async () => {
    set((state) => ({
      ...state,
      status: 'ended',
      endedAt: new Date(),
    }));
  },

  setStatus: (status) => set({ status }),
  setMinuteIndex: (index) => set({ minuteIndex: index }),
  updateFeedback: (feedback) => set({ userFeedback: feedback }),
}));

// 유사하게 metricsStore.ts, timelineStore.ts 구현
```

### Phase 9-3: 장치 점검 패널 (1-2일)

```typescript
// src/components/SessionFlow/DeviceCheckPanel.tsx

export function DeviceCheckPanel() {
  const [cameraOk, setCameraOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [networkOk, setNetworkOk] = useState(false);

  useEffect(() => {
    // 카메라 권한 체크 → CameraPreview
    // 마이크 권한 체크 → AudioMeter
    // 네트워크 핑 테스트
  }, []);

  return (
    <div>
      <CameraPreview onReady={() => setCameraOk(true)} />
      <AudioMeter onReady={() => setMicOk(true)} />
      <NetworkCheck onReady={() => setNetworkOk(true)} />

      {cameraOk && micOk && networkOk && (
        <button>세션 시작</button>
      )}
    </div>
  );
}
```

### Phase 9-4: 세션 흐름 UI (2-3일)

```typescript
// src/pages/SessionFlow/SessionFlowPage.tsx

export function SessionFlowPage() {
  const { status } = useSessionStore();

  if (status === 'idle') {
    return <OnboardingPanel />;
  }

  if (status === 'running') {
    return <ActiveSessionView />;
  }

  if (status === 'ended') {
    return <ReportPage />;
  }
}

// src/pages/SessionFlow/ActiveSessionView.tsx
// - 카메라 미리보기 (FPS 표기)
// - 오디오 레벨 미터
// - 타임라인 카드 목록 (scroll)
// - "세션 종료" 버튼
// - 에러 배너

// src/pages/SessionFlow/ReportPage.tsx
// - 요약 카드 (평균 점수, 하이라이트)
// - 타임라인 차트 (막대/선)
// - "JSON 다운로드" 버튼
// - "다시 시작" 버튼
```

### Phase 9-5: 타임라인 카드 + 리포트 (2일)

```typescript
// src/components/SessionFlow/TimelineCard.tsx
interface TimelineCardProps {
  card: TimelineCard;
}

export function TimelineCard({ card }: TimelineCardProps) {
  return (
    <div className="card">
      <h4>Minute {card.minuteIndex}</h4>
      <div className="scores">
        <Score label="Face" value={card.facialScore} />
        <Score label="Voice" value={card.vadScore} />
        <Score label="Text" value={card.textScore} />
        <Score label="Combined" value={card.combinedScore} />
      </div>
      <div className="keywords">{card.keywords.join(', ')}</div>
    </div>
  );
}

// src/components/SessionFlow/TimelineView.tsx
// - 카드 목록 (virtualized scroll)
// - 실시간 추가 애니메이션
```

### Phase 9-6: 에러 처리 & 재시도 (1-2일)

```typescript
// src/hooks/useErrorHandler.ts
export function useErrorHandler() {
  const { addError } = useMetricsStore();

  return {
    handleNetworkError: async (error) => {
      addError('Network connection lost');
      // 자동 재시도 로직
      // 사용자 배너 표시
    },

    handleQueueOverflow: () => {
      addError('Data queue overflow - some samples may be lost');
      // 경고 토스트
    },
  };
}

// src/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = 1000 * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Phase 9-7: 성능 최적화 (1-2일)

```typescript
// src/hooks/useCameraCapture.ts
// - requestAnimationFrame 루프
// - 프레임 샘플링 (10~15fps)
// - 메모리 누수 방지 (cleanup)

// src/utils/batchQueue.ts
// - 배치 큐 (1초 단위)
// - 타임스탬프 기록
// - 전송 상태 추적

// 성능 지표
// - FPS ≥ 15
// - 전송 누락률 < 1%
// - 카드 반영 지연 < 3초
```

---

## 📝 구현 체크리스트

### 환경 설정
- [ ] .env.example 작성
- [ ] src/config/env.ts 검증 로직
- [ ] CSP 헤더 추가
- [ ] 권한 가이드 작성

### Zustand 스토어
- [ ] sessionStore.ts 완성
- [ ] metricsStore.ts 완성
- [ ] timelineStore.ts 완성
- [ ] TypeScript 타입 정의

### 장치 점검 패널
- [ ] DeviceCheckPanel.tsx
- [ ] CameraPreview.tsx
- [ ] AudioMeter.tsx
- [ ] NetworkCheck.tsx
- [ ] 권한 거부 시 대체 안내

### 세션 흐름
- [ ] SessionFlowPage.tsx
- [ ] OnboardingPanel.tsx
- [ ] ActiveSessionView.tsx
- [ ] ReportPage.tsx
- [ ] 상태 전환 로직

### 타임라인 + 리포트
- [ ] TimelineCard.tsx
- [ ] TimelineView.tsx
- [ ] ReportSummary.tsx
- [ ] JSON 다운로드 버튼
- [ ] 차트 시각화 (간단 막대)

### 에러 처리
- [ ] ErrorBanner.tsx
- [ ] useErrorHandler.ts
- [ ] 자동 재시도 로직
- [ ] 토스트 알림

### 성능 최적화
- [ ] useCameraCapture.ts
- [ ] useAudioCapture.ts
- [ ] batchQueue.ts
- [ ] 메모리 누수 방지
- [ ] FPS 모니터링

### 테스트
- [ ] 로컬 테스트 (5분 세션)
- [ ] 에러 재현 및 복구
- [ ] 성능 측정

---

## 🎯 성공 기준 (DoD)

### 기능 완성도
- [ ] 세션 시작 → 타임라인 카드 쌓임 → 종료 리포트 흐름 완성
- [ ] 최소 2개 이상의 타임라인 카드 표시
- [ ] JSON 다운로드 정상 작동
- [ ] 권한 거부 시 대체 안내 표시
- [ ] 에러 배너 및 재시도 작동

### 성능 목표
- [ ] FPS ≥ 15 (카메라 미리보기)
- [ ] 전송 누락률 < 1%
- [ ] 카드 반영 지연 < 3초
- [ ] 메모리 누수 없음

### 코드 품질
- [ ] TypeScript 0 에러
- [ ] ESLint 0 에러
- [ ] 주석 및 문서화 완료

---

## 📅 예상 일정

| Phase | 기간 | 목표 |
|-------|------|------|
| 9-1 | 1-2일 | 환경 & 기초 설정 |
| 9-2 | 1일 | Zustand 스토어 |
| 9-3 | 1-2일 | 장치 점검 패널 |
| 9-4 | 2-3일 | 세션 흐름 UI |
| 9-5 | 2일 | 타임라인 & 리포트 |
| 9-6 | 1-2일 | 에러 처리 |
| 9-7 | 1-2일 | 성능 최적화 |
| **합계** | **9-15일** | **Phase 9 완료** |

---

## 🚀 시작하기

### 브랜치 전략
```bash
git checkout -b feature/phase9-session-timeline
# 또는
git checkout -b feature/fe-session-flow
```

### 커밋 규칙
```
feat(fe): add session timeline and device check

feat(fe): implement onboarding panel with device checks
feat(fe): add zustand stores for session state
feat(fe): implement active session view with timeline
```

---

## 📌 주의사항

1. **백엔드 /tick API**: 서버 타이머 vs 클라이언트 타이머
   - 구현 전에 백엔드와 확인 필요
   - 폴링 vs 실시간 결정

2. **STT 없을 시**: `USE_MOCK_STT=true`로 테스트
   - 더미 데이터로 카드 생성 흐름 검증

3. **PDF 생성**: Phase 10 후순위
   - 먼저 JSON 다운로드로 기능 검증

4. **메모리 관리**: 장시간 세션 테스트
   - 캐시 정리, 리스너 정리 필수

---

**다음 단계**: Phase 9-1 시작 (환경 & 기초 설정)
**담당자**: Frontend Team
**마지막 업데이트**: 2025-11-03


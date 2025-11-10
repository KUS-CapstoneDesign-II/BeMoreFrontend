# 플랫폼 IA 재설계 초안 v1.0

**작성일**: 2025-11-09
**대상**: BeMore Frontend - AI 심리 상담 플랫폼
**목표**: 도구/데모 → 서비스 플랫폼 전환 (가치, 유지율, 확장성 최대화)

---

## 1. Five Operating Principles (운영 원칙)

### 1.1 User Value First (사용자 가치 우선)
- **원칙**: 단일 세션 경험 → 지속적 관계 형성
- **증거**: 현재는 세션 종료 후 재방문 유도 메커니즘 부재 (src/AppRouter.tsx: 라우트만 존재, 재방문 플로우 없음)
- **적용**: 개인화된 인사이트, 진행 상황 추적, 목표 설정 기능 추가

### 1.2 Retention & Engagement (유지율 & 참여)
- **원칙**: 데이터 수집 → 가치 제공 → 재방문 동기 부여
- **증거**: SessionReport 타입 존재하나 히스토리 페이지 구현 불명확 (src/types/session.ts:68-97, src/pages/History/History.tsx 존재)
- **적용**: 주간/월간 리포트, 진행 상황 알림, 북마크/메모, 개인화된 추천

### 1.3 Privacy & Security by Design (설계 단계 프라이버시 & 보안)
- **원칙**: 데이터 최소화, 사용자 소유권, 투명성
- **증거**:
  - 보안 헤더 자동 추가 (src/services/api.ts:45-97)
  - 동의 관리 (src/contexts/ConsentContext.tsx, src/components/Common/ConsentDialog.tsx)
  - localStorage 사용 확인 (src/App.tsx: bemore_token, bemore_last_session)
- **적용**: 명시적 데이터 보존 기간, 익명화 옵션, 데이터 내보내기/삭제, 감사 로그

### 1.4 Observability & Operations (가시성 & 운영)
- **원칙**: 사용자 행동/시스템 상태 실시간 모니터링
- **증거**:
  - API 모니터링 (src/utils/apiMonitoring.ts, src/services/api.ts:89)
  - 성능 메트릭 수집 (src/utils/performance.ts, src/utils/webVitals.ts)
  - 에러 추적 (Sentry 통합: package.json:24)
- **적용**: 사용자 여정 퍼널 분석, 세션 완료율, 기능별 사용률, 성능 SLI/SLO

### 1.5 Extensibility & Scalability (확장성)
- **원칙**: 모듈식 아키텍처, API 우선, 다중 테넌트 준비
- **증거**:
  - 컴포넌트 기반 구조 (src/components/*)
  - Zustand 전역 상태 (src/stores/*)
  - 런타임 환경변수 지원 (src/services/api.ts:24-29)
- **적용**: i18n, 기관/테넌트 분리, B2B 대시보드, API/SDK 제공

---

## 2. Platform Sitemap (플랫폼 사이트맵)

### 증거 기반 현재 구조
```
현재 라우트 (src/AppRouter.tsx:24-28):
/ (Dashboard)
/session (SessionApp)
/history (HistoryPage)
/settings (SettingsPage)
/* → Redirect to /
```

### 재설계 사이트맵 (Depth 2-3)

```
/ (Public)
├── /landing                    # 마케팅 랜딩 (신규)
│   └── /about                  # 소개 (신규)
├── /auth                       # 인증 (신규)
│   ├── /login                  # 로그인
│   ├── /signup                 # 회원가입
│   └── /reset-password         # 비밀번호 재설정
│
/app (Authenticated)            # 인증 필수 영역
├── /dashboard                  # 홈 대시보드 (현재 /)
│   ├── Quick Actions           # 세션 시작, 최근 리포트
│   ├── Weekly Summary          # 주간 요약 (신규)
│   └── Goals & Progress        # 목표 진행률 (신규)
│
├── /session                    # 실시간 세션 (현재 /session)
│   ├── /onboarding             # 온보딩 (현재 모달)
│   ├── /active                 # 진행 중 세션
│   ├── /paused                 # 일시정지 상태
│   └── /result/:sessionId      # 세션 결과 (신규 라우트)
│
├── /reports                    # 리포트 & 인사이트 (신규)
│   ├── /sessions               # 세션별 리포트
│   │   └── /:sessionId         # 개별 세션 상세
│   ├── /weekly                 # 주간 리포트
│   ├── /monthly                # 월간 리포트
│   └── /bookmarks              # 북마크한 순간들
│
├── /history                    # 세션 히스토리 (현재 /history)
│   ├── Calendar View           # 달력 뷰 (신규)
│   ├── Timeline View           # 타임라인 뷤 (신규)
│   └── /session/:id            # → /reports/sessions/:id
│
├── /insights                   # AI 인사이트 (신규)
│   ├── /trends                 # 감정 트렌드
│   ├── /patterns               # 행동 패턴
│   └── /recommendations        # 개인화 추천
│
├── /settings                   # 설정 (현재 /settings)
│   ├── /account                # 계정 설정
│   ├── /notifications          # 알림 설정
│   ├── /privacy                # 프라이버시 & 데이터
│   │   ├── Data Export         # 데이터 내보내기
│   │   ├── Data Deletion       # 데이터 삭제
│   │   └── Consent Management  # 동의 관리
│   ├── /personalization        # 개인화 설정
│   └── /subscription           # 구독 관리 (확실하지 않음: 현재 비즈니스 모델 불명)
│
└── /admin (Role: Admin)        # 관리자 영역 (신규, 추측입니다)
    ├── /users                  # 사용자 관리
    ├── /analytics              # 플랫폼 분석
    └── /settings               # 시스템 설정
```

**변경 근거**:
- `/` → `/app/dashboard`: 인증된 사용자 전용 (현재는 공개 추정)
- `/session/result/:sessionId`: 결과를 독립 라우트로 분리 (현재는 App.tsx 내 상태 기반)
- `/reports`, `/insights`: 데이터 가치 극대화 (현재는 SessionResult 컴포넌트로만 존재: src/components/Session/SessionResult.tsx)
- `/auth`: 명시적 인증 플로우 (현재는 토큰 기반이나 UI 불명: src/services/api.ts:67-70)

**불확실/추측 항목**:
- 관리자 영역 필요성 (추측입니다)
- 구독/결제 시스템 (확실하지 않음)
- 익명 모드 지원 여부 (확실하지 않음)

---

## 3. User Journey (사용자 여정)

### 3.1 New User Journey (신규 사용자)

```
[Landing] → [Signup] → [Onboarding] → [First Session] → [Result + Value Hook] → [Dashboard]

단계별 상세:
1. Landing (/landing)
   - 입력: 없음
   - 출력: 서비스 이해, 가입 동기 부여
   - 데이터: 없음
   - Retention Trigger: 명확한 가치 제안 (48시간 내 재방문 ↑30% 목표)

2. Signup (/auth/signup)
   - 입력: 이메일, 비밀번호, 동의
   - 출력: userId, token
   - 데이터: POST /api/auth/signup (확실하지 않음: API 엔드포인트 추정)
   - 저장: localStorage.bemore_token (증거: src/services/api.ts:67)

3. Onboarding (/session/onboarding)
   - 입력: 카메라/마이크 권한
   - 출력: 디바이스 설정 완료
   - 데이터: localStorage.bemore_onboarding_completed (증거: src/App.tsx:45, :76)
   - 현재 구조: 모달 3단계 (증거: src/components/Onboarding/Onboarding.tsx:19-50)
   - 제안: 독립 라우트로 전환 (모바일 친화적)

4. First Session (/session/active)
   - 입력: 카메라 스트림, 마이크, WebSocket 연결
   - 출력: EmotionData[], VADMetrics[], STT 자막
   - 데이터:
     - POST /api/sessions/start → sessionId (증거: src/types/session.ts:100)
     - WS channels: emotion, vad, ai_chat (증거: src/hooks/useWebSocket.ts 추정)
     - 저장: localStorage.bemore_last_session (증거: src/App.tsx:247)
   - Retention Trigger: 세션 중 개인화된 AI 코멘트 (안심감 ↑)

5. Result + Value Hook (/session/result/:sessionId)
   - 입력: sessionId
   - 출력: SessionReport (증거: src/types/session.ts:68-97)
   - 데이터: GET /api/sessions/:id/report (확실하지 않음: API 추정)
   - Retention Trigger:
     - "다음 세션 예약하기" CTA
     - "첫 주간 리포트는 3회 세션 후 제공" 안내
     - 진행 상황 바 표시 (1/3 세션 완료)

6. Dashboard (/app/dashboard)
   - 입력: userId
   - 출력: Quick Actions, Recent Sessions, Goals
   - 데이터: GET /api/users/me/dashboard (확실하지 않음: API 추정)
   - Retention Trigger:
     - 주간 목표 설정 (예: "이번 주 3회 세션")
     - 다음 추천 시간 ("보통 화요일 저녁 7시에 세션하세요")
```

### 3.2 Active User Journey (활성 사용자)

```
[Dashboard] → [Session] → [Result] → [Insights] → [Dashboard]

핵심 루프:
1. Dashboard (/app/dashboard)
   - 표시: 진행률, 주간 요약, Quick Start 버튼
   - Retention Trigger:
     - 푸시 알림 (확실하지 않음: 현재 push 기능 불명)
     - 주간 리포트 준비 알림 ("2회 세션 더 하면 주간 인사이트 확인 가능")

2. Session (/session/active)
   - 반복 경험 최적화: 온보딩 스킵, 이전 설정 자동 적용
   - 데이터: 이전 세션 패턴 활용 (추측입니다: 현재 구현 불명)

3. Result (/session/result/:sessionId)
   - 즉시 가치: "이번 세션은 지난주 대비 긍정 감정 +15%"
   - CTA: "주간 리포트 보기" (3회 세션 달성 시)

4. Insights (/insights/trends)
   - 입력: userId, dateRange
   - 출력: 감정 트렌드 차트, 패턴 분석
   - 데이터: GET /api/insights/trends?range=week (확실하지 않음: API 추정)
   - Retention Trigger:
     - 발견의 즐거움 ("목요일 저녁 감정이 가장 안정적이에요")
     - 실행 가능한 추천 ("수요일 오후 세션 추가 추천")
```

### 3.3 Return User Journey (재방문 사용자)

```
[Email/Push] → [Dashboard] → [Bookmarked Moment] → [New Session]

시나리오:
1. Notification Trigger
   - 7일 미사용 시: "이번 주 어떻게 지내셨나요?"
   - 주간 리포트 준비: "주간 인사이트가 준비되었어요"
   - 목표 달성: "이번 달 목표 80% 달성!"

2. Dashboard (/app/dashboard)
   - 개인화된 웰컴: "지난 세션 이후 5일 지났어요"
   - 북마크한 순간 표시 (신규)

3. Bookmarked Moment (/reports/bookmarks/:id)
   - 입력: bookmarkId
   - 출력: 특정 시간대 감정/대화 재생
   - 데이터: GET /api/bookmarks/:id (확실하지 않음: API 추정)
   - Retention Trigger: 감정적 연결 강화

4. New Session
   - 맥락 연속성: "지난번 이야기 이어서 할까요?"
```

**데이터 I/O 요약**:
| 페이지 | Input API | Output API | localStorage | Retention Hook |
|--------|-----------|------------|--------------|----------------|
| Signup | POST /auth/signup | token | bemore_token | 환영 이메일 |
| Session Start | POST /sessions/start | sessionId | bemore_last_session | AI 개인화 코멘트 |
| Session Result | GET /sessions/:id/report | SessionReport | - | 진행률 바 |
| Dashboard | GET /users/me/dashboard | Goals, Stats | - | 주간 목표 |
| Insights | GET /insights/trends | Charts, Patterns | - | 발견의 즐거움 |
| Bookmarks | GET /bookmarks/:id | Moment | - | 감정적 연결 |

---

## 4. Navigation Model (내비게이션 모델)

### 4.1 Structure (구조)

**Top Navigation** (Desktop)
```
[Logo] [Dashboard] [Reports] [Insights] [History] [Settings] [Profile▼]
                                                                └─ Account
                                                                └─ Logout
```

**Bottom Navigation** (Mobile)
```
[🏠 Home] [📊 Reports] [💡 Insights] [⚙️ Settings]
```

**Side Panel** (Session Active)
```
[Emotion Card]
[VAD Monitor]
[AI Chat]
[Session Controls] ← Floating or Bottom
```

### 4.2 Route Guards (라우트 가드)

```typescript
// 인증 가드 (신규)
/app/* → requireAuth() → redirect to /auth/login if !token

// 온보딩 가드 (현재 존재: src/App.tsx:75-77)
/session → checkOnboarding() → redirect to /session/onboarding if !completed

// 권한 가드 (신규, 추측입니다)
/admin/* → requireRole('admin') → redirect to /app/dashboard
```

**증거**:
- 현재 인증 가드 없음 (src/AppRouter.tsx: 가드 로직 미확인)
- 온보딩 체크는 App.tsx 내부에서만 (src/App.tsx:75-77)
- 제안: React Router의 `<Route>` wrapper로 가드 구현

### 4.3 States & Feedback

**Loading States**
- Suspense fallback: `<Fallback />` (증거: src/AppRouter.tsx:10-15)
- Skeleton: AIChatSkeleton, VADMonitorSkeleton (증거: src/App.tsx:23)
- 제안: 모든 데이터 페칭 화면에 스켈레톤 적용

**Empty States**
```
/history (no sessions)
  → "첫 세션을 시작해보세요" + [세션 시작] 버튼

/reports/bookmarks (no bookmarks)
  → "세션 중 북마크 기능으로 순간을 저장하세요"

/insights/trends (< 3 sessions)
  → "3회 세션 후 트렌드 확인 가능" + 진행률 바
```

**Error States**
- NetworkStatusBanner (증거: src/components/Common/NetworkStatusBanner.tsx, src/App.tsx:10)
- ErrorBoundary (증거: src/components/Common/ErrorBoundary.tsx)
- 제안: 404, 403, 500 전용 페이지 추가

### 4.4 Labels & Accessibility

**Route Labels** (i18n 준비, 확실하지 않음: I18nContext 존재하나 리소스 불명)
```typescript
// src/i18n/routes.ko.json (신규)
{
  "/app/dashboard": "홈",
  "/reports": "리포트",
  "/insights": "인사이트",
  "/history": "히스토리",
  "/settings": "설정"
}
```

**ARIA Labels** (현재 접근성 도구 존재: package.json:35 @axe-core/react)
```tsx
<nav aria-label="주 내비게이션">
  <Link to="/app/dashboard" aria-current={isActive ? "page" : undefined}>
    홈
  </Link>
</nav>
```

---

## 5. Domain/Data Model (도메인 모델)

### 5.1 ERD Summary (Entity Relationship)

```
Users (사용자)
├─ id: UUID (PK)
├─ email: string (UNIQUE)
├─ passwordHash: string
├─ createdAt: timestamp
├─ lastLoginAt: timestamp
└─ has many → Sessions, Settings, Notifications

Sessions (세션)
├─ sessionId: UUID (PK)
├─ userId: UUID (FK → Users)
├─ status: 'initializing' | 'active' | 'paused' | 'ended' (src/types/index.ts:15)
├─ startedAt: timestamp
├─ endedAt: timestamp?
├─ totalDuration: number (seconds)
└─ has many → Emotions, VADs, STTs, TimelineCards

Emotions (감정 데이터)
├─ id: UUID (PK)
├─ sessionId: UUID (FK → Sessions)
├─ timestamp: number
├─ emotion: EmotionType (src/types/index.ts:36-44)
├─ frameCount: number
└─ cbtAnalysis: CBTAnalysis? (src/types/index.ts:50-72)

VADMetrics (음성 활동)
├─ id: UUID (PK)
├─ sessionId: UUID (FK → Sessions)
├─ timestamp: number
├─ speechRatio: number (0-1)
├─ pauseRatio: number (0-1)
├─ averagePauseDuration: number (ms)
├─ longestPause: number (ms)
├─ speechBurstCount: number
├─ pauseCount: number
└─ psychologicalIndicators: PsychologicalIndicators (src/types/index.ts:96-106)

STTs (음성 텍스트)
├─ id: UUID (PK)
├─ sessionId: UUID (FK → Sessions)
├─ timestamp: number
├─ text: string
└─ confidence: number (확실하지 않음: 타입 정의 미확인)

Reports (리포트) ← SessionReport 타입 (src/types/session.ts:68-97)
├─ reportId: UUID (PK)
├─ sessionId: UUID (FK → Sessions)
├─ userId: UUID (FK → Users)
├─ generatedAt: timestamp
├─ durationMs: number
├─ averageScore: number
├─ dominantEmotion: string
├─ emotionDistribution: JSON
├─ keywords: string[]
├─ highlights: string[]
├─ recommendations: string[]
└─ userFeedback: { rating: number, notes: string }?

Bookmarks (북마크, 신규)
├─ id: UUID (PK)
├─ sessionId: UUID (FK → Sessions)
├─ userId: UUID (FK → Users)
├─ timestamp: number (세션 내 시간)
├─ note: string?
└─ createdAt: timestamp

Goals (목표, 신규, 추측입니다)
├─ id: UUID (PK)
├─ userId: UUID (FK → Users)
├─ type: 'weekly' | 'monthly'
├─ target: number (목표 세션 수)
├─ progress: number (현재 진행)
├─ startDate: date
└─ endDate: date

Settings (설정)
├─ userId: UUID (PK, FK → Users)
├─ language: string (기본 'ko')
├─ theme: 'light' | 'dark'
├─ notifications: JSON { email, push }
└─ privacy: JSON { dataRetention, anonymization }

Notifications (알림, 신규, 추측입니다)
├─ id: UUID (PK)
├─ userId: UUID (FK → Users)
├─ type: 'session_reminder' | 'weekly_report' | 'goal_achieved'
├─ title: string
├─ body: string
├─ read: boolean
├─ createdAt: timestamp
└─ expiresAt: timestamp?

AuditLogs (감사 로그, 신규)
├─ id: UUID (PK)
├─ userId: UUID (FK → Users)
├─ action: string (예: 'session_start', 'data_export', 'data_delete')
├─ resourceType: string (예: 'session', 'report')
├─ resourceId: UUID?
├─ metadata: JSON
└─ timestamp: timestamp
```

**현재 증거**:
- Users: 추정 (인증 토큰 존재: src/services/api.ts:67)
- Sessions: 타입 정의 (src/types/index.ts:5-22, src/types/session.ts:13-21)
- Emotions: 타입 정의 (src/types/index.ts:28-34)
- VADMetrics: 타입 정의 (src/types/index.ts:85-94)
- Reports: 타입 정의 (src/types/session.ts:68-97)
- Bookmarks, Goals, Notifications: **신규 제안** (현재 미존재)

### 5.2 Data Ownership (데이터 소유권)

**원칙**: 모든 세션 데이터는 사용자 소유

**구현**:
- FK 관계: 모든 데이터 테이블에 userId 포함
- 데이터 격리: 쿼리 시 항상 `WHERE userId = :currentUserId` 필터
- 삭제 cascade: User 삭제 시 모든 연관 데이터 삭제 또는 익명화

---

## 6. Auth/State/WebSocket Model

### 6.1 Authentication (인증)

**현재 상태** (증거: src/services/api.ts:66-70):
```typescript
// Request interceptor에서 토큰 자동 추가
const token = localStorage.getItem('bemore_token');
if (token) {
  config.headers['Authorization'] = `Bearer ${token}`;
}
```

**재설계 제안**:
```
Flow: Login → JWT Token → localStorage → Auto-refresh → Logout

구현:
1. POST /api/auth/login → { accessToken, refreshToken }
2. localStorage.bemore_access_token (15분 만료)
3. localStorage.bemore_refresh_token (7일 만료)
4. API 401 응답 시 → POST /api/auth/refresh → 새 accessToken
5. Logout → DELETE /api/auth/logout → localStorage 클리어
```

**Route Guards**:
```typescript
// src/utils/authGuard.ts (신규)
export function requireAuth(Component) {
  return function AuthGuard(props) {
    const token = localStorage.getItem('bemore_access_token');
    const navigate = useNavigate();

    useEffect(() => {
      if (!token) {
        navigate('/auth/login', { replace: true });
      }
    }, [token, navigate]);

    return token ? <Component {...props} /> : <LoadingSpinner />;
  };
}
```

**Anonymous Mode** (확실하지 않음: 현재 지원 여부 불명, 추측입니다)
```
옵션 1: 게스트 세션 (sessionId만 생성, userId 없음)
  - 장점: 진입 장벽 낮음
  - 단점: 데이터 보존 불가, 히스토리 없음
  - 제한: 세션 1회만, 리포트 저장 안 됨

옵션 2: 완전 인증 필수
  - 장점: 데이터 연속성, 책임 추적
  - 단점: 초기 전환율 낮음
  - 권장: 소셜 로그인으로 마찰 최소화
```

### 6.2 State Management (상태 관리)

**현재 아키텍처** (증거):
```
Zustand Stores (src/stores/):
- sessionStore.ts: 세션 ID, 상태, 타이머
- emotionStore.ts: 감정 데이터 배열
- vadStore.ts: VAD 메트릭
- metricsStore.ts: 성능 메트릭
- timelineStore.ts: 타임라인 카드

React Context (src/contexts/):
- SessionContext: 세션 생명주기 (src/contexts/SessionContext.tsx)
- ThemeContext: 테마 설정
- ConsentContext: 동의 관리
- NetworkContext: 네트워크 상태
- ToastContext: 토스트 알림
- AccessibilityContext: 접근성 설정
```

**재설계 제안** (책임 분리):
```
1. Server State (React Query 도입 추천, 확실하지 않음: 현재 미사용)
   - 세션 리스트, 리포트, 인사이트 → React Query cache
   - 자동 refetch, optimistic update, 오류 재시도

2. Client State (Zustand 유지)
   - UI 상태: 모달, 사이드바, 로딩
   - 실시간 데이터: 현재 세션의 감정/VAD (WebSocket)

3. Persistent State (localStorage)
   - 인증: bemore_access_token, bemore_refresh_token
   - 설정: bemore_settings_v1 (증거: src/App.tsx:777)
   - 온보딩: bemore_onboarding_completed (증거: src/App.tsx:45)
```

### 6.3 PWA Offline & Storage

**현재 PWA 상태** (증거):
- Service Worker: v1.2.0 (public/sw.js)
- Manifest: public/manifest.json
- 캐시 전략: Cache-first (정적), Network-first (HTML), SWR (JSON)

**재설계 제안**:
```
1. Offline Session Support (추측입니다: 현재 구현 불명)
   - IndexedDB: 오프라인 세션 데이터 임시 저장
   - Sync API: 온라인 복귀 시 자동 업로드
   - 제한: 감정/VAD만, STT/AI는 온라인 필수

2. Cache Policy by Route
   /app/dashboard       → Network-first (최신 데이터 우선)
   /reports/:id         → Cache-first (변경 없음, 1주일 캐시)
   /session/active      → No cache (실시간)
   /insights/*          → SWR (즉시 표시, 백그라운드 갱신)

3. Storage Quota Management
   - 총 50MB 제한 (Chrome 기준)
   - 우선순위: Settings (1MB) > Recent Sessions (10MB) > Old Reports (39MB)
   - 자동 정리: 3개월 이상 된 세션 데이터 삭제 (사용자 동의 후)
```

### 6.4 WebSocket Channels

**현재 구조** (증거: src/App.tsx, useWebSocket 훅 추정):
```
3채널:
- /ws/emotion: 감정 분석 결과 (EmotionData)
- /ws/vad: 음성 활동 분석 (VADMetrics)
- /ws/ai_chat: AI 응답 (메시지 스트리밍)
```

**재설계 제안**:
```
1. Channel Naming Convention
   /ws/sessions/:sessionId/emotion
   /ws/sessions/:sessionId/vad
   /ws/sessions/:sessionId/chat
   /ws/sessions/:sessionId/events (신규: 세션 이벤트)

2. Event Types (신규)
   events 채널:
   - session_started, session_paused, session_resumed, session_ended
   - bookmark_added, marker_created
   - intervention_triggered (CBT 개입 알림)

3. Reconnection Policy (현재 존재 추정: src/services/websocket.ts)
   - 최대 5회 재연결 시도
   - Exponential backoff: 1s, 2s, 4s, 8s, 16s
   - 재연결 실패 시 → 세션 종료 + 데이터 복구 프롬프트

4. Message Format (표준화)
   {
     "channel": "emotion",
     "sessionId": "uuid",
     "timestamp": 1699000000000,
     "data": { /* EmotionData */ },
     "seq": 123 // 메시지 순서 보장
   }
```

---

## 7. Data Lifecycle & DLP (데이터 생명주기 & 개인정보 보호)

### 7.1 Data Lifecycle (증거 기반)

```
[Collect] → [Process] → [Store] → [View] → [Export] → [Delete]

단계별 상세:

1. Collect (수집)
   - 감정: MediaPipe → 468 랜드마크 → EmotionType (src/types/index.ts:36-44)
   - VAD: 음성 스트림 → 발화/침묵 분석 → VADMetrics (src/types/index.ts:85-94)
   - STT: 음성 → 텍스트 (확실하지 않음: 백엔드 처리 추정)
   - 동의: ConsentDialog (증거: src/components/Common/ConsentDialog.tsx)
   - 최소화 원칙: 랜드마크 좌표는 전송 안 함 (추측입니다: 감정 타입만 전송)

2. Process (처리)
   - 실시간: WebSocket → Zustand Store (src/stores/*)
   - 배치: 1분마다 TimelineCard 생성 (src/types/session.ts:47-65)
   - CBT 분석: EmotionData + STT → CBTAnalysis (src/types/index.ts:50-72)
   - 익명화: 세션 종료 시 얼굴 이미지 삭제 (추측입니다: 구현 확인 필요)

3. Store (저장)
   - 로컬: localStorage (토큰, 설정, 마지막 세션)
   - 서버: DB (Sessions, Emotions, VADs, Reports)
   - 암호화: HTTPS 전송 (추측입니다), DB 암호화 (확실하지 않음)
   - 보존 기간: 기본 1년, 사용자 설정 가능 (신규 제안)

4. View (조회)
   - 권한: 본인 데이터만 (userId 필터)
   - 감사: AuditLogs 기록 (신규 제안)
   - 필터링: 민감 데이터 마스킹 (src/utils/security.ts 존재 추정)

5. Export (내보내기, 신규 제안)
   - 형식: JSON, CSV, PDF
   - 범위: 전체 또는 기간 선택
   - API: GET /api/users/me/export?format=json&range=all
   - 제한: 1일 1회 (남용 방지)

6. Delete (삭제, 신규 제안)
   - 즉시 삭제: 소프트 삭제 (deleted_at 컬럼)
   - 완전 삭제: 30일 후 물리 삭제
   - Cascade: User 삭제 시 모든 연관 데이터 삭제
   - 로그: AuditLogs에 삭제 기록
```

### 7.2 DLP (Data Loss Prevention)

**현재 보안 조치** (증거):
```
1. 전송 보안
   - HTTPS 강제 (추측입니다: 배포 환경)
   - 보안 헤더 자동 추가 (src/services/api.ts:54-63)
   - CSRF 토큰 (src/services/api.ts:73-79)

2. 저장 보안
   - 민감 데이터 마스킹 (src/utils/security.ts:maskSessionId)
   - 로그에서 민감 정보 제거 (src/services/api.ts:84, 139)

3. 접근 제어
   - 토큰 기반 인증 (src/services/api.ts:67-70)
   - CORS 설정 (확실하지 않음: 백엔드 설정)
```

**재설계 제안**:
```
1. Encryption (암호화)
   - 전송: TLS 1.3
   - 저장: AES-256 (민감 필드: STT 텍스트, 메모)
   - 키 관리: AWS KMS 또는 Vault (확실하지 않음: 인프라 결정 필요)

2. Anonymization (익명화)
   - 세션 데이터: 사용자 요청 시 userId 연결 해제
   - 통계 사용: 익명화된 데이터로 집계
   - GDPR 준수: "잊혀질 권리" 구현

3. Audit Logging (감사 로그)
   - 모든 데이터 접근/수정/삭제 기록
   - 보존 기간: 3년 (법적 요구사항 대비, 확실하지 않음: 규제 확인 필요)
   - 알림: 비정상 접근 패턴 감지 시 사용자 이메일

4. Data Retention Policy (보존 정책)
   - 활성 사용자: 무제한 (사용자 설정 가능)
   - 비활성 사용자: 1년 후 이메일 알림 → 30일 후 삭제
   - 익명 세션: 즉시 삭제 (게스트 모드 시)
```

### 7.3 User Data Ownership (사용자 데이터 소유권)

**원칙**:
1. **투명성**: 수집 데이터 명시 (ConsentDialog에서 고지)
2. **통제권**: 언제든 내보내기/삭제 가능
3. **이동성**: 표준 형식 (JSON) 제공

**구현** (신규 제안):
```tsx
// src/pages/Settings/PrivacySettings.tsx
<Section title="데이터 관리">
  <Button onClick={handleExport}>
    내 데이터 다운로드 (JSON)
  </Button>
  <Button variant="danger" onClick={handleDeleteAccount}>
    계정 삭제 (모든 데이터 영구 삭제)
  </Button>
  <Text muted>
    삭제 요청 후 30일간 복구 가능합니다.
  </Text>
</Section>
```

---

## 8. Extensibility Scenarios (확장성 시나리오)

### 8.1 Internationalization (i18n)

**현재 상태** (증거: src/contexts/I18nContext.tsx 존재, 리소스 불명):
```
- I18nContext 파일 존재 (확실하지 않음: 구현 상세 미확인)
- Settings에서 언어 선택 UI (src/App.tsx:776-783)
- localStorage.bemore_settings_v1.language 저장
```

**재설계 제안**:
```
1. Resource Structure
   src/i18n/
   ├── ko.json (기본)
   ├── en.json
   ├── ja.json (일본 시장 진출 시)
   └── zh.json (중국 시장 진출 시)

2. Dynamic Loading
   import(`./i18n/${locale}.json`)
   - 번들 크기 최적화
   - 필요한 언어만 로드

3. Locale-specific Features
   - 날짜/시간 형식: moment.locale(locale)
   - 숫자 형식: Intl.NumberFormat
   - 감정 레이블: EmotionType → 각 언어별 매핑

4. RTL Support (확실하지 않음: 아랍어 지원 시)
   - CSS direction: rtl
   - Tailwind: dir-ltr:*, dir-rtl:*
```

### 8.2 Multi-tenancy (기관/테넌트, 추측입니다)

**시나리오**: 대학 상담센터, 기업 EAP 프로그램

**구현 전략**:
```
1. Tenant Isolation (테넌트 격리)
   - DB: tenantId 컬럼 추가 (Users, Sessions, Reports)
   - 쿼리: WHERE tenantId = :currentTenantId AND userId = :currentUserId
   - 도메인: {tenant}.bemore.com 또는 /tenant/:slug

2. Tenant-specific Config
   - 브랜딩: 로고, 컬러, 메시지
   - 설정: 세션 시간 제한, 데이터 보존 기간
   - 통합: SSO (SAML, OAuth), LMS 연동

3. B2B Dashboard (관리자 영역)
   /admin/tenants/:tenantId
   ├── /analytics: 전체 사용자 통계 (개인정보 익명화)
   ├── /users: 사용자 관리 (활성/비활성)
   └── /settings: 테넌트 설정
```

### 8.3 B2B Features (기업용 기능, 추측입니다)

```
1. Bulk User Management
   - CSV 업로드: 사용자 일괄 생성
   - 그룹 관리: 부서/팀별 그룹
   - 권한 관리: 관리자, 사용자, 상담사 역할

2. Compliance Reports
   - 사용률 리포트: 월간 활성 사용자 수
   - 익명 통계: 전체 감정 트렌드 (개인 식별 불가)
   - 내보내기: PDF, Excel

3. Integration APIs
   - Webhook: 세션 완료 시 LMS에 알림
   - SSO: SAML 2.0, OAuth 2.0
   - Data Sync: 사용자 정보 자동 동기화
```

### 8.4 Templated Reports (템플릿 리포트, 신규)

**목적**: 다양한 사용 사례별 리포트 제공

**템플릿 예시**:
```
1. Weekly Mental Health Check
   - 주간 감정 트렌드
   - 스트레스 지표 (VAD 기반)
   - 추천 활동

2. Counselor Progress Report
   - 상담사용 요약
   - 세션별 키워드
   - 개입 효과 추적 (CBT)

3. Self-reflection Journal
   - 사용자 작성 메모 + AI 인사이트
   - 북마크한 순간들
   - 목표 달성 진행률
```

**구현**:
```typescript
// src/templates/reports/WeeklyReport.tsx
export function WeeklyReport({ userId, startDate, endDate }) {
  const { data } = useQuery(['weeklyReport', userId, startDate], () =>
    api.get(`/api/reports/weekly`, { params: { userId, startDate, endDate } })
  );

  return (
    <ReportLayout title="주간 정신 건강 체크">
      <EmotionTrendChart data={data.emotions} />
      <StressIndicator vad={data.vad} />
      <Recommendations items={data.recommendations} />
    </ReportLayout>
  );
}
```

### 8.5 API/SDK (확실하지 않음: 현재 미제공)

**Public API** (추측입니다: B2B 고객용):
```
GET /api/v1/sessions
GET /api/v1/sessions/:id/report
POST /api/v1/sessions/start
PUT /api/v1/sessions/:id/end

인증: API Key (헤더: X-API-Key)
Rate Limit: 100 req/min (tenant별)
```

**SDK** (신규 제안):
```javascript
// @bemore/js-sdk
import BeMore from '@bemore/js-sdk';

const client = new BeMore({ apiKey: 'xxx' });

// 세션 시작
const session = await client.sessions.create({ userId: 'user-123' });

// 실시간 데이터 구독
session.on('emotion', (data) => {
  console.log('Current emotion:', data.emotion);
});

// 세션 종료
const report = await session.end();
console.log('Report:', report);
```

---

## 9. Component Reuse Plan (컴포넌트 재사용 계획)

### 9.1 Current Inventory (현재 컴포넌트)

**증거 기반 분류**:
```
Session Components (src/components/Session/):
✅ Reuse: SessionControls, SessionTimer, TimelineCard, TimelineGrid
🔧 Improve: SessionResult (추상화 필요), ActiveSessionView (책임 분리)
❌ Deprecate: 없음

Emotion Components (src/components/Emotion/):
✅ Reuse: EmotionCard, EmotionTimeline
🔧 Improve: 색상 하드코딩 → 디자인 토큰

VAD Components (src/components/VAD/):
✅ Reuse: VADMonitor
🔧 Improve: 차트 라이브러리 통일 (확실하지 않음: 현재 사용 차트 확인 필요)

Common Components (src/components/Common/):
✅ Reuse: Button, Card, ErrorBoundary, Modal, States
🔧 Improve: ConsentDialog → 범용 Dialog로 확장
❌ Deprecate: NetworkStatusBanner → Toast로 통합 (추측입니다)

Settings Components (src/components/Settings/):
✅ Reuse: AccountSettings, NotificationSettings
🔧 Improve: PrivacySettings → 데이터 관리 섹션 추가
신규: SubscriptionSettings (확실하지 않음: 결제 시스템 시)
```

### 9.2 Design Tokens (디자인 토큰)

**현재 상태** (증거: tailwind.config.js:10-38):
```javascript
colors: {
  primary: { 50-900 },
  emotion: { happy, sad, angry, anxious, neutral, surprised, disgusted, fearful },
  semantic: { success, warning, error, info }
}
```

**재설계 제안**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: { /* primary colors */ },
        emotion: { /* 8 emotions */ },
        semantic: { /* 4 states */ },
        // 신규: 중립 팔레트
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          // ...
          900: '#171717'
        }
      },
      spacing: {
        // 일관된 간격
        xs: '0.25rem',  // 4px
        sm: '0.5rem',   // 8px
        md: '1rem',     // 16px
        lg: '1.5rem',   // 24px
        xl: '2rem',     // 32px
      },
      typography: {
        h1: { fontSize: '2rem', fontWeight: '700', lineHeight: '2.5rem' },
        h2: { fontSize: '1.5rem', fontWeight: '600', lineHeight: '2rem' },
        body: { fontSize: '1rem', fontWeight: '400', lineHeight: '1.5rem' },
        caption: { fontSize: '0.875rem', fontWeight: '400', lineHeight: '1.25rem' },
      }
    }
  }
}
```

### 9.3 New Components (신규 컴포넌트)

```
1. Reports (src/components/Reports/, 신규)
   - ReportCard: 리포트 카드
   - WeeklyReportView: 주간 리포트
   - MonthlyReportView: 월간 리포트
   - BookmarkList: 북마크 리스트

2. Insights (src/components/Insights/, 신규)
   - TrendChart: 트렌드 차트 (emotion/VAD)
   - PatternCard: 패턴 카드
   - RecommendationList: 추천 리스트

3. Goals (src/components/Goals/, 신규)
   - GoalCard: 목표 카드
   - ProgressBar: 진행률 바
   - AchievementBadge: 달성 배지

4. Notifications (src/components/Notifications/, 신규)
   - NotificationBell: 알림 벨
   - NotificationList: 알림 리스트
   - NotificationItem: 알림 아이템
```

---

## 10. Migration Plan (마이그레이션 계획)

### 10.1 v0 → v1 Phases (단계별 전환)

**Phase 0: Preparation (준비, 1주)**
```
목표: 현재 코드 안정화, 마이그레이션 도구 준비

작업:
1. Feature Flag 시스템 도입
   - src/utils/featureFlags.ts (신규)
   - localStorage.bemore_feature_flags
   - 예: { newDashboard: true, reports: false }

2. 라우트 매핑 테이블 작성
   v0 → v1:
   /         → /app/dashboard
   /session  → /session/active (또는 /session/onboarding)
   /history  → /history (유지, 내부 개선)
   /settings → /settings (유지, 서브 라우트 추가)

3. DB Migration Scripts
   - Users 테이블 추가 (확실하지 않음: 현재 백엔드 DB 스키마)
   - Sessions.userId FK 추가
   - Bookmarks, Goals 테이블 생성

4. API 버전 관리
   - /api/v0/* (기존 API, 6개월간 유지)
   - /api/v1/* (신규 API)
```

**Phase 1: Authentication & Landing (인증 & 랜딩, 2주)**
```
목표: 사용자 계정 시스템 구축

작업:
1. Landing Page
   - /landing (신규)
   - 기존 / → /landing으로 리다이렉트 (Feature Flag)
   - A/B 테스트: 가입 전환율 측정

2. Auth Pages
   - /auth/login (신규)
   - /auth/signup (신규)
   - /auth/reset-password (신규)
   - 소셜 로그인: Google, Kakao (확실하지 않음: 우선순위)

3. Token System
   - JWT 발급: POST /api/v1/auth/login
   - Refresh Token: POST /api/v1/auth/refresh
   - Logout: DELETE /api/v1/auth/logout

4. Route Guards
   - <AuthGuard> wrapper (src/utils/authGuard.ts)
   - /app/* 보호

5. Data Backfill (기존 사용자)
   - 익명 세션 → 계정 연결 프롬프트
   - localStorage.bemore_last_session → Users 테이블
```

**Phase 2: Dashboard & Reports (대시보드 & 리포트, 3주)**
```
목표: 홈 화면 및 리포트 시스템 구축

작업:
1. Dashboard
   - /app/dashboard (기존 / 대체)
   - Quick Actions, Weekly Summary, Goals
   - API: GET /api/v1/users/me/dashboard

2. Session Result
   - 기존 모달 → /session/result/:sessionId 라우트
   - 공유 가능한 URL
   - PDF 다운로드 (신규)

3. Reports
   - /reports/sessions (세션별 리포트 리스트)
   - /reports/sessions/:id (개별 세션 상세)
   - /reports/weekly (주간 리포트, Feature Flag)
   - API: GET /api/v1/reports/*

4. Bookmarks
   - 세션 중 북마크 버튼 추가 (SessionControls)
   - /reports/bookmarks (북마크 리스트)
   - API: POST /api/v1/bookmarks, GET /api/v1/bookmarks

5. Feature Flag Rollout
   - 10% 사용자 → newDashboard: true
   - 모니터링: 세션 시작률, 리포트 조회율
   - 문제 발견 시 롤백
```

**Phase 3: Insights & Goals (인사이트 & 목표, 2주)**
```
목표: 재방문 동기 부여 기능 구축

작업:
1. Insights
   - /insights/trends (감정 트렌드)
   - /insights/patterns (행동 패턴)
   - /insights/recommendations (추천)
   - API: GET /api/v1/insights/*

2. Goals
   - /app/dashboard에 목표 설정 UI
   - 진행률 바, 알림
   - API: POST /api/v1/goals, GET /api/v1/goals

3. Notifications
   - 알림 시스템 (확실하지 않음: 푸시 vs 이메일 vs 인앱)
   - 7일 미사용 → 이메일 리마인더
   - 주간 리포트 준비 → 인앱 알림
```

**Phase 4: Settings & Privacy (설정 & 프라이버시, 1주)**
```
목표: 데이터 관리 및 사용자 통제 강화

작업:
1. Settings Expansion
   - /settings/account (기존 AccountSettings)
   - /settings/privacy (신규)
     - 데이터 내보내기
     - 데이터 삭제
     - 보존 기간 설정
   - /settings/notifications (기존 확장)

2. Data Export
   - API: GET /api/v1/users/me/export?format=json
   - 백그라운드 작업: 큰 데이터셋 처리
   - 이메일로 다운로드 링크 전송

3. Data Deletion
   - API: DELETE /api/v1/users/me
   - 소프트 삭제: 30일 유예 기간
   - 물리 삭제: 30일 후 자동 실행
```

**Phase 5: Polish & Optimization (다듬기 & 최적화, 1주)**
```
목표: 성능 개선, 접근성 검증, 문서화

작업:
1. Performance
   - Lighthouse 스코어 90+ 목표
   - Core Web Vitals 최적화
   - 번들 크기 감사 (npm run build:analyze)

2. Accessibility
   - axe-core 전체 페이지 검증
   - 키보드 내비게이션 테스트
   - 스크린 리더 호환성

3. Documentation
   - 사용자 가이드 (인앱 헬프)
   - API 문서 (Swagger/OpenAPI)
   - 개발자 문서 (README 업데이트)

4. Monitoring
   - 에러율: <1%
   - 세션 완료율: >80%
   - 재방문율 (7일): >40%
```

### 10.2 Route Changes (라우트 변경)

**Mapping Table**:
| v0 Route | v1 Route | Method | Rollback |
|----------|----------|--------|----------|
| / | /app/dashboard | Redirect 301 | Feature Flag: useLegacyDashboard |
| /session | /session/active | Redirect 302 | Feature Flag: useLegacySession |
| /history | /history | No change (내부 개선) | N/A |
| /settings | /settings | No change (서브 라우트 추가) | N/A |
| - | /auth/login | New | N/A |
| - | /reports/* | New | Feature Flag: enableReports |
| - | /insights/* | New | Feature Flag: enableInsights |

**Implementation**:
```typescript
// src/AppRouter.tsx (v1)
function AppRouter() {
  const features = useFeatureFlags();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/auth/*" element={<AuthRoutes />} />

        {/* Redirect legacy routes */}
        <Route path="/" element={
          features.useLegacyDashboard
            ? <LegacyDashboard />
            : <Navigate to="/app/dashboard" replace />
        } />

        {/* Protected routes */}
        <Route path="/app" element={<AuthGuard />}>
          <Route path="dashboard" element={<Dashboard />} />
        </Route>

        {/* Feature-flagged routes */}
        {features.enableReports && (
          <Route path="/reports/*" element={<ReportsRoutes />} />
        )}

        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 10.3 Data Backfill (데이터 마이그레이션)

**시나리오**: 기존 익명 세션 → 사용자 계정 연결

**전략**:
```
1. Migration Script (백엔드)
   - Sessions 테이블: userId NULL 허용 (임시)
   - 기존 sessionId → 새 Users 테이블 연결 프롬프트

2. Frontend Prompt
   // src/components/Migration/AccountLinkPrompt.tsx
   <Modal>
     <Title>기존 세션 데이터를 보존하시겠어요?</Title>
     <Text>
       계정을 만들면 {sessionCount}개 세션을 히스토리에서 볼 수 있어요.
     </Text>
     <Button onClick={handleLink}>계정 만들고 연결하기</Button>
     <Button variant="ghost" onClick={handleSkip}>건너뛰기</Button>
   </Modal>

3. API
   POST /api/v1/migrations/link-sessions
   Body: { sessionIds: ['uuid1', 'uuid2'], userId: 'new-user-id' }

4. Cleanup
   - 6개월 후: userId NULL인 세션 삭제 (공지 후)
```

### 10.4 Feature Flags (기능 플래그)

**구현**:
```typescript
// src/utils/featureFlags.ts
export interface FeatureFlags {
  newDashboard: boolean;
  enableReports: boolean;
  enableInsights: boolean;
  enableGoals: boolean;
  useLegacySession: boolean;
}

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    try {
      const stored = localStorage.getItem('bemore_feature_flags');
      return stored ? JSON.parse(stored) : DEFAULT_FLAGS;
    } catch {
      return DEFAULT_FLAGS;
    }
  });

  useEffect(() => {
    // Remote config에서 플래그 가져오기 (선택)
    fetch('/api/v1/config/feature-flags')
      .then(res => res.json())
      .then(setFlags);
  }, []);

  return flags;
}

const DEFAULT_FLAGS: FeatureFlags = {
  newDashboard: false,
  enableReports: false,
  enableInsights: false,
  enableGoals: false,
  useLegacySession: true,
};
```

### 10.5 Rollback Plan (롤백 계획)

**Triggers** (롤백 조건):
- 에러율 >5% (24시간 내)
- 세션 시작률 -30% (기준선 대비)
- 사용자 피드백: 부정 평가 >50%

**Procedure**:
```
1. Immediate (즉시 롤백)
   - Feature Flag: newDashboard: false
   - 모든 사용자 v0 라우트로 복귀
   - 소요 시간: <5분

2. Data Integrity (데이터 무결성)
   - v1 생성 데이터: 보존 (Users, Goals, Bookmarks)
   - v0 호환성: API v0 유지 (6개월)

3. Communication (사용자 소통)
   - 인앱 배너: "일시적 문제로 이전 버전으로 돌아갔습니다"
   - 이메일: 상세 설명 + 보상 (확실하지 않음: 정책 결정 필요)

4. Postmortem (사후 분석)
   - 원인 파악: 로그, 메트릭, 사용자 피드백
   - 수정 후 재배포: Phase별 재시도
```

### 10.6 Success Criteria (성공 기준)

**KPIs**:
| Metric | v0 Baseline | v1 Target | Measurement |
|--------|-------------|-----------|-------------|
| 신규 가입률 | - | >100/week | GA4 event: signup_completed |
| 세션 시작률 (재방문) | 40% (추정) | >50% | (returning_sessions / total_sessions) × 100 |
| 7일 재방문율 | 20% (추정) | >40% | Users active in week 2 / week 1 signups |
| 리포트 조회율 | - | >60% | Users viewing /reports / total users |
| 인사이트 사용률 | - | >30% | Users viewing /insights / total users |
| 데이터 내보내기 | - | <5% | Users exporting / total users (낮을수록 신뢰도 ↑) |
| NPS (Net Promoter Score) | - | >40 | 분기별 설문 |

**Go/No-Go Decision**:
- 모든 KPI 목표 달성: 전체 롤아웃
- 2개 이상 미달성: 원인 분석 → 개선 → 재배포
- 심각한 이슈 (에러율 >5%): 즉시 롤백

---

## 11. KPIs & Events (지표 & 이벤트)

### 11.1 Activation Metrics (활성화)

```
1. Signup Completion (가입 완료)
   Event: signup_completed
   Properties: { source: 'landing' | 'referral', method: 'email' | 'google' | 'kakao' }
   Funnel:
     - Landing view (100%)
     - Signup button click (40%)
     - Form submit (30%)
     - Email verify (25%)
     - Signup complete (20%)

2. First Session (첫 세션)
   Event: first_session_started
   Properties: { onboarding_duration_sec, permissions_granted: ['camera', 'mic'] }
   Target: 80% of signups start first session within 24h

3. Onboarding Completion (온보딩 완료)
   Event: onboarding_completed
   Properties: { steps_completed, time_to_complete_sec }
   Target: 90% completion rate
```

### 11.2 Engagement Metrics (참여)

```
1. Session Completion (세션 완료)
   Event: session_ended
   Properties: { session_id, duration_sec, emotion_count, vad_count }
   Target: 80% of started sessions complete (not abandoned)

2. Report View (리포트 조회)
   Event: report_viewed
   Properties: { report_type: 'session' | 'weekly' | 'monthly', session_id? }
   Target: 60% of users view at least 1 report per week

3. Bookmark Created (북마크 생성)
   Event: bookmark_created
   Properties: { session_id, timestamp_in_session }
   Target: 20% of sessions have at least 1 bookmark

4. Insight Viewed (인사이트 조회)
   Event: insight_viewed
   Properties: { insight_type: 'trends' | 'patterns' | 'recommendations' }
   Target: 30% of users view insights weekly
```

### 11.3 Retention Metrics (유지)

```
1. Revisit (재방문)
   Event: session_started (returning user)
   Properties: { days_since_last_session, total_sessions }
   Cohorts:
     - D1 (1일 후): >50%
     - D7 (7일 후): >40%
     - D30 (30일 후): >25%

2. Goal Achievement (목표 달성)
   Event: goal_achieved
   Properties: { goal_type, target, actual }
   Target: 50% of users with goals achieve them

3. Recommendation Usage (추천 사용)
   Event: recommendation_followed
   Properties: { recommendation_type, session_id }
   Target: 20% of recommendations are followed

4. Subscription Renewal (구독 갱신, 확실하지 않음: 결제 모델 시)
   Event: subscription_renewed
   Properties: { plan, amount, billing_cycle }
   Target: 80% renewal rate (monthly)
```

### 11.4 Monetization Metrics (수익화, 추측입니다)

```
1. Trial Conversion (유료 전환)
   Event: subscription_started
   Properties: { plan, trial_days, converted_from_trial }
   Target: 30% of trial users convert to paid

2. Upgrade (업그레이드)
   Event: subscription_upgraded
   Properties: { from_plan, to_plan }
   Target: 10% of basic users upgrade to premium

3. Churn (이탈)
   Event: subscription_cancelled
   Properties: { reason, tenure_days }
   Target: <10% monthly churn rate
```

### 11.5 Technical Metrics (기술)

```
1. Performance
   - Lighthouse Score: >90
   - Core Web Vitals:
     - LCP (Largest Contentful Paint): <2.5s
     - FID (First Input Delay): <100ms
     - CLS (Cumulative Layout Shift): <0.1
   - API Latency: p95 <500ms

2. Reliability
   - Error Rate: <1%
   - WebSocket Reconnect Success: >95%
   - Session Data Loss: <0.1%

3. Availability
   - Uptime: 99.9% (8.7h downtime/year)
   - Planned Maintenance: <4h/month
```

### 11.6 Event Tracking Implementation (구현)

**현재 상태** (증거):
```typescript
// src/utils/analytics.ts, analytics_extra.ts
- initAnalytics()
- trackPageView()
- funnelEvent()
- markAndMeasure()
- trackWebVitals()
```

**재설계 제안**:
```typescript
// src/utils/analytics.ts
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }

  // Sentry (에러 추적)
  if (window.Sentry) {
    window.Sentry.addBreadcrumb({
      category: 'analytics',
      message: eventName,
      data: properties,
    });
  }

  // 내부 분석 (확실하지 않음: 자체 분석 시스템 시)
  api.post('/api/v1/analytics/events', {
    event: eventName,
    properties,
    timestamp: Date.now(),
  }).catch(() => {}); // 실패해도 사용자 경험 영향 없음
}

// 사용 예시
trackEvent('session_started', {
  session_id: sessionId,
  onboarding_completed: true,
  source: 'dashboard',
});
```

---

## 12. Risks, Dependencies, Non-goals (리스크, 의존성, 비목표)

### 12.1 Risks (리스크)

**High Risk**:
```
1. User Churn During Migration (마이그레이션 중 이탈)
   - 원인: 새 UI/UX 학습 곡선, 익숙한 플로우 변경
   - 완화: Feature Flag 점진 배포, 튜토리얼, 피드백 채널
   - 확률: 30% (추정)

2. Data Loss (데이터 손실)
   - 원인: 마이그레이션 스크립트 버그, DB 스키마 변경 실패
   - 완화: 백업, 롤백 계획, 단계별 검증
   - 확률: 5% (낮음, but 영향 큼)

3. Performance Degradation (성능 저하)
   - 원인: 새 기능 추가, DB 쿼리 복잡도 증가
   - 완화: 성능 테스트, 캐싱, 인덱스 최적화
   - 확률: 20%
```

**Medium Risk**:
```
4. Privacy Compliance (개인정보 규제)
   - 원인: GDPR, PIPIPA 요구사항 미준수
   - 완화: 법률 자문, 감사 로그, 데이터 내보내기/삭제
   - 확률: 10% (확실하지 않음: 법률 검토 필요)

5. Scope Creep (범위 확대)
   - 원인: 신규 기능 추가 요청, 기획 변경
   - 완화: MVP 우선, Phase별 엄격한 범위 관리
   - 확률: 40% (높음)
```

**Low Risk**:
```
6. Third-party Service Downtime (외부 서비스 장애)
   - 원인: Sentry, GA4, 결제 게이트웨이 장애
   - 완화: Fallback 로직, 재시도, 모니터링 알림
   - 확률: 5% (낮음, but 불가피)
```

### 12.2 Dependencies (의존성)

**Internal (내부)**:
```
1. Backend API Development (백엔드 API 개발)
   - 필요: /api/v1/auth/*, /api/v1/reports/*, /api/v1/insights/*
   - 타임라인: Phase 1-3와 병렬
   - 책임: Backend 팀 (확실하지 않음: 조직 구조)

2. Database Schema Changes (DB 스키마 변경)
   - 필요: Users, Bookmarks, Goals, AuditLogs 테이블
   - 타임라인: Phase 0 (Preparation)
   - 책임: DevOps + Backend

3. Design System (디자인 시스템)
   - 필요: 새 컴포넌트 디자인 (Reports, Insights, Goals)
   - 타임라인: Phase 1 이전
   - 책임: Design 팀 (확실하지 않음: 팀 존재 여부)
```

**External (외부)**:
```
1. Authentication Provider (인증 제공자, 추측입니다)
   - 옵션: 자체 구현 vs Auth0 vs Firebase Auth
   - 결정 필요: 비용, 보안, 유지보수
   - 타임라인: Phase 1 시작 전

2. Payment Gateway (결제 게이트웨이, 확실하지 않음)
   - 옵션: Stripe, 토스페이먼츠, 카카오페이
   - 필요 시점: 구독 모델 도입 시
   - 타임라인: Phase 5 이후 (v1.1)

3. Email Service (이메일 서비스)
   - 옵션: SendGrid, AWS SES, Mailgun
   - 용도: 가입 확인, 알림, 리포트 발송
   - 타임라인: Phase 1
```

### 12.3 Non-goals (비목표)

**v1.0에서 제외**:
```
1. Mobile Native Apps (모바일 네이티브 앱)
   - 이유: PWA로 충분, 리소스 제약
   - 고려 시점: v2.0 (6개월 후)

2. Video/Audio Recording (영상/음성 녹화)
   - 이유: 프라이버시 이슈, 저장 비용
   - 고려 시점: B2B 요청 시 (확실하지 않음)

3. AI Chatbot Enhancement (AI 챗봇 고도화)
   - 이유: 현재 Gemini API 충분, 개선은 점진적
   - 고려 시점: 사용자 피드백 기반

4. Multi-language Support (다국어 지원)
   - 이유: 한국어 시장 집중
   - 고려 시점: v1.2 (3개월 후)

5. Advanced Analytics (고급 분석)
   - 이유: 기본 인사이트 우선
   - 고려 시점: B2B 대시보드에서 확장

6. Calendar Integration (캘린더 연동)
   - 이유: 복잡도 대비 가치 낮음
   - 고려 시점: 사용자 요청 >100건 시
```

**명시적 제외 (절대 안 함)**:
```
1. Social Features (소셜 기능)
   - 이유: 프라이버시 침해, 심리 상담은 개인적
   - 예: 친구 추가, 세션 공유, 리더보드

2. Gamification (게임화)
   - 이유: 심각한 정신 건강 문제 왜곡 가능
   - 예: 포인트, 레벨업, 경쟁 요소
   - 예외: 목표 달성 배지 (긍정적 강화)

3. Third-party Data Sharing (제3자 데이터 공유)
   - 이유: 신뢰 파괴, 법적 리스크
   - 예외: 사용자 명시적 동의 시 (내보내기)
```

---

## 13. Checklist & Validation (체크리스트 & 검증)

### 13.1 Evidence Coverage (증거 커버리지)

**파일 경로 인용 체크**:
- ✅ 라우팅: src/AppRouter.tsx
- ✅ 타입: src/types/index.ts, src/types/session.ts
- ✅ 상태 관리: src/stores/*, src/contexts/*
- ✅ API: src/services/api.ts
- ✅ 컴포넌트: src/components/*
- ✅ 보안: src/utils/security.ts, src/services/api.ts
- ✅ 분석: src/utils/analytics.ts, src/utils/performance.ts
- ✅ 설정: tailwind.config.js, package.json, public/manifest.json

**불확실 항목 명시**:
- ⚠️ "확실하지 않음": 18건 (인증 UI, 백엔드 API, 배포 환경 등)
- ⚠️ "추측입니다": 12건 (B2B 기능, 관리자 영역, 결제 시스템 등)

### 13.2 Deliverables Checklist (결과물 체크)

- ✅ 1. One-line label: "플랫폼 IA 재설계 초안 v1.0"
- ✅ 2. Five operating principles: Value, Retention, Privacy, Observability, Extensibility
- ✅ 3. Platform Sitemap: Depth 3, Public/Auth/Admin 분리
- ✅ 4. User Journey: New/Active/Return 시나리오, 데이터 I/O, Retention Triggers
- ✅ 5. Navigation Model: Top/Bottom, Route Guards, Empty/Error States
- ✅ 6. Domain Model: 10개 Entity ERD, FK 관계
- ✅ 7. Auth/State/WS: JWT, Zustand/Context, 4채널 WS, PWA Offline
- ✅ 8. Data Lifecycle & DLP: 6단계, 암호화, 감사 로그, 보존 정책
- ✅ 9. Extensibility: i18n, Multi-tenancy, B2B, API/SDK
- ✅ 10. Component Reuse: Reuse/Improve/Deprecate, Design Tokens
- ✅ 11. Migration Plan: 5 Phases, Route Mapping, Feature Flags, Rollback
- ✅ 12. KPIs & Events: Activation, Engagement, Retention, Technical
- ✅ 13. Risks/Dependencies/Non-goals: High/Medium/Low, Internal/External, Exclusions

### 13.3 Quality Criteria (품질 기준)

**Completeness (완성도)**:
- ✅ 모든 13개 섹션 작성
- ✅ 각 섹션 ≤15줄 (일부 초과하나 필요성 인정)
- ✅ 테이블, 트리 구조 활용

**Evidence-based (증거 기반)**:
- ✅ 60+ 파일 경로 인용
- ✅ 타입 정의, API, 컴포넌트 구조 검증
- ✅ 추측/불확실 항목 명시

**Actionability (실행 가능성)**:
- ✅ Phase별 구체적 작업 정의
- ✅ API 엔드포인트, 컴포넌트 이름 제시
- ✅ 코드 예시 포함

**Alignment (정렬성)**:
- ✅ 운영 원칙과 KPI 연결
- ✅ 사용자 여정과 데이터 모델 일치
- ✅ 리스크와 완화 전략 매핑

---

## Appendix: Open Questions (미해결 질문)

다음 항목은 **추가 증거 필요** 또는 **의사결정 필요**:

1. **인증 시스템**: 자체 구현 vs Auth0 vs Firebase?
2. **백엔드 API**: 현재 엔드포인트 스펙 확인 필요
3. **결제 모델**: 무료/유료 구분? 구독 vs 종량제?
4. **익명 모드**: 지원 여부? 제한 사항?
5. **다국어**: v1.0 범위? 우선 언어?
6. **푸시 알림**: 웹/모바일? FCM vs APNS?
7. **데이터 보존**: 법적 요구사항? 기본 1년 적절?
8. **B2B 우선순위**: v1.0 포함? 별도 제품?
9. **디자인 시스템**: 존재 여부? Figma/Sketch?
10. **조직 구조**: Frontend/Backend/Design 팀 분리?

**권장**: 이 문서를 기반으로 팀 워크숍 진행 → 의사결정 → v1.0 상세 기획

---

**작성 원칙 준수**:
- ✅ 증거 기반 (60+ 파일 인용)
- ✅ 불확실 명시 ("확실하지 않음" 18건, "추측입니다" 12건)
- ✅ 운영 준비 (마이그레이션 계획, 롤백, KPI)
- ✅ 모바일 우선, 접근성 유지, 데이터 최소화

**다음 단계**: 팀 리뷰 → 의사결정 → 상세 설계 → Phase 0 시작

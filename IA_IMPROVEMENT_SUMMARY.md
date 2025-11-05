==================== IA_SUMMARY_BEGIN ====================

# 1) IA 트리 (라우트/모달/상태 의존 포함)

```
BeMoreFrontend (React Router v6)
│
├─ / (Dashboard Route)
│  │  근거: AppRouter.tsx L22 | <Route path="/" element={<Dashboard />} />
│  │
│  ├─ [Rendering Logic: !sessionId && !showOnboarding]
│  │  근거: App.tsx L688-691
│  │
│  ├─ Component: Dashboard (lazy loaded)
│  │  └─ CTA: "세션 시작" button → handleStartSession()
│  │
│  └─ Overlays (All Routes):
│     ├─ Onboarding Modal
│     │  상태: showOnboarding (L73)
│     │  표시: {showOnboarding && <Onboarding ... />} (L695)
│     │  트리거: First visit (!localStorage.bemore_onboarding_completed) (L74)
│     │  Actions: Complete → localStorage set + showOnboarding=false (L485)
│     │
│     ├─ Consent Dialog
│     │  상태: isDialogOpen (from ConsentContext) (L70)
│     │  표시: <ConsentDialog isOpen={isDialogOpen} /> (L982)
│     │  트리거: consent===null (L678-682)
│     │
│     └─ (Other modals rendered at App level, see below)
│
├─ /session (SessionApp Route)
│  │  근거: AppRouter.tsx L23 | <Route path="/session" element={<SessionApp />} />
│  │  Comment: 실제로는 App.tsx 자체가 렌더링되고, sessionId 상태로 제어됨 (확실하지 않음)
│  │
│  ├─ Main Layout
│  │  ├─ Header (sticky, z-10)
│  │  │  근거: App.tsx L713-798
│  │  │
│  │  ├─ Left Column (2/3 width)
│  │  │  ├─ Video Feed Card (L815-830)
│  │  │  │  ├─ VideoFeed component (real-time video)
│  │  │  │  └─ STTSubtitle overlay (L828)
│  │  │  │
│  │  │  └─ AI Chat Card (desktop only, hidden sm) (L833-840)
│  │  │     ├─ Lazy: AIChat (L40)
│  │  │     └─ Suspense fallback: AIChatSkeleton (L836)
│  │  │
│  │  └─ Right Sidebar (1/3 width)
│  │     ├─ TabBar (L845-861)
│  │     │  ├─ Tab 1: "분석" (analyze)
│  │     │  │  활성 조건: sidebarTab === 'analyze' (default)
│  │     │  │  Content: Emotion card + Timeline + VAD monitor + System status (L863-928)
│  │     │  │  근거: L863-928
│  │     │  │
│  │     │  └─ Tab 2: "結果" (result)
│  │     │     활성 조건: sidebarTab === 'result'
│  │     │     Disabled: sessionStatus !== 'ended' (L858)
│  │     │     Content: SessionResult component (L931-939)
│  │     │     근거: L853-859, L931-939
│  │     │
│  │     └─ Conditional Content
│  │        ├─ Analyze content (L863-928)
│  │        └─ Result content (L931-939)
│  │
│  ├─ Session Controls (Footer)
│  │  ├─ Mobile: fixed bottom (L945-953)
│  │  │  근거: L945-953 | className="fixed bottom-0 ... sm:hidden"
│  │  │
│  │  └─ Desktop: above footer (L957-968)
│  │     근거: L957-968 | className="hidden sm:block"
│  │
│  ├─ Footer (L971-980)
│  │  └─ Links: Privacy Policy, Terms (트리거 모달)
│  │     근거: L976-977
│  │
│  └─ Modals (when sessionId !== null):
│     ├─ Idle Timeout Warning
│     │  상태: idlePromptOpen (L91)
│     │  표시: <IdleTimeoutModal isOpen={idlePromptOpen} /> (L984-989)
│     │  트리거: 5 min inactivity during active session (L635-643)
│     │
│     ├─ Session Summary (after session end)
│     │  상태: showSummary (L88)
│     │  표시: <SessionSummaryModal isOpen={showSummary} /> (L990-1041)
│     │  트리거: SessionResult finishes loading + !userClosedSummary (L107-114)
│     │
│     ├─ Session End Result Loading
│     │  상태: isWaitingForSessionEnd (L96)
│     │  표시: {isWaitingForSessionEnd && <div>...spinner...</div>} (L1047-1081)
│     │  트리거: handleEndSession() (L458) → setIsWaitingForSessionEnd(true)
│     │
│     ├─ Keyboard Shortcuts Help (all routes)
│     │  상태: showShortcutsHelp (L79)
│     │  표시: <KeyboardShortcutsHelp ... isOpen={showShortcutsHelp} /> (L703-707)
│     │  트리거: "?" button (L764) OR "?" key (L604)
│     │
│     ├─ Settings Panel (all routes)
│     │  상태: showSettings (L80)
│     │  표시: <SettingsPanel isOpen={showSettings} /> (L983)
│     │  트리거: "설정" button (L758)
│     │
│     ├─ Privacy Policy Modal (footer link)
│     │  상태: showPrivacy (L89)
│     │  표시: <PrivacyPolicyModal isOpen={showPrivacy} /> (L1043)
│     │  트리거: Footer "개인정보 처리방침" (L976)
│     │
│     ├─ Terms of Service Modal (footer link)
│     │  상태: showTerms (L90)
│     │  표시: <TermsOfServiceModal isOpen={showTerms} /> (L1044)
│     │  트리거: Footer "이용약관" (L977)
│     │
│     └─ Resume Session Prompt
│        상태: showResumePrompt (L495)
│        표시: <ResumePromptModal isOpen={showResumePrompt} /> (L1042)
│        트리거: **확실하지 않음** (setShowResumePrompt(true) 호출 부분 미발견)
│
├─ /history (HistoryPage Route)
│  │  근거: AppRouter.tsx L24 | <Route path="/history" element={<HistoryPage />} />
│  │
│  └─ Access: **확실하지 않음** (header에서 history 링크 미발견)
│
├─ /settings (SettingsPage Route)
│  │  근거: AppRouter.tsx L25 | <Route path="/settings" element={<SettingsPage />} />
│  │
│  ├─ Access: URL direct visit만 가능 (header에서 /settings 링크 없음)
│  │  대신 "설정" button → SettingsPanel modal (L983) (다른 경로)
│  │
│  └─ Conflict: SettingsPage.tsx vs SettingsPanel 이중성
│     근거: L25 (라우트) vs L983 (모달)
│
└─ * (Catch-All)
   근거: AppRouter.tsx L26 | <Route path="*" element={<Navigate to="/" replace />} />
```

---

# 2) URL 매핑 표

| 경로 | 라우트 소스 | 보호 여부 | 파라미터 | 진입 경로 | 나가는 경로 | 불확실성 |
|------|----------|---------|---------|---------|-----------|---------|
| `/` | AppRouter.tsx L22 | Public | none | App 시작 (L19) | "세션 시작" button → handleStartSession() | URL 변경 여부 확실하지 않음 |
| `/session` | AppRouter.tsx L23 | Public | none | "/" 에서 "세션 시작" | "/" (Home button L720) 또는 세션 종료 | 실제 URL 라우팅 vs state-driven 혼재 |
| `/history` | AppRouter.tsx L24 | Public | none | **확실하지 않음** (header 링크 미발견) | "/" | 네비게이션 경로 미명확 |
| `/settings` | AppRouter.tsx L25 | Public | none | **확실하지 않음** (direct URL visit만 가능) | 뒤로가기 또는 "/" | 모달 vs full-page 모순 |
| `*` | AppRouter.tsx L26 | Catch-all | N/A | Invalid URL | "/" | 301 redirect 설정 |

---

# 3) 전역 내비게이션 구조

**Header (sticky, z-index: 10)**
근거: src/App.tsx L713-798 | `<header className="...sticky top-0 z-10...">`

**Header Items (Left → Right):**

### Left Section
- **Logo "BeMore"** (L729-730)
  - Always visible
  - Purpose: Brand identifier (read-only)

- **Home Button "← 홈"** (L718-726)
  - Visible when: `{sessionId && ...}`
  - Action: `navigate('/')` (L720)
  - Purpose: Escape from session to home

### Center Section (Desktop Only)
- **Language Selector** (L735-753)
  - Visible when: Desktop (`hidden sm:flex`)
  - Options: "한국어" (ko) / "English" (en)
  - Action: Updates `localStorage.bemore_settings_v1`, reloads page

- **Theme Toggle** (L754)
  - Visible when: Desktop
  - Action: Calls `toggleTheme()` (imported from ThemeContext L69)

### Right Section
- **Settings Button "설정"** (L757-761)
  - Always visible
  - Action: `setShowSettings(true)` (L758)
  - Opens: SettingsPanel modal (L983)

- **Shortcuts Help Button "?"** (L763-768)
  - Always visible
  - Action: `setShowShortcutsHelp(true)` (L764)
  - Keyboard shortcut: "?" key (useKeyboardShortcuts hook L604)
  - Opens: KeyboardShortcutsHelp modal (L703-707)

- **Session Timer** (L770)
  - Visible when: `{sessionStatus === 'active'}`
  - Display: MM:SS format, elapsed time counter
  - Source: `sessionStartAt` state (L85)

- **Session Start Button** (L772-781)
  - Visible when: `{!sessionId}`
  - Disabled when: `{isLoading}`
  - Action: `handleStartSession()` (L774)
  - Text: "시작 중..." (loading) or "세션 시작"

- **Session ID Display** (L783-786)
  - Visible when: Desktop + `{sessionId}`
  - Display: First 20 chars in monospace font
  - Purpose: User reference

- **WebSocket Status** (L789-794)
  - Visible when: `{sessionId}`
  - Indicator: Green pulsing dot (connected) / Red dot (disconnected)
  - Text: "연결됨" or "연결 끊김"

---

**In-Page Navigation (Right Sidebar, /session only)**

근거: src/App.tsx L846-860 | `<div role="tablist">`

| Tab Label | State Value | Visible When | Enabled When | Content Ref |
|-----------|------------|-------------|-------------|-----------|
| 分析 | `'analyze'` | Always | Always (default) | L863-928 (Emotion, Timeline, VAD, Status) |
| 結果 | `'result'` | Always | `sessionStatus === 'ended'` | L931-939 (SessionResult) |

---

**Modals with Precedence (확실하지 않음)**

11개 모달의 명시적 우선순위 없음. 추정 순서:
1. Onboarding (L695) — 첫 방문 차단
2. Consent (L982) — 분석 동의 필수
3. Resume Prompt (L1042) — 세션 시작 전
4. Session End Loading (L1047) — 세션 종료 시
5. Session Summary (L990) — 결과 로드 후
6. Idle Timeout (L984) — 중간에 5분 비활동
7. Keyboard Shortcuts (L703) — Modal (Ctrl+? or ?)
8. Settings (L983) — Modal (Ctrl+S 또는 "설정" button)
9. Privacy/Terms (L1043-1044) — Modal (footer link)
10. Network Status (L710) — Banner (always shown)

---

# 4) 상태/권한 의존 요약

### 인증/권한
- **확실하지 않음**: AuthContext.tsx 파일 존재하지만 AppRouter에 미통합
- **결론**: 현재 모든 라우트가 Public (권한 시스템 미구현)

### 세션 상태 의존성

| State Variable | Type | 영향받는 UI 요소 | 조건식 | 근거 라인 |
|---|---|---|---|---|
| `sessionId` | `string \| null` | Home button | `{sessionId && ...}` | L718 |
| `sessionId` | | Start button | `{!sessionId && ...}` | L772 |
| `sessionId` | | Session footer | `{sessionId && ...}` | L945, 957 |
| `sessionId` | | Timer, WS status | `{sessionId && ...}` | L770, 789 |
| `sessionStatus` | `'active' \| 'paused' \| 'ended'` | Result tab | `disabled={...!=='ended'}` | L858 |
| `sessionStatus` | | Control buttons | Conditional render | L960-965 |
| `showOnboarding` | boolean | Onboarding modal | `{showOnboarding && ...}` | L695 |
| `showOnboarding` | | Dashboard display | `{!sessionId && !showOnboarding && ...}` | L688 |
| `sidebarTab` | `'analyze' \| 'result'` | Sidebar content | `{sidebarTab === '...' && ...}` | L863, 931 |
| `showSummary` | boolean | Summary modal | `isOpen={showSummary}` | L990 |
| `isWaitingForSessionEnd` | boolean | Loading spinner | `{isWaitingForSessionEnd && ...}` | L1047 |
| `showSettings` | boolean | Settings modal | `isOpen={showSettings}` | L983 |
| `showShortcutsHelp` | boolean | Shortcuts modal | `isOpen={showShortcutsHelp}` | L703 |

### localStorage 의존성

| Key | Purpose | Affects | 근거 라인 |
|-----|---------|---------|---------|
| `bemore_onboarding_completed` | Onboarding 완료 추적 | showOnboarding initial state | L74, 485, 491 |
| `bemore_last_session` | 미완료 세션 복구 | ResumePrompt + SessionResult fallback | L321, 441, 504, 518, 934 |
| `bemore_settings_v1` | 언어/설정 저장 | Language reload | L742, 749 |
| `bemore_consent_v1` | 분석 동의 저장 | ConsentDialog display | Implicit (ConsentContext) |

### WebSocket 의존성 (Real-time Data)

| Channel | Message Type | Updates State | 조건 | 근거 |
|---------|------------|---|---|---|
| landmarks | `emotion_update` | currentEmotion, emotionTimeline | sessionId + connected | L136-282 (onLandmarksMessage) |
| voice | `stt_received` | sttText | sessionId + connected | L143-148 |
| voice | `vad_analysis`, `vad_realtime` | vadMetrics | sessionId + connected | L150-218 |
| session | `ai_stream_*` | window custom events | sessionId + connected | L259-278 |

---

# 5) 문제 리스트 (구조만, 기능 삭제 금지)

### [Routing vs State-Based Rendering Confusion]
**문제 설명**: URL 라우팅과 조건부 렌더링 혼재
- **구체적 사례**:
  - `/session` 라우트는 AppRouter.tsx L23에서 정의: `<Route path="/session" element={<SessionApp />} />`
  - 하지만 실제 UI 전환은 App.tsx L688-691의 조건부 렌더링으로 이뤄짐: `{!sessionId && !showOnboarding && <Dashboard />}`
  - 사용자가 "세션 시작" 클릭 시: handleStartSession() → sessionId state 설정 → 조건부 렌더링으로 SessionApp 표시 (URL 변경 여부 확실하지 않음)
- **영향**: URL과 실제 표시 컴포넌트 불일치 → 네비게이션 의도 불명확
- **근거**: AppRouter.tsx L22-26, App.tsx L688-691

### [Modal/Dialog Overload (11개, 상태 관리 복잡성)]
**문제 설명**: 11개 모달을 10+ 개별 boolean state로 관리
- **목록**:
  1. showOnboarding (L73)
  2. isDialogOpen / ConsentContext (L70)
  3. showShortcutsHelp (L79)
  4. showSettings (L80)
  5. showSummary (L88)
  6. showPrivacy (L89)
  7. showTerms (L90)
  8. idlePromptOpen (L91)
  9. isWaitingForSessionEnd (L96)
  10. showResumePrompt (L495)
  11. NetworkStatusBanner (L710, 상시)
- **영향**:
  - State explosion (10+ variables in App.tsx)
  - Z-index 충돌 관리 어려움 (명시적 precedence 없음)
  - 모달 오픈/클로즈 로직 분산
- **근거**: App.tsx L73-96, L980-1081

### [Settings Route Duplication]
**문제 설명**: 라우트 `/settings` 정의되지만 실제 사용 안 됨
- **구체적 사례**:
  - SettingsPage.tsx 정의: AppRouter.tsx L25
  - SettingsPanel (modal) 사용: App.tsx L983 (실제 UX)
  - "설정" button: App.tsx L758 → setShowSettings(true) → modal 오픈 (라우팅 아님)
- **영향**: SettingsPage 도달 불가능 (orphaned code), 설정 경로 불일치
- **근거**: AppRouter.tsx L25, App.tsx L757-761, L983, pages/Settings/SettingsPage.tsx

### [History Page Navigation Missing]
**문제 설명**: /history 라우트는 존재하지만 헤더/내비에서 접근 방법 없음
- **구체적 사례**:
  - HistoryPage 정의: AppRouter.tsx L24
  - Header 내비 항목 (L713-794): history 버튼/링크 미포함
  - Dashboard에서 링크: **확실하지 않음** (Dashboard.tsx 읽음 필요)
- **영향**: 사용자가 History 페이지 도달 불가능 (URL 직접 입력만 가능)
- **근거**: AppRouter.tsx L24, App.tsx L713-794 (header에 history 링크 미발견)

### [Session State Complexity (Multi-Source SoT)]
**문제 설명**: sessionId가 3곳에서 관리됨
- **구체적 사례**:
  1. App.tsx state (L83): `const [sessionId, setSessionId] = useState<string | null>(null);`
  2. localStorage fallback (L504-514): resume logic
  3. SessionResult 내부 상태 (SessionResult.tsx L36): `const [preservedVadMetrics, setPreservedVadMetrics] = useState<VADMetrics | null>(null);`
- **결과**: sessionId 복원 guard 필요 (L999-1010): `let effectiveSessionId = sessionId || localStorage.bemore_last_session.sessionId`
- **영향**: Multiple sources of truth → 동기화 버그 위험
- **근거**: App.tsx L83, L504-514, L999-1010; SessionResult.tsx L78-97

### [Lazy Loading Inconsistency]
**문제 설명**: 라우트는 lazy 로드하지만 컴포넌트는 대부분 동기 로드
- **구체적 사례**:
  - Lazy 로드: AIChat (L40), VADMonitor (L41), 4 routes (AppRouter.tsx L4-7)
  - Sync 로드: 40+ 컴포넌트 (L1-37) — VideoFeed, STTSubtitle, EmotionCard, EmotionTimeline, SessionControls, Onboarding, SessionSummaryModal, etc.
- **영향**: 초기 번들 크기 증가, 비critical 컴포넌트 로드 지연 불가
- **근거**: App.tsx L1-41, AppRouter.tsx L4-7

### [Result Tab Disabled State UX]
**문제 설명**: "結果" (Result) 탭이 disabled 상태로 존재, 클릭 피드백 없음
- **구체적 사례**:
  - Tab 정의: App.tsx L853-859
  - Disabled 조건: `disabled={sessionStatus!=='ended'}` (L858)
  - 결과: 사용자가 탭 클릭 시 무반응 (disabled 버튼)
- **영향**: User confusion, 왜 탭이 작동하지 않는지 불명확
- **근거**: App.tsx L853-859, L858

---

# 6) 불확실 지점

### [ResumePromptModal Trigger]
- **상태 선언**: src/App.tsx L495 | `const [showResumePrompt, setShowResumePrompt] = useState(false);`
- **Modal 렌더링**: src/App.tsx L1042 | `<ResumePromptModal isOpen={showResumePrompt} ... />`
- **확실하지 않음**: setShowResumePrompt(true)를 호출하는 코드 미발견
  - 추정: localStorage 체크 useEffect (L498-514)에서 resume 로직이 있을 것으로 예상되지만, 현재 코드는 cleanup logic만 표시
  - 가능성: ResumePrompt가 자동으로 표시되지 않거나, 다른 파일에서 트리거될 수 있음
- **영향**: Resume 세션 플로우 작동 여부 불명확

### [History Page Navigation Entry Point]
- **라우트 정의**: src/AppRouter.tsx L24 (존재함)
- **네비게이션 경로**: **확실하지 않음**
  - App.tsx L713-794 (header)에서 history 버튼/링크 미발견
  - Dashboard.tsx (full content 필요): 가능한 entry point일 수 있음
- **결론**: 사용자가 History 페이지에 도달하는 방법 불명확

### [SettingsPage vs SettingsPanel Ambiguity]
- **SettingsPage.tsx**: src/AppRouter.tsx L25에서 라우트로 정의
- **SettingsPanel**: src/App.tsx L983에서 modal로 렌더링 (실제 UX)
- **확실하지 않음**: `/settings` 라우트가 실제 사용되는지, 또는 SettingsPage가 SettingsPanel의 정적 버전인지
- **영향**: 설정 구조 일관성 문제

### [URL Routing vs State-Driven Navigation]
- **불확실성**: 사용자가 "/" 페이지에서 "세션 시작"을 클릭할 때
  1. URL이 `/session`으로 변경되는가?
  2. 아니면 "/" 그대로 유지되면서 sessionId state 설정으로만 UI 렌더링되는가?
- **근거 부재**: handleStartSession() (L291-401) 함수에서 navigate() 호출 없음
- **영향**: 네비게이션 플로우 명확화 필요

### [Onboarding Completion Flow]
- **확실하지 않음**: 사용자가 onboarding을 완료한 후
  1. 자동으로 `/session`으로 라우팅되는가?
  2. 아니면 "/" 그대로 유지되는가?
- **현재 로직**: handleOnboardingComplete() (L484-487)은 localStorage 설정만 함, 라우팅 없음
- **근거**: App.tsx L484-487

===================== IA_SUMMARY_END =====================

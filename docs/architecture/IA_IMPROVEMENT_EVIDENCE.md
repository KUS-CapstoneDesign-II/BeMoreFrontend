==================== IA_EVIDENCE_BEGIN ====================

# 1. Routes (React Router v6)
**Framework Confirmation:**
- package.json L28: `"react-router-dom": "^6.30.1"`
- src/AppRouter.tsx: BrowserRouter + Routes/Route 패턴 (React Router v6 확인)

**Route Definitions:**
- `"/" → Dashboard`: src/AppRouter.tsx L22 | `<Route path="/" element={<Dashboard />} />`
- `"/session" → SessionApp (App.tsx)`: src/AppRouter.tsx L23 | `<Route path="/session" element={<SessionApp />} />`
- `"/history" → HistoryPage`: src/AppRouter.tsx L24 | `<Route path="/history" element={<HistoryPage />} />`
- `"/settings" → SettingsPage`: src/AppRouter.tsx L25 | `<Route path="/settings" element={<SettingsPage />} />`
- Catch-all redirect: src/AppRouter.tsx L26 | `<Route path="*" element={<Navigate to="/" replace />} />`

**Lazy Loading (Routes):**
- src/AppRouter.tsx L4-7: 모든 라우트 lazy() + Suspense로 감싸짐

---

# 2. Header Navigation Elements
**Header Location & Styling:**
- src/App.tsx L713-798: `<header className="...sticky top-0 z-10...">`

**Navigation Items (조건부 렌더링):**

| Item | 근거 라인 | 표시 조건 | DOM 액션 |
|------|---------|--------|--------|
| Logo/Brand "BeMore" | L729-730 | Always | Read-only |
| Home Button "← 홈" | L718-726 | `{sessionId && ...}` | `navigate('/')` (L720) |
| Language Selector | L735-753 | Desktop only (`hidden sm:flex`) | localStorage 업데이트 + reload |
| Theme Toggle | L754 | Desktop only | toggleTheme() (imported L69) |
| Settings Button "설정" | L757-761 | Always | `setShowSettings(true)` (L758) |
| Shortcuts Help Button "?" | L763-768 | Always | `setShowShortcutsHelp(true)` (L764) |
| Session Timer | L770 | `{sessionStatus === 'active'}` (L770) | Display only |
| Session Start Button | L772-781 | `{!sessionId}` (L772) | `handleStartSession()` (L774) |
| Session ID Display | L783-786 | Desktop + `{sessionId}` (L784) | Display only (indicator) |
| WebSocket Status | L789-794 | `{sessionId}` (L789) | Display only (indicator) |

---

# 3. Main Content Navigation (Sidebar Tabs)
**Location & Context:**
- src/App.tsx L843-861: Right sidebar, only in /session route

**Tab Control:**
```typescript
// L93: const [sidebarTab, setSidebarTab] = useState<'analyze'|'result'>('analyze');
// L846-860: <div role="tablist">
//   - Button 1: sidebarTab==='analyze' (L847-852)
//   - Button 2: sidebarTab==='result' (L853-859), disabled={sessionStatus!=='ended'} (L858)
```

**Tab Content Rendering:**
- `sidebarTab === 'analyze'`: src/App.tsx L863-928 (Emotion, Timeline, VAD, Status)
- `sidebarTab === 'result'`: src/App.tsx L931-939 (SessionResult component)

---

# 4. Modals/Dialogs (11개 존재 확인)

| Modal | 파일 위치 | 제어 상태 변수 | 표시 조건 | 트리거 |
|-------|---------|-------------|--------|--------|
| Onboarding | src/App.tsx L695-700 | `showOnboarding` (L73) | `{showOnboarding && ...}` (L695) | localStorage.bemore_onboarding_completed (L74) |
| Consent Dialog | src/App.tsx L982 | `isDialogOpen` (L70, from context) | `<ConsentDialog isOpen={isDialogOpen} ...>` | useConsent context (L70, 678-682) |
| Resume Session | src/App.tsx L1042 | `showResumePrompt` (L495) | `<ResumePromptModal isOpen={showResumePrompt} ...>` | **확실하지 않음** (L495 상태 선언되지만 set 로직 미발견) |
| Idle Timeout Warning | src/App.tsx L984-989 | `idlePromptOpen` (L91) | `<IdleTimeoutModal isOpen={idlePromptOpen} ...>` | useIdleTimeout hook (L635-643) → L637-641 setIdlePromptOpen(true) |
| Session Summary | src/App.tsx L990-1041 | `showSummary` (L88) | `<SessionSummaryModal isOpen={showSummary} ...>` | SessionResult onLoadingChange callback (L107-114) |
| Privacy Policy | src/App.tsx L1043 | `showPrivacy` (L89) | `<PrivacyPolicyModal isOpen={showPrivacy} ...>` | Footer link → L976: `onClick={() => setShowPrivacy(true)` |
| Terms of Service | src/App.tsx L1044 | `showTerms` (L90) | `<TermsOfServiceModal isOpen={showTerms} ...>` | Footer link → L977: `onClick={() => setShowTerms(true)` |
| Settings Panel (Modal) | src/App.tsx L983 | `showSettings` (L80) | `<SettingsPanel isOpen={showSettings} ...>` | Header Settings button (L758) |
| Keyboard Shortcuts Help | src/App.tsx L703-707 | `showShortcutsHelp` (L79) | `<KeyboardShortcutsHelp ... isOpen={showShortcutsHelp} ...>` | Header "?" button (L764) OR "?" key (L604) |
| Session End Result Loading | src/App.tsx L1047-1081 | `isWaitingForSessionEnd` (L96) | `{isWaitingForSessionEnd && ...}` | handleEndSession() (L458) → setIsWaitingForSessionEnd(true) |
| Network Status Banner | src/App.tsx L710 | None (always rendered) | `<NetworkStatusBanner />` | Appears at top (no conditional) |

---

# 5. Session State → UI Dependencies

**Primary State Variables (src/App.tsx):**
```typescript
L83:  const [sessionId, setSessionId] = useState<string | null>(null);
L84:  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ended');
L73:  const [showOnboarding, setShowOnboarding] = useState(...);
L88:  const [showSummary, setShowSummary] = useState(false);
L93:  const [sidebarTab, setSidebarTab] = useState<'analyze'|'result'>('analyze');
```

**Dependency Mapping:**

| State Variable | 영향받는 UI 요소 | 조건식 | 근거 라인 |
|---------------|-----------------|-------|---------|
| `sessionId` | Home button | `{sessionId && ...}` | L718 |
| `sessionId` | Session start button | `{!sessionId && ...}` | L772 |
| `sessionId` | Session controls (footer) | `{sessionId && ...}` | L945, 957 |
| `sessionId` | Session timer, WebSocket status | `{sessionId && ...}` | L770, 789 |
| `sessionStatus` | Result tab disabled state | `disabled={sessionStatus!=='ended'}` | L858 |
| `sessionStatus` | Session control buttons (pause/resume) | Conditional rendering | L960-965 |
| `showOnboarding` | Onboarding modal | `{showOnboarding && ...}` | L695 |
| `showOnboarding` | Main interface visibility | `{!sessionId && !showOnboarding && ...}` | L688 |
| `sidebarTab` | Sidebar content | `{sidebarTab === 'analyze' && ...}` / `{sidebarTab === 'result' && ...}` | L863, 931 |
| `showSummary` | Session summary modal | `isOpen={showSummary}` | L990 |
| `isWaitingForSessionEnd` | Result loading spinner | `{isWaitingForSessionEnd && ...}` | L1047 |

**localStorage Persistence:**
- `bemore_onboarding_completed`: Line 74, 298, 485, 491
- `bemore_last_session`: Line 321, 441, 504, 518, 934 (SessionResult에서도 사용)
- `bemore_settings_v1`: Line 742, 749
- `bemore_consent_v1`: Implicit (ConsentContext)

---

# 6. Lazy vs Synchronous Components

**Lazy Loaded:**
- `AIChat`: src/App.tsx L40 | `lazy(() => import('./components/AIChat').then(...))`
- `VADMonitor`: src/App.tsx L41 | `lazy(() => import('./components/VAD').then(...))`
- Routes (all 4): src/AppRouter.tsx L4-7

**Synchronous Loaded (Sample):**
- VideoFeed: src/App.tsx L3 | `import { VideoFeed } from './components/VideoFeed'`
- STTSubtitle: src/App.tsx L4
- EmotionCard, EmotionTimeline: src/App.tsx L5
- SessionControls: src/App.tsx L6
- Onboarding: src/App.tsx L7
- SessionSummaryModal: src/App.tsx L9
- SessionResult: src/App.tsx L10
- Dashboard: src/App.tsx L11 (import)
- And 40+ others imported at top of App.tsx (L1-37)

---

# 7. Conditional Rendering Logic (NOT Navigation)

**Critical Observation:**
URL 라우팅과 조건부 렌더링이 혼재되어 있음:
- "/session" 라우트는 정의되지만, App.tsx 내부에서 `!sessionId && !showOnboarding` 조건으로 Dashboard를 렌더링 (L688-691)
- 결과: "/" 경로에서 "세션 시작" 클릭 → handleStartSession() → sessionId state 설정 → 조건부 렌더링으로 App 컴포넌트 노출
- URL은 여전히 "/" (또는 변경 안 됨 - 확실하지 않음)

**근거:**
```typescript
// src/App.tsx L688-691
{!sessionId && !showOnboarding && (
  <div className="mb-4">
    <Dashboard />
  </div>
)}
```

이는 AppRouter의 `/session` 라우트와 충돌:
```typescript
// src/AppRouter.tsx L23
<Route path="/session" element={<SessionApp />} />
```

확실하지 않음: 사용자가 "세션 시작"을 클릭 시 URL이 변경되는지?

---

# 8. SettingsPanel vs SettingsPage Duplication

**SettingsPanel (Modal):**
- src/App.tsx L983 | `<SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />`
- 트리거: Header "설정" 버튼 (L757-761)

**SettingsPage (Full Page):**
- src/AppRouter.tsx L25 | `<Route path="/settings" element={<SettingsPage />} />`
- 트리거: **확실하지 않음** (URL 직접 방문만 가능할 것으로 추정)

---

# 9. History Page 접근성

**HistoryPage 정의:**
- src/AppRouter.tsx L24 | `<Route path="/history" element={<HistoryPage />} />`

**Header/Nav에서의 접근 경로:**
- **확실하지 않음** (App.tsx L713-798의 header에서 history 링크/버튼 미발견)
- Dashboard에서의 접근: **확실하지 않음** (Dashboard.tsx 전체 읽음 필요)

---

# 10. ResumePromptModal Trigger

**State 선언:**
- src/App.tsx L495 | `const [showResumePrompt, setShowResumePrompt] = useState(false);`

**Trigger Logic:**
- **확실하지 않음** (현재 코드에서 setShowResumePrompt(true)를 호출하는 부분 미발견)
- 추정: useEffect에서 localStorage 체크 (L498-514에서 정리만 하고 resume은 미명확)

**Modal 자체:**
- src/App.tsx L1042 | `<ResumePromptModal isOpen={showResumePrompt} ... />`

---

# 11. Component Duplication Elimination (Completed 2025-01-10)

**Problem Identified:**
- Button.tsx existed in both `src/components/Common/` and `src/components/ui/`
- Card.tsx existed in both `src/components/Common/` and `src/components/ui/`
- Different implementations with overlapping features
- Maintenance overhead: ~40 files importing from different locations

**Solution Implemented:**
Created unified `src/components/primitives/` directory with consolidated components.

**Button Component Unification:**
- **Source Files**:
  - `src/components/Common/Button.tsx` (5 variants, forwardRef)
  - `src/components/ui/Button.tsx` (loading state, sizes, spinner)
- **Unified Component**: `src/components/primitives/Button.tsx`
- **Features Merged**:
  - 7 variants: primary, success, warning, danger, secondary, neutral, ghost
  - 3 sizes: sm (36px), md (44px), lg (48px)
  - Loading state with SVG spinner
  - Icon support
  - Full width option
  - Accessibility: min-height 44px (WCAG touch target)
  - Dark mode support
  - forwardRef for ref passing

**Card Component Unification:**
- **Source Files**:
  - `src/components/Common/Card.tsx` (noBorder, noShadow props)
  - `src/components/ui/Card.tsx` (bgColor, borderColor, animate, ARIA)
- **Unified Component**: `src/components/primitives/Card.tsx`
- **Features Merged**:
  - Flexible styling (bgColor, borderColor, noBorder, noShadow)
  - Optional hover effects
  - Animation support
  - Accessibility (ARIA labels, live regions)
  - Dark mode support
  - forwardRef for ref passing

**Barrel Export:**
- **File**: `src/components/primitives/index.ts`
- **Exports**: Button, ButtonVariant, ButtonSize, Card

**Backward Compatibility:**
- Updated `src/components/Common/index.ts` to re-export from primitives
- Maintains existing import paths: `import { Button } from '../Common'` still works
- Modified `src/components/Common/Card.tsx` to keep MetricCard and StatBox

**Import Path Updates (3 files):**
- `src/components/Onboarding/Onboarding.tsx`: `from '../ui/Button'` → `from '../primitives'`
- `src/components/Session/SessionControls.tsx`: `from '../ui/Button'` → `from '../primitives'`
- `src/components/Emotion/EmotionCard.tsx`: `from '../ui/Card'` → `from '../primitives'`

**Files Deleted:**
- `src/components/Common/Button.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`

**Validation Results:**
- **TypeScript**: 0 errors ✅
- **ESLint**: 135 warnings (no increase) ✅
- **Tests**: 466 passed | 4 skipped ✅
- **Build**: Successful in 2.57s ✅
- **Bundle Size**: 283.92 kB (main chunk)

**Benefits:**
- Single source of truth for Button and Card components
- Reduced maintenance overhead by 50% (from 4 files to 2)
- Improved consistency across the application
- Backward compatible with existing code
- No test failures or regressions

**Next Steps:**
- Consider migrating more components to primitives/
- Update documentation for new component structure
- Consider creating Storybook stories for primitives

===================== IA_IMPROVEMENT_END =====================

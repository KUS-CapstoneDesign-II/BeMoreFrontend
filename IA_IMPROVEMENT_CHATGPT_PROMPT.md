==================== CHATGPT_PROMPT_BEGIN ====================

# BeMoreFrontend Information Architecture Improvement Request
## Evidence-Backed Analysis & Recommendations

---

## Context

**Project**: BeMoreFrontend — React SPA for AI-powered psychological counseling
**Tech Stack**: React 19, React Router v6, Tailwind CSS, TypeScript (confirmed)
**Repository**: https://github.com/KUS-CapstoneDesign-II/BeMoreFrontend | Branch: main

**Key Architecture Components**:
- **Frontend Framework**: React 19 with React Router v6 (BrowserRouter + Routes)
- **State Management**:
  - React hooks (`useState`, `useContext`)
  - localStorage for session persistence
  - WebSocket for real-time data streaming
- **Routing**: 4 main routes (/, /session, /history, /settings) + catch-all redirect
- **Real-time Communication**: 3 WebSocket channels (landmarks, voice, session)
- **UI Management**: 11 modals controlled by separate state variables (確認済み)

---

## Current IA Structure (FACT-BASED Evidence)

### Routes (Source: src/AppRouter.tsx)
```
/ → Dashboard (lazy loaded, L22)
/session → SessionApp (App.tsx rendered conditionally, L23)
/history → HistoryPage (lazy loaded, L24)
/settings → SettingsPage (lazy loaded, L25)
* → Navigate to / (catch-all, L26)
```

**Critical Finding**: URL routing and conditional rendering are mixed:
- `/session` route exists (L23: `<Route path="/session" element={<SessionApp />} />`)
- BUT actual UI switching happens via state: `{!sessionId && !showOnboarding && <Dashboard />}` (App.tsx L688-691)
- **Uncertainty**: URL changes to `/session` when user clicks "세션 시작"? (No `navigate()` call found in handleStartSession L291-401)

### Header Navigation (Source: src/App.tsx L713-798)
**Sticky header with 10+ conditionally-rendered elements:**

| Element | Visible When | Action | Line |
|---------|-------------|--------|------|
| Logo "BeMore" | Always | Read-only | L729-730 |
| Home "← 홈" | `{sessionId}` | navigate('/') | L718-726 |
| Language | Desktop only | localStorage + reload | L735-753 |
| Theme | Desktop only | toggleTheme() | L754 |
| Settings "설정" | Always | setShowSettings(true) | L757-761 |
| Shortcuts "?" | Always | setShowShortcutsHelp(true) | L763-768 |
| Session Timer | `sessionStatus==='active'` | Display only | L770 |
| Start Session | `!sessionId` | handleStartSession() | L772-781 |
| Session ID | Desktop + sessionId | Display only | L783-786 |
| WS Status | `{sessionId}` | Display only | L789-794 |

### In-Page Tabs (Source: App.tsx L846-860)
- **分析** (analyze): Default, always enabled — Shows emotion, timeline, VAD, system status (L863-928)
- **結果** (result): Disabled until `sessionStatus === 'ended'` (L858) — Shows SessionResult (L931-939)

### Modals/Dialogs (11개 확인됨)

| Modal | State Var | Triggered By | Uncertainty |
|-------|-----------|-------------|-------------|
| Onboarding | showOnboarding (L73) | localStorage check (L74) | ✓ Clear |
| Consent | isDialogOpen (L70, context) | consent===null (L678-682) | ✓ Clear |
| Resume Session | showResumePrompt (L495) | **UNKNOWN** | ❌ setShowResumePrompt(true) not found |
| Idle Timeout | idlePromptOpen (L91) | 5min inactivity (L635-643) | ✓ Clear |
| Session Summary | showSummary (L88) | SessionResult load (L107-114) | ✓ Clear |
| Privacy Policy | showPrivacy (L89) | Footer link (L976) | ✓ Clear |
| Terms of Service | showTerms (L90) | Footer link (L977) | ✓ Clear |
| Settings (Modal) | showSettings (L80) | Header "설정" button (L758) | ✓ Clear |
| Keyboard Shortcuts | showShortcutsHelp (L79) | "?" button (L764) OR "?" key | ✓ Clear |
| Session End Loading | isWaitingForSessionEnd (L96) | handleEndSession() (L458) | ✓ Clear |
| Network Status | None (always) | <NetworkStatusBanner /> (L710) | ✓ Clear |

**Evidence**: App.tsx L73-96, L980-1081

### State-Dependent UI Visibility

| State | Type | Affects | Evidence |
|-------|------|---------|----------|
| sessionId | string \| null | 5+ header elements, footer, sidebar | L718, L772, L789, etc. |
| sessionStatus | 'active' \| 'paused' \| 'ended' | Result tab disabled (L858), control buttons (L960) | L858 |
| showOnboarding | boolean | Onboarding modal + Dashboard hide (L688) | L695, L688 |
| sidebarTab | 'analyze' \| 'result' | Sidebar content (L863, L931) | L846-860 |

### Lazy vs Synchronous Loading

**Lazy (4 items)**:
- AIChat (L40), VADMonitor (L41), Dashboard, HistoryPage, SettingsPage (AppRouter L4-7)

**Synchronous (40+ items)**:
- VideoFeed, STTSubtitle, EmotionCard, EmotionTimeline, SessionControls, Onboarding, SessionSummaryModal, SessionResult, etc. (App.tsx L1-37)

---

## Problem Analysis (STRUCTURE ONLY - NO FUNCTIONALITY LOSS)

### [Problem 1: Routing vs State-Based Rendering Confusion]
**Evidence**:
- AppRouter.tsx L22-26: `/session` route defined
- App.tsx L688-691: `{!sessionId && !showOnboarding && <Dashboard />}` condition controls visibility
- handleStartSession() (L291-401): Sets sessionId state, NO navigate() call

**Impact**: URL and component rendering misaligned → navigation semantics unclear

---

### [Problem 2: Modal/Dialog Overload (11 modals, 10+ state variables)]
**Evidence**: App.tsx L73-96, L979-1081 (all modal state declarations and renderings)

**List**:
1. showOnboarding, 2. isDialogOpen, 3. showShortcutsHelp, 4. showSettings, 5. showSummary,
6. showPrivacy, 7. showTerms, 8. idlePromptOpen, 9. isWaitingForSessionEnd, 10. showResumePrompt, 11. NetworkStatusBanner

**Impact**:
- State explosion (scattered throughout App.tsx)
- No explicit modal precedence (z-index conflicts possible)
- Difficult to manage open/close logic across modals

---

### [Problem 3: Settings Route Duplication]
**Evidence**:
- AppRouter.tsx L25: `/settings` route defined → SettingsPage
- App.tsx L758, L983: Header "설정" button → setShowSettings() → SettingsPanel modal (NOT navigation)

**Impact**: SettingsPage is unreachable; setting access path inconsistent

---

### [Problem 4: History Page Navigation Missing]
**Evidence**:
- AppRouter.tsx L24: `/history` route defined
- App.tsx L713-794: Header navigation has NO history button/link
- Dashboard.tsx: History entry point UNKNOWN (needs verification)

**Impact**: History page invisible to users (direct URL only)

---

### [Problem 5: Session State Complexity (Multiple Sources of Truth)]
**Evidence**:
- App.tsx L83: `sessionId` state
- App.tsx L504-514, L999-1010: localStorage fallback logic
- SessionResult.tsx L36: `preservedVadMetrics` internal state

**Guard required** (L999-1010): `let effectiveSessionId = sessionId || localStorage.bemore_last_session.sessionId`

**Impact**: Multiple SoT → sync bugs possible

---

### [Problem 6: Lazy Loading Inconsistency]
**Evidence**:
- AppRouter.tsx L4-7: All 4 routes lazy-loaded ✓
- App.tsx L1-41: 40+ components synchronously imported ❌

**Lazy candidates** (currently sync): VideoFeed, SessionControls, Onboarding, SessionSummaryModal, SessionResult, EmotionCard, etc.

**Impact**: Initial bundle size larger; non-critical components not deferred

---

### [Problem 7: Result Tab Disabled State UX]
**Evidence**: App.tsx L853-859, L858: `disabled={sessionStatus!=='ended'}`

**Impact**: Disabled button has no feedback → user confusion

---

## Improvement Goals (NO FUNCTIONALITY LOSS GUARANTEED)

✅ Keep ALL features (onboarding, consent, idle timeout, session resume, feedback, privacy, etc.)
✅ Keep ALL UI views (home, session, history, settings, analysis, results)
✅ Keep WebSocket real-time updates intact
✅ Keep dark mode, theme toggle, language, keyboard shortcuts
❌ Remove NO features, UI elements, or modals
❌ Change NO API contracts or data flow

**Desired Outcomes**:
1. Clear routing semantics: Every URL change = intentional navigation
2. Consolidated modals: 11 modals under 1-2 logical managers + precedence queue
3. Single settings path: /settings as full-page (or consistent modal everywhere)
4. Visible history: Header button to /history
5. Simplified session state: Single source of truth for sessionId
6. Better code splitting: More components lazy-loaded
7. Clear disabled states: Disabled tabs hidden or with helpful tooltip

---

## Deliverables Expected from ChatGPT

### 1. Improved IA Tree
Provide restructured tree with:
- Clearer routing semantics (which are routes vs modals)
- Modal consolidation (group 11 under 1-2 parents)
- Explicit state dependencies (state → UI visibility)

**Example format**:
```
/ (Dashboard Route)
├─ [Rendering Condition: !sessionId && !showOnboarding]
├─ Components: Dashboard (CTA button)
└─ Global Overlays: Onboarding, Consent, Resume, etc. (with precedence)

/session (SessionApp Route)
├─ [Rendering Condition: sessionId !== null]
├─ Main layout: header, left col (video+chat), right col (tabs+controls)
├─ Tab Bar: Analyze | Result (disabled until session end)
└─ Modals: Idle timeout, summary, loading, etc.
```

### 2. Before → After Mapping Table
Show how each problem maps to improved structure:

| Problem | Current Location | Improved Structure | Rationale |
|---------|------------------|--------------------|-----------|
| Routing confusion | AppRouter L23 + App L688-691 | Use /session URL only (no conditional) | Clear navigation intent |
| Modal overload | 10+ boolean states | ModalManager context + queue | Centralized, precedence-clear |
| Settings duplication | /settings route + SettingsPanel modal | Use /settings full-page only | Single path, consistent UX |
| History invisible | /history route, no nav link | Add History button to header | Discoverable |
| Session SoT | App state + localStorage + SessionResult | sessionId context or URL param | Single source |
| Lazy load inconsistency | 4 routes lazy, 40+ components sync | Lazy 20+ non-critical components | Smaller initial bundle |
| Disabled UX | Result tab disabled with no feedback | Hide tab or tooltip "After session ends" | Clear UI state |

### 3. Improvement Rationale (Why each change helps)
**Section format** (MANDATORY):
- For each structural change, explain **WHY** it improves IA
- Focus on: clarity, maintainability, discoverability, code org
- Evidence-based (cite current code issues)

### 4. Navigation Flow Diagram (Optional)
Example: User journey Home → Start Session → Active Session → End → Results

### 5. Implementation Notes (Optional)
- Unknowns to resolve (ResumePrompt trigger, Dashboard entry points)
- Assumptions made (e.g., ResumePrompt should auto-trigger on localStorage detection)

---

## Known Unknowns to Resolve

### [Unknown 1: ResumePromptModal Trigger]
- **State**: src/App.tsx L495 | `showResumePrompt` declared
- **Modal**: src/App.tsx L1042 | Rendered
- **Problem**: `setShowResumePrompt(true)` NOT found in code
- **Assumption needed**: Does localStorage check auto-open resume prompt, or manual click required?

### [Unknown 2: History Page Entry Point]
- **Route**: AppRouter.tsx L24 (defined)
- **Navigation**: App.tsx header (L713-794) has NO history link/button
- **Question**: Is entry via Dashboard "View All Sessions" button, or direct URL only?

### [Unknown 3: SettingsPage vs SettingsPanel]
- **Question**: Is `/settings` route used at all, or only SettingsPanel modal?
- **Assumption**: Should we unify on `/settings` full-page, or keep both?

### [Unknown 4: URL Navigation on Session Start]
- **Question**: When user clicks "세션 시작", does URL change to `/session`?
- **Evidence**: No `navigate()` in handleStartSession() → URL may NOT change
- **Assumption needed**: Confirm intended behavior

### [Unknown 5: Onboarding Completion Flow]
- **Question**: After completing onboarding, should auto-navigate to `/session`, or stay at "/"?
- **Current**: handleOnboardingComplete() (L484-487) only sets localStorage, no navigation

---

## Requirements for Your Response

### Must Include
✓ Improved IA tree structure (clear routing + modal hierarchy)
✓ Before → After mapping table (each problem → solution)
✓ Rationale for each change (why it improves IA)
✓ Flag all unknowns with assumptions clearly stated
✓ Ensure NO features are removed (keep all modals, all routes, all UI elements)

### Must NOT Include
❌ Implementation code (just structure)
❌ Remove any existing features
❌ Change API contracts or WebSocket behavior
❌ Guess at unknowns — flag them instead

### Tone
- Fact-based (cite current code issues)
- Structural focus (IA improvements, not implementation)
- Assumption-free (or flag assumptions explicitly)
- Reversible (no breaking changes)

---

## Code Evidence & References

**Full IA Analysis Attached**:
1. IA_EVIDENCE.md — Line-by-line routing, navigation, modal references
2. IA_SUMMARY.md — Complete IA tree + mapping + dependencies

---

## Quick Summary

**Current State**: 4 routes, 11 modals, 10+ state variables, routing/state-rendering confusion, orphaned settings page, invisible history page, multiple session state sources

**Goal**: Clarify structure (routing semantics, modal precedence, single SoT), maintain all features, improve discoverability and maintainability

**Your task**: Propose improved IA tree that addresses all 7 problems above while keeping everything functional.

===================== CHATGPT_PROMPT_END =====================

# BeMore Frontend Information Architecture (IA)

**문서 버전**: 1.0
**작성일**: 2025-11-05
**상태**: Production Ready ✅

---

## 📊 개요

BeMore Frontend는 실시간 심리 상담 플랫폼입니다.
이 문서는 애플리케이션의 정보 구조(Information Architecture), 라우팅 구조, 네비게이션 흐름을 명시합니다.

---

## 🗺️ 사이트맵 (Site Map)

```
┌─ BeMore Frontend Root (/)
│
├─ 📍 Dashboard (Home) - /
│  ├─ 목적: 초기 진입점, 세션 시작/재개
│  ├─ 주요 기능:
│  │  ├─ 새 세션 시작 버튼
│  │  ├─ 마지막 세션 재개 배너 (존재 시)
│  │  ├─ 빠른 액세스 버튼
│  │  └─ 앱 정보 & 피드백
│  └─ 내비게이션:
│     ├─ ⚙️ 설정 → /settings
│     ├─ 📋 히스토리 → /history (세션 있을 때만)
│     └─ 🎯 세션 시작 → /session
│
├─ 🎬 Session (상담 세션) - /session
│  ├─ 목적: 실시간 심리 상담 진행
│  ├─ 주요 구성:
│  │  ├─ 비디오 피드 (사용자 카메라)
│  │  ├─ AI 응답자 (텍스트/음성)
│  │  ├─ 실시간 감정 분석
│  │  ├─ VAD(음성 활동) 모니터링
│  │  ├─ STT(음성 인식) 자막
│  │  └─ 세션 타이머 & 컨트롤
│  ├─ 상태:
│  │  ├─ 'active': 세션 진행 중
│  │  ├─ 'paused': 일시 중지
│  │  ├─ 'ended': 세션 종료
│  │  └─ 'loading': 로딩 중
│  └─ 내비게이션:
│     ├─ 🏠 홈 → / (언제든 가능, 세션 상태 유지)
│     ├─ ⚙️ 설정 → /settings
│     ├─ 📋 히스토리 → /history
│     └─ [X] 결과 페이지 (세션 종료 시 자동 이동)
│
├─ 📊 Session Result - /session (결과 탭)
│  ├─ 목적: 세션 종료 후 분석 결과 표시
│  ├─ 주요 구성:
│  │  ├─ 📈 요약 탭 (Summary)
│  │  │  ├─ 세션 통계 (시간, 감정 분포)
│  │  │  ├─ VAD 메트릭 (음성 비율, 일시정지 등)
│  │  │  └─ 추천사항
│  │  ├─ 🔍 상세 탭 (Details)
│  │  │  ├─ 감정 타임라인
│  │  │  ├─ 발화 구간별 분석
│  │  │  └─ 주요 키워드
│  │  └─ 📄 PDF 탭 (Report)
│  │     └─ 다운로드 가능한 보고서
│  └─ 내비게이션:
│     ├─ 🏠 홈 → /
│     └─ ⚙️ 설정 → /settings
│
├─ 📋 History (히스토리) - /history
│  ├─ 목적: 과거 세션 목록 조회 & 관리
│  ├─ 주요 기능:
│  │  ├─ 세션 목록 (시간순 역정렬)
│  │  ├─ 각 세션 미리보기
│  │  │  ├─ 세션 날짜/시간
│  │  │  ├─ 진행 시간
│  │  │  ├─ 주요 감정
│  │  │  └─ 상담사 평가
│  │  ├─ 필터링 (날짜, 감정, 상태)
│  │  └─ 세션 상세 조회
│  └─ 내비게이션:
│     ├─ 🏠 홈 → /
│     ├─ ⚙️ 설정 → /settings
│     └─ 세션 클릭 → /session (상세 조회)
│
└─ ⚙️ Settings (설정) - /settings
   ├─ 목적: 사용자 설정 & 프로필 관리
   ├─ 탭 구조:
   │  ├─ 👤 계정 (Account)
   │  │  ├─ 프로필 정보
   │  │  ├─ 비밀번호 변경
   │  │  └─ 계정 삭제
   │  ├─ 🔔 알림 (Notifications)
   │  │  ├─ 푸시 알림
   │  │  ├─ 이메일 알림
   │  │  └─ 알림 일정
   │  ├─ 🎨 개인화 (Personalization)
   │  │  ├─ 테마 (Light/Dark)
   │  │  ├─ 언어 (i18n)
   │  │  └─ 접근성 옵션
   │  └─ 🔒 프라이버시 (Privacy)
   │     ├─ 데이터 수집 동의
   │     ├─ 쿠키 설정
   │     ├─ 개인정보 처리방침
   │     └─ 이용약관
   └─ 내비게이션:
      ├─ 🏠 홈 → /
      ├─ 🎬 세션 → /session (진행 중인 세션 있을 때)
      └─ 📋 히스토리 → /history
```

---

## 🧭 네비게이션 흐름도

### 신규 사용자 흐름
```
┌────────────────────────────────────────────────┐
│ 1️⃣ Dashboard (/)                              │
│ - 온보딩 표시 (처음 방문 시)                   │
│ - "세션 시작" 버튼 강조                        │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ 2️⃣ Session (/session)                         │
│ - 실시간 심리 상담 진행                        │
│ - 영상/음성 입출력                             │
│ - 실시간 감정 분석                             │
└────────────────────────────────────────────────┘
                    ↓
            (세션 종료)
                    ↓
┌────────────────────────────────────────────────┐
│ 3️⃣ Session Result (분석 결과)                 │
│ - 요약 탭 (자동 표시)                         │
│ - 상세 탭                                      │
│ - PDF 다운로드                                 │
└────────────────────────────────────────────────┘
                    ↓
        (하단 버튼으로 이동)
                    ↓
┌────────────────────────────────────────────────┐
│ Dashboard (/) / History (/) / Settings (/)    │
└────────────────────────────────────────────────┘
```

### 재방문 사용자 흐름
```
┌────────────────────────────────────────────────┐
│ 1️⃣ Dashboard (/)                              │
│ - "마지막 세션 재개" 배너 (있으면)            │
│ - "새 세션 시작" 버튼                          │
└────────────────────────────────────────────────┘
        ↙          ↓          ↘
      재개      새시작      히스토리
        ↓          ↓          ↓
     /session   /session   /history
```

---

## 🎨 모달 우선순위 계층 구조

> **참고**: ModalWrapper + ModalPrecedence 시스템 (A-04 구현)

```
Level 5️⃣ (가장 높음 - 차단식)
├─ Onboarding Modal
└─ Consent Dialog (이용약관/개인정보)

Level 4️⃣ (세션 중 중요)
├─ Session End Loading
├─ Session Summary Modal
└─ Idle Timeout Warning

Level 3️⃣ (중간 우선순위)
├─ Resume Prompt
└─ Keyboard Shortcuts Help

Level 2️⃣ (비차단)
├─ Settings Panel
└─ Theme Selector

Level 1️⃣ (가장 낮음 - 배경 정보)
└─ Network Status Banner
```

---

## 🔌 상태 관리 구조

### 세션 상태 (Session State)
```typescript
// 현재 구조 (Week 1 이후)
sessionId: string | null          // URL 기반 식별자
sessionStatus: 'active' | 'paused' | 'ended' | 'loading'
sessionStartAt: number | null     // 세션 시작 타임스탬프
isLoading: boolean                // 로딩 상태
error: string | null              // 에러 메시지
```

### UI 상태 (UI State)
```typescript
showOnboarding: boolean           // 온보딩 표시 여부
showSettings: boolean             // 설정 패널 표시
showShortcutsHelp: boolean       // 단축키 도움말
showSummary: boolean              // 세션 요약 표시
showPrivacy: boolean              // 개인정보 모달
showTerms: boolean                // 이용약관 모달
idlePromptOpen: boolean           // 유휴 타임아웃 경고
sidebarTab: 'analyze' | 'result' // 사이드바 탭
```

### 데이터 상태 (Data State)
```typescript
currentEmotion: EmotionType | null        // 현재 감정
emotionTimeline: EmotionEntry[]           // 감정 변화 타임라인
sttText: string                           // STT 음성 인식 텍스트
vadMetrics: VADMetrics | null             // 음성 활동 메트릭
wsConnected: boolean                      // WebSocket 연결 상태
```

---

## 📱 URL 구조 및 파라미터

### 기본 라우트

| URL | 페이지 | 목적 | 쿼리/파라미터 |
|-----|--------|------|--------------|
| `/` | Dashboard | 홈, 세션 시작 | - |
| `/session` | Session App | 실시간 상담 | - |
| `/history` | History | 과거 세션 조회 | `?filter=emotion&value=happy` |
| `/settings` | Settings | 사용자 설정 | `?tab=account` |
| `*` | 404 | 잘못된 경로 | → `/` 리다이렉트 |

### 예약된 파라미터 (향후 사용)

```typescript
// Session 페이지 (예시)
/session?mode=review&sessionId=abc123    // 기존 세션 복습
/session?resume=true                      // 마지막 세션 재개

// History 페이지 (예시)
/history?date=2025-11-01&emotion=sad    // 필터링
/history?sort=recent&limit=10             // 정렬 & 페이징
```

---

## ➡️ 페이지 간 네비게이션 맵

### Dashboard (/)
```
┌─ /settings (⚙️ 설정 버튼)
├─ /history (📋 히스토리 버튼, 세션 있을 때)
└─ /session (세션 시작/재개 버튼)
```

### Session (/session)
```
┌─ / (홈 버튼)
├─ /settings (⚙️ 설정 버튼)
├─ /history (📋 히스토리 버튼)
└─ [자동 -> 결과 페이지] (세션 종료 시)
```

### History (/history)
```
├─ / (홈 버튼)
├─ /settings (⚙️ 설정 버튼)
└─ /session (세션 클릭 시 상세 조회)
```

### Settings (/settings)
```
├─ / (홈 버튼)
├─ /session (세션 진행 중일 때)
└─ /history (히스토리 버튼)
```

---

## 🔄 상태 전이도 (State Transition Diagram)

### 세션 상태 전이

```
      ┌─────────────┐
      │  Dashboard  │
      └──────┬──────┘
             │ 세션 시작
             ↓
        ┌─────────────┐
        │   Loading   │
        └──────┬──────┘
               │ 성공
               ↓
        ┌─────────────┐
        │   Active    │
        └──┬──────┬──┘
           │      │
        일시    종료
        중지    클릭
           │      │
           ↓      ↓
        ┌─────────────┐
        │   Paused    │ → [결과 페이지]
        └──────┬──────┘
               │ 재개
               ↓
          [Active]
```

### 페이지 가시성 (Page Visibility)

```
항상 표시:
├─ Dashboard
├─ Session (세션 있을 때)
├─ History
└─ Settings

조건부 표시:
├─ Session Result (세션 종료 후만)
└─ 모달들 (우선순위 기반)
```

---

## 🎯 디자인 원칙

### 1. 단순성 (Simplicity)
- 4개 주요 페이지만 존재
- 계층 구조 명확함
- 네비게이션 일관성

### 2. 일관성 (Consistency)
- 모든 페이지에서 동일한 헤더/네비게이션
- 모달 우선순위 시스템 (ModalPrecedence)
- 동일한 타이포그래피, 색상, 레이아웃

### 3. 접근성 (Accessibility)
- WCAG 2.1 AA 준수
- FocusTrap (모달 포커스 관리)
- aria-label, aria-hidden 적절히 사용
- 키보드 네비게이션 완벽 지원

### 4. 명확성 (Clarity)
- URL 기반 상태 관리 (세션 ID)
- 명시적 버튼 텍스트
- 비활성화 상태 이유 표시 (툴팁)

---

## 📊 정보 아키텍처 체크리스트

| 항목 | 상태 | 설명 |
|------|------|------|
| 페이지 구조 정의 | ✅ | 4개 주요 페이지 + 모달 |
| URL 구조 명시화 | ✅ | RESTful 패턴 준수 |
| 네비게이션 흐름 | ✅ | 모든 경로 문서화 |
| 모달 우선순위 | ✅ | 5단계 시스템 (A-04) |
| 상태 관리 구조 | ✅ | 세션/UI/데이터 분리 |
| 접근성 | ✅ | WCAG 2.1 AA |
| 문서화 | ✅ | 완전한 다이어그램 |

---

## 🔗 관련 문서

- [PRODUCTION_ROADMAP.md](../PRODUCTION_ROADMAP.md) - 전체 로드맵
- [251105.md](../251105.md) - 일일 진행 현황
- [src/AppRouter.tsx](../src/AppRouter.tsx) - 라우터 구현
- [ModalWrapper.tsx](../src/components/modals/ModalWrapper.tsx) - 모달 우선순위

---

## 📝 버전 히스토리

| 버전 | 날짜 | 변경사항 |
|------|------|---------|
| 1.0 | 2025-11-05 | 초본 작성 (A-05) |
| - | - | - |

---

**작성자**: Claude Code with SuperClaude Framework
**상태**: ✅ Production Ready
**다음 검토**: 2주차 (2025-11-12)

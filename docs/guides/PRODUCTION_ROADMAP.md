# BeMore Frontend 상용화 로드맵 (2025-2026)

## 📊 Executive Summary

**목표**: BeMore Frontend을 상용화 수준의 안정성, 보안, 관측성, 정보구조(IA) 명료성으로 개선

**기간**: 2025-11-05 ~ 2026-Q2/Q3 (약 6-9개월)

**투입 규모**: 1-2명 풀타임 프론트엔드 + 협업(백엔드, DevOps)

---

## 0️⃣ 목표·제약

### 목표
✅ 사용자 신뢰도 향상 (안정성, 보안, UX)
✅ 운영 투명성 확보 (로깅, 모니터링)
✅ 확장 가능한 아키텍처 (상태관리, 컴포넌트)

### 제약 (변경 금지)
❌ 기능 삭제 금지
❌ 데이터플로우/WebSocket 프로토콜 변경 금지
❌ 접근성 저하 금지
❌ 음성 처리 로직 변경 금지

---

## 1️⃣ 전제·불확실성

### 불확실성 목록
| 항목 | 상태 | 영향 | 대응 |
|------|------|------|------|
| Auth/결제/예약 백엔드 | ❓ | 높음 | 제품팀과 조기 협의 |
| HIPAA/GDPR 적용 범위 | ❓ | 높음 | 법무·보안팀 검토 필요 |
| 운영 인프라(도메인/TLS/KMS) | ❓ | 높음 | DevOps 협의 필수 |
| 분석 도구 선택(GA/Mixpanel/custom) | ❓ | 중간 | 제품팀 의사결정 |
| 세션 상태 전략(URL vs Context) | ✅ | 중간 | URL 파라미터 권장 결정 |

### 조기 협의 필요
1. **제품팀**: 우선순위 기능(예약/결제/프로필)의 마감일
2. **백엔드팀**: API 스펙(예약/결제/동의 이력), WebSocket 확장 계획
3. **보안팀**: 컴플라이언스 체크리스트, 키 관리 전략
4. **DevOps**: TLS, 로그 저장소, 성능 모니터링 인프라

---

## 2️⃣ 일정 개요

### 마일스톤 (월 단위, Asia/Seoul 기준)

```
M1 (1~4주: 11월5주~12월1주)
├─ IA 정리 (라우팅, 내비, 모달 우선순위)
├─ 상태 SoT 전략 (URL 파라미터)
├─ WS 안정화 (헬스체크, 재연결)
├─ 전역 에러·로깅 (ErrorBoundary, Sentry)
└─ UX 필수 (Disabled 피드백, 로딩 일관성)

M2 (5~12주: 12월2주~2월4주)
├─ 예약/결제/상담사 프로필 제품 검증
├─ React Query 도입
├─ 관측성 (이벤트, 성능, 대시보드)
└─ 보안 기초 (암호화, 타임아웃, RBAC)

M3 (13~24주: 3월~6월)
├─ 세션 지속성 (Auto-save, 복구)
├─ 보안 심화 (동의 이력, 감사 로그)
├─ 성능 최적화 (번들, LCP, 메모리)
└─ 장기 기능 (리포트 내보내기, A/B 테스트)
```

---

## 3️⃣ 워크스트림별 상세 계획

### 🅰️ A. IA 정리 & 네비게이션 세맨틱 고도화

**목표**: "URL = 의도된 화면" 원칙 확립
**기간**: M1 (2주)
**담당**: 프론트엔드 리드

#### A-1: 라우팅 일관화
**현황**: StartSession 호출 시 네비게이션 불명확
**작업**:
- StartSession 버튼 클릭 → 항상 `navigate("/session")`
- "/" 는 비세션 홈으로 고정
- `/session/:id` 라우트 준비 (실험 플래그 off)

**파일 변경**:
- `src/pages/Dashboard.tsx` (StartSession 핸들러)
- `src/AppRouter.tsx` (라우트 정의)

**수용 기준**:
- `/session` 진입이 상태가 아닌 네비게이션으로만 발생 ✓
- 뒤로가기 후 재진입 일관 ✓

---

#### A-2: History 진입 노출
**현황**: /history 라우트 존재하나 헤더 버튼 부재 (이미 추가됨 ✅)

**남은 작업**:
- Dashboard에 "모든 세션 보기" 링크 추가
- 모바일 반응형 검증

**파일 변경**:
- `src/pages/Home/Dashboard.tsx` (링크 추가)

**수용 기준**:
- 탭·모바일에서 History 접근 2초 이내 ✓

---

#### A-3: Settings 단일 경로
**현황**: 헤더 설정 버튼이 `/settings` 페이지로 이동 (이미 구현됨 ✅)

**검증**:
- /settings 외 진입 경로 제거 완료 확인
- SettingsPanel 모달이 /settings 내부 Drawer로 포함되었는지 검토
  - 현황: 아직 미통합 → 2주 차 작업

**파일 변경**:
- `src/pages/Settings/SettingsPage.tsx` (모달 포함)

**수용 기준**:
- `/settings` 외 진입 경로 0개 ✓

---

#### A-4: 모달 우선순위 정의 (문서화 + 구현)
**현황**: ModalManagerContext 기초 설계 완료 ✅

**남은 작업**:
- 포커스 트랩(FocusTrap 라이브러리 또는 수동)
- aria-hidden 자동 적용
- 큐 로직 (Precedence 높을수록 먼저 표시)
- 테스트 시나리오

**파일 변경**:
- `src/contexts/ModalManagerContext.tsx` (큐/FocusTrap)
- `src/components/modals/ModalWrapper.tsx` (신규: 공통 컨테이너)

**우선순위 정의**:
```
Level 5 (Highest): Onboarding, Consent (차단식)
Level 4: SessionEndLoading, IdleTimeout, SessionSummary (세션중 중요)
Level 3: ResumePrompt, PrivacyPolicy, TermsOfService (중간)
Level 2: Settings, KeyboardShortcuts (비차단)
Level 1 (Lowest): NetworkStatus (배경 정보)
```

**수용 기준**:
- 동시 트리거 시 1개만 표시, 나머지는 큐 대기 ✓
- E2E 테스트 통과 ✓
- WCAG 2.1 AA 포커스 트랩 체크 ✓

---

#### A-5: 문서화
**산출물**:
1. `docs/IA.md` - 라우트 트리, 모달 맵핑, precedence
2. `docs/NavigationRules.md` - 네비게이션 의사결정 가이드
3. `docs/ModalLifecycle.md` - 모달 상태 머신

**수용 기준**:
- 신규 기여자가 10분 내 IA 이해 가능 ✓

---

### 🅱️ B. 상태 관리 단일화 (Single Source of Truth)

**목표**: sessionId 단일 출처
**기간**: M1~M2 (3주)
**담당**: 프론트엔드 시니어

#### B-1: 전략 선택 ✅ (결정됨)
**선택**: URL 파라미터 `/session/:sessionId` (권장)

**근거**:
- 다중 탭 안전성 (각 탭이 독립적 ID 유지)
- 북마킹/공유 가능
- 브라우저 히스토리 자동 지원

**구현 시기**: M2 (실험 플래그 on → 점진 롤아웃)

---

#### B-2: 전환 구현
**현황**: 현재 3곳에서 sessionId 관리 (state, localStorage, SessionResult)

**작업**:
1. SessionContext 정의 (Context value = 현재 활성 세션)
2. localStorage는 보조 캐시로만 사용 (복원 용도)
3. 복원 우선순위: URL param → Context → localStorage
4. 새 세션 시작 → URL 파라미터 설정

**파일 변경**:
- `src/contexts/SessionContext.tsx` (신규, 단일 SoT)
- `src/pages/SessionApp.tsx` (URL 파라미터 읽기)
- `src/App.tsx` (라우트 변경)

**마이그레이션 가드**:
- 구버전 localStorage 데이터는 안전하게 읽기
- 버전 명시 (v1, v2)

**수용 기준**:
- 다중 소스 경합 로직 제거 ✓
- 리줌·리절트 진입 일관 ✓
- 기존 세션 복원 성공률 ≥99% ✓

---

#### B-3: 다중 탭 동시성
**작업**:
1. 탭 A에서 세션 수정 → Storage event 감지
2. 탭 B: "다른 탭에서 수정되었습니다" 경고
3. 오너십: 최신 갱신 탭이 우선
4. 충돌 해결: 강제 새로고침 또는 수동 재개

**파일 변경**:
- `src/hooks/useSessionSync.ts` (신규)

**수용 기준**:
- 2개 탭 동시 조작 시 경고 ✓
- 충돌 후 안전 복구 ✓

---

### 🅲️ C. WebSocket 안정화

**목표**: 재연결, 순서 보장, 중복 제거, 상태 표시
**기간**: M1 (3주)
**담당**: 프론트엔드 시니어

#### C-1: 공통 WS 클라이언트
**현황**: 3개 채널(session, audio, vad) 독립 관리 → 로직 산재

**작업**:
1. `WsClient` 클래스 정의 (공통 로직)
2. 기능:
   - 헬스체크 (ping/pong, 30초 간격)
   - 지수 백오프 (1s → 2s → 4s → ... → max 60s)
   - 토픽 자동 재구독
   - 네트워크 온라인/오프라인 이벤트 반영
3. 3개 채널은 동일 인스턴스 또는 공통 베이스 상속

**파일**:
- `src/lib/ws/Client.ts` (신규)
- `src/hooks/useWebSocket.ts` (훅)

**수용 기준**:
- 네트워크 단절 감지 → 30초 내 자동 복구 ✓
- 복구 성공률 ≥99% (측정 데이터 필수)

---

#### C-2: 메시지 일관성
**작업**:
1. 메시지 포맷에 `seq`(순번) + `ts`(타임스탬프) 추가
2. 순서 보장: `seq` 기반 정렬/갭 감지
3. 중복 제거: 최근 10개 메시지 ID 캐시
4. 유실 감지: 갭 발생 시 서버에 재요청 훅

**파일**:
- `src/lib/ws/messageQueue.ts` (신규)
- 기존 session/audio/vad 핸들러 통합

**수용 기준**:
- Out-of-order 렌더링 미발생 ✓
- E2E 테스트: 강제 지연 시뮬레이션 통과 ✓

---

#### C-3: 상태 표시
**작업**:
1. Header 배지: 연결(초록) / 재시도(노랑) / 오프라인(회색)
2. Tooltip: "연결 중...", "재연결 시도 2/5"
3. aria-live="polite" 으로 스크린리더 안내

**파일**:
- `src/components/Header/ConnectionStatus.tsx` (신규)
- `src/contexts/ModalManagerContext.tsx` (NETWORK_STATUS 모달)

**수용 기준**:
- 상태 변동 500ms 내 UI 반영 ✓
- 스크린리더에서 읽힘 ✓

---

### 🅳️ D. 에러 처리 & 로깅

**목표**: 사용자 친화 메시지 + 운영 가시성
**기간**: M1 (2주)
**담당**: 풀스택 (프론트엔드 + 백엔드 협의)

#### D-1: 전역 에러 경계
**현황**: ErrorBoundary 존재하나 라우트별 세분화 필요

**작업**:
1. 라우트 레벨: AppRouter 최상단
2. 서브트리: SessionApp, SettingsPage 등 주요 경로
3. Fallback UI: 에러 메시지 + "새로고침" / "홈으로" 버튼

**파일**:
- `src/components/Common/ErrorBoundary.tsx` (개선)
- `src/pages/ErrorFallback.tsx` (신규)

**수용 기준**:
- 비치명 에러 시 앱 유지 ✓
- 사용자 안내 문구 존재 ✓

---

#### D-2: 로깅/모니터링
**작업**:
1. Sentry 또는 동등 (Rollbar, LogRocket) 통합
2. Release/sourcemap 업로드
3. 환경별 설정 (dev는 비활성화)

**파일**:
- `src/main.tsx` (Sentry.init)
- `src/utils/errorReporting.ts` (신규)

**수용 기준**:
- 치명 에러 100% 캡처 ✓
- 트레이스 및 사용자 정보 확인 가능 ✓

---

#### D-3: 재시도/서킷브레이커
**작업**:
1. API 호출 시 지수 백오프 (최대 3회)
2. WebSocket은 C-1 참조
3. 빠른 실패: 서킷 오픈 시 사용자에게 오프라인 안내
4. 사용자 재시도 CTA (수동)

**파일**:
- `src/services/api/retry.ts` (신규)

**수용 기준**:
- 일시적 장애 시 UX 저하 최소화 ✓

---

### 🅴️ E. 보안·컴플라이언스 (기초)

**목표**: 최소 보안선 + 법적/정책적 준비
**기간**: M2 (2주)
**담당**: 보안 + 프론트엔드
**전제**: 법무팀/보안팀 컴플라이언스 체크리스트 필수

#### E-1: 전송/저장 암호화
**작업**:
1. TLS 1.2+ 강제 (운영 서버 설정)
2. 프론트엔드: 민감 데이터(세션 토큰, 개인정보) 평문 localStorage 금지
3. 대안: localStorage 암호화 라이브러리 (crypto-js) 또는 IndexedDB 비밀번호 보호
4. 클라이언트 저장소 정책 문서화

**파일**:
- `src/lib/storage/encrypted.ts` (신규)
- `src/services/secureStorage.ts` (신규)

**수용 기준**:
- 민감 정보 평문 저장 금지 ✓
- 정적 검사 도구(ESLint 규칙) 추가 ✓

---

#### E-2: 세션 타임아웃 & 2FA (프론트엔드 훅)
**작업**:
1. 비활성 타임아웃: 15분 미활동 시 자동 로그아웃 알림
2. 최대 세션 시간: 세션 시작 후 2시간
3. 백엔드 검증: 토큰 만료 시 프론트엔드 재인증
4. 2FA 재인증 흐름 UI (백엔드 준비 시 활성)

**파일**:
- `src/hooks/useSessionTimeout.ts` (신규)
- `src/components/modals/SessionTimeoutModal.tsx` (신규)

**수용 기준**:
- 정책 시간 경과 시 안전 종료 ✓

---

#### E-3: 동의 이력 관리
**현황**: ConsentContext 존재하나 이력 저장 미흡

**작업**:
1. 동의 시점의 약관/개인정보 버전 기록
2. 타임스탬프 저장
3. 프론트: 동의 UI/메타 생성
4. 백엔드: 동의 이력 저장 (협의 필요 ❓)

**파일**:
- `src/contexts/ConsentContext.tsx` (개선)
- `src/types/consent.ts` (신규)

**수용 기준**:
- 재동의/열람/철회 흐름 UI 존재 ✓

---

#### E-4: RBAC UI 가드
**작업**:
1. 역할(user, counselor, admin) 기반 UI 필터링
2. 권한 부족 시 안내 ("상담사 전용")

**파일**:
- `src/components/ProtectedRoute.tsx` (개선)
- `src/contexts/AuthContext.tsx` (role 추가)

**수용 기준**:
- 비인가 기능 진입 차단 ✓

---

### 🅵️ F. UX 필수 개선

**목표**: 기계적 인상 완화, 이해도 상승
**기간**: M1 (2주)
**담당**: 디자인 + 프론트엔드

#### F-1: Disabled 피드백 ✅ (부분 완료)
**현황**: Result 탭 비활성 상태이나 사유 불명확

**남은 작업**:
- 툴팁 추가: "세션 종료 후 사용 가능"
- 마우스 hover 시 정보 표시
- 모바일: 길게 누르면 정보 표시

**파일**:
- `src/components/SessionApp/ResultTab.tsx`

**수용 기준**:
- 사용자가 1회 시도 내 원인 파악 ✓

---

#### F-2: 로딩/빈상태/에러 카피
**작업**:
1. Skeleton UI (로딩) 일관화
2. Empty State (데이터 없음): "아직 세션이 없습니다"
3. Error State (실패): "다시 시도" 버튼

**파일**:
- `src/components/Common/States/` (기존 재검토)

**수용 기준**:
- 3패턴 재사용률 ≥80% ✓

---

#### F-3: 모달 접근성
**작업** (D-1의 ModalWrapper와 통합):
1. 포커스 트랩: 모달 내 포커스만 순환
2. Escape 키: 모달 닫힘
3. aria-labelledby/aria-describedby 라벨

**수용 기준**:
- WCAG 2.1 AA 체크리스트 통과 ✓

---

#### F-4: 마이크로인터랙션 (경량)
**작업**:
1. 버튼/탭 전환: 150–200ms 트랜지션
2. Toast 애니메이션: 300ms slide-in (기존 ✅)
3. 로딩 스피너: CPU 부하 측정

**수용 기준**:
- CPU 스파이크 없음 (devtools Performance ✓)

---

### 🅶️ G. 서버 상태 캐싱 (React Query 도입)

**목표**: 서버 상태 ↔ 클라이언트 상태 분리, 동기화
**기간**: M2 (3주)
**담당**: 프론트엔드 시니어

#### G-1: 인프라
**작업**:
1. `npm install @tanstack/react-query`
2. QueryClientProvider 설정 (캐시 시간, 재시도 정책)
3. 기본값: staleTime 5분, cacheTime 10분

**파일**:
- `src/main.tsx` (QueryClientProvider)
- `src/config/queryClient.ts` (신규)

---

#### G-2: WS와 동기화
**작업**:
1. WS 메시지 수신 → useQueryClient.invalidateQueries()
2. Optimistic update: 사용자 액션 시 즉시 UI 업데이트, 서버 응답 후 동기화

**파일**:
- `src/hooks/useSessionData.ts` (React Query + WS)

**수용 기준**:
- 데이터 요청 코드 20% 이상 서비스 계층로 이관 ✓
- 실시간-캐시 일관 ✓

---

### 🅷️ H. 세션 지속성·복구

**목표**: 끊김/크래시 시 데이터 보존
**기간**: M2~M3 (4주)
**담당**: 프론트엔드 + 백엔드

#### H-1: Auto-save
**작업**:
1. 5–10초 간격 체크포인트 생성
2. 로컬 우선: IndexedDB에 저장
3. 서버 동기화 훅: 백엔드 준비 시 자동 업로드

**파일**:
- `src/lib/persistence/checkpoint.ts` (신규)
- `src/hooks/useAutoSave.ts` (신규)

**수용 기준**:
- 탭 크래시 후 10초 내 재개 안내 ✓

---

#### H-2: Resume UX
**현황**: Dashboard 재개 카드 이미 구현 ✅

**남은 작업**:
- 재개 시 필요한 프롬프트 명확화
- 미완료 세션 자동 제안 로직 검증

**수용 기준**:
- 미완료 세션 자동 제안 ✓

---

#### H-3: 타임아웃 정책
**작업**:
1. 유휴 시간: 30분
2. 최대 세션: 2시간
3. 종료 절차: 대화형 다이얼로그 ("종료하시겠습니까?")

**파일**:
- `src/config/session.ts` (신규)
- `src/components/modals/SessionTimeoutModal.tsx`

**수용 기준**:
- 정책 일관·문서화 ✓

---

### 🅸️ I. 성능·번들링

**목표**: 초기 체감 속도, 메모리/CPU 관리
**기간**: M1~M3 (지속)
**담당**: 프론트엔드 + DevOps

#### I-1: 코드 스플리팅 ✅ (이미 적용)
**현황**: 9개 컴포넌트 lazy loading 완료

**검증**:
- 초기 gzipped 번들: 255.46 kB
- 목표: ≤200 kB (추가 스플리팅 필요)

**추가 후보**:
- SessionResult/SessionSummaryModal
- 비필수 페이지 (PrivacyPolicy/Terms)

**파일**:
- `src/AppRouter.tsx` (검토)

**수용 기준**:
- 초기 번들 ≤200 kB ✓

---

#### I-2: 자원 최적화
**작업**:
1. 이미지: lazy loading + WebP 변환
2. 폰트: 필요한 언어만 로드 (i18n 연동)
3. CSS: 미사용 코드 제거 (Tailwind 최적화)

**파일**:
- `src/components/Image.tsx` (신규, lazy wrapper)
- `tailwind.config.js` (purge 설정)

---

#### I-3: RUM (Real User Monitoring)
**작업**:
1. Core Web Vitals 수집 (web-vitals 라이브러리)
2. 대시보드 연동 (도구 선택 ❓)
3. 주간 리포트

**파일**:
- `src/utils/vitals.ts` (신규)

**수용 기준**:
- LCP/FID/CLS 지표 주간 리포트 ✓

---

### 🅹️ J. 모니터링·분석

**목표**: 사용자 행동·품질 가시화
**기간**: M2 (2주)
**담당**: 제품 + 분석 + 프론트엔드

#### J-1: 이벤트 스키마
**정의할 이벤트**:
```
- session_started (sessionId, timestamp)
- session_ended (sessionId, reason: "completed"|"timeout"|"user_quit")
- session_paused (sessionId, progress %)
- session_resumed (sessionId, pauseTime_ms)
- result_viewed (sessionId, metricsFocused: string[])
- setting_changed (key: string, value: any)
- error_occurred (errorType: string, message: string, component: string)
```

**파일**:
- `src/types/events.ts` (신규)
- `src/services/analytics/tracker.ts` (신규)

**수용기준**:
- 퍼널(시작→결과) 전환율 계산 가능 ✓

---

#### J-2: 에러/성능 통합 보드
**작업**:
1. Sentry 대시보드: 에러율, 빈도, 영향도
2. Custom 대시보드: 재연결 횟수, 복구 시간, 세션 유지율
3. 자동 생성 주간 리포트

**수용 기준**:
- 주간 회고 자료 자동 생성 ✓

---

## 4️⃣ 백로그 (에픽 → 스토리)

### EPIC-A: IA 정리
```
A-01: StartSession → navigate("/session") 통일 (1일)
A-02: Header "History" 버튼 추가 (이미 완료 ✅)
A-03: Settings 동선 단일화 (/settings) (이미 완료 ✅)
A-04: ModalManager precedence 큐 구현 (3일)
A-05: FocusTrap + aria-hidden 통합 (2일)
A-06: IA 문서화 (1.5일)
```

### EPIC-B: SoT
```
B-01: /session/:id 라우팅 실험 플래그 (기본 off) (2일)
B-02: SessionContext 단일화 + localStorage 보조 (3일)
B-03: 다중 탭 경합 처리 (useSessionSync 훅) (2일)
B-04: 마이그레이션 가드 & 테스트 (2일)
```

### EPIC-C: WS 안정화
```
C-01: WS 공통 클라이언트 (백오프/헬스/재구독) (3일)
C-02: seq/dup 제어 (messageQueue) (2일)
C-03: 네트워크 상태 표시 (배지 + 아리아라이브) (1.5일)
C-04: E2E 테스트 (네트워크 시뮬레이션) (2일)
```

### EPIC-D: 에러 & 로깅
```
D-01: ErrorBoundary 라우트별 세분화 (2일)
D-02: Sentry 통합 (1일)
D-03: 재시도 로직 & 서킷브레이커 (2일)
D-04: 에러 로깅 정책 문서화 (1일)
```

### EPIC-E: 보안·컴플라이언스
```
E-01: 민감 데이터 암호화 (localstorage → encrypted) (2일)
E-02: 세션 타임아웃 & 2FA 훅 (2일)
E-03: 동의 이력 관리 (타임스탐프, 버전) (1.5일)
E-04: RBAC UI 가드 (1.5일)
E-05: 보안 검사 (정적 분석, 의존성 감시) (1.5일)
```

### EPIC-F: UX 필수
```
F-01: Disabled 탭 툴팁 (0.5일)
F-02: 로딩/빈상태/에러 일관화 (1.5일)
F-03: 모달 포커스/Escape (1.5일)
F-04: 마이크로인터랙션 성능 검사 (1일)
```

### EPIC-G: React Query
```
G-01: QueryClientProvider + 캐시 정책 (1.5일)
G-02: 기존 데이터 페칭 리팩토링 (5일)
G-03: WS + Query invalidation 동기화 (2일)
```

### EPIC-H: 세션 지속성
```
H-01: Auto-save 체크포인트 (IndexedDB) (3일)
H-02: 복구 프롬프트 UX (1.5일)
H-03: 타임아웃 정책 구현 (1.5일)
```

### EPIC-I: 성능·번들
```
I-01: 추가 코드 스플리팅 (1.5일)
I-02: 이미지/폰트 최적화 (2일)
I-03: RUM 수집 & 대시보드 (2일)
I-04: 성능 벤치마크 리포트 (1일)
```

### EPIC-J: 모니터링·분석
```
J-01: 이벤트 스키마 정의 (1.5일)
J-02: Tracker 구현 (2일)
J-03: 대시보드 구성 (3일)
J-04: 자동 리포트 생성 (1.5일)
```

---

## 5️⃣ 수용 기준 (샘플)

### 기능 (Functional)
- Given: [초기 상태], When: [액션], Then: [기대 결과]
- 3개 이상 시나리오 작성
- E2E 테스트 자동화

### 접근성 (Accessibility)
- ✅ 키보드 전체 탐색 가능
- ✅ 스크린리더 라벨 존재
- ✅ 색상 대비 4.5:1 이상
- ✅ WCAG 2.1 AA 체크리스트 95% 이상

### 회귀 (Regression)
- ✅ 기존 기능 스냅샷 테스트 유지
- ✅ 시각 회귀 검사

### 성능 (Performance)
- ✅ 변경 후 LCP 변동 ±5% 이내 (핵심 플로우)
- ✅ 번들 크기 증가 ≤10 kB

### 보안 (Security)
- ✅ 민감 데이터 평문 저장 금지 (정적 검사)
- ✅ XSS/CSRF 취약점 스캔 통과

### 로깅 (Logging)
- ✅ 사용자 영향 에러는 100% 캡처
- ✅ 스택 트레이스 수집

---

## 6️⃣ 위험·대응

| 위험 | 확률 | 영향 | 대응 |
|------|------|------|------|
| 라우팅 변경 → 딥링크 깨짐 | 높음 | 중간 | 301 리다이렉트 + 레거시 맵 제공 |
| 모달 큐 도입 → 예외 흐름 충돌 | 중간 | 높음 | 우선순위 예약 슬롯(0-5 레벨) |
| SoT 전환 → 기존 세션 미복구 | 중간 | 높음 | 마이그레이션 가드, v1→v2 변환 |
| WS 재연결 남용 → 서버 부하 | 중간 | 중간 | 백오프 상한 60s, 지터, 레이트 리밋 협의 |
| React Query 도입 → 캐시 일관성 | 낮음 | 중간 | 이벤트 드리븐 invalidation, 테스트 |

---

## 7️⃣ 품질 기준·지표

### KPI (Key Performance Indicators)

| 지표 | 현재 | 목표 | 측정 |
|------|------|------|------|
| **안정성** | | | |
| WS 재연결 성공률 | ❓ | ≥99% | Sentry + 로그 |
| 치명 에러율 | ❓ | <0.1%/세션 | Sentry |
| **성능** | | | |
| 초기 번들 (gzip) | 255 kB | ≤200 kB | webpack-bundle-analyzer |
| 모바일 LCP (3G) | ❓ | <3s | Lighthouse + RUM |
| **접근성** | | | |
| WCAG 2.1 AA | ❓ | ≥95% | axe 자동 스캔 |
| **사용성** | | | |
| Result 탭 혼동 문의 | ❓ | 50% 감소 | 피드백 분류 |
| **관측성** | | | |
| 핵심 이벤트 커버리지 | 0% | ≥90% | Analytics |

---

## 8️⃣ 릴리스 전략

### Git 워크플로우
```
main (보호: PR 필수)
├─ release/v1.0.0 (RC 배포)
└─ feat/* (기능 개발)
```

### 실험 플래그
- `/session/:id` 라우팅은 feature-flag로 점진 활성화
- Config: `ENABLE_URL_PARAMS=false` (기본)

### 롤아웃 단계
```
1. 내부 QA (1일)
2. 제한 사용자 5% (2일)
3. 제한 사용자 25% (2일)
4. 전체 롤아웃 (1일)
```

### 롤백
- Router/SoT/WS 변경은 토글 가능 구조 유지
- Sentry alert 즉시 롤백 자동화

---

## 9️⃣ 작업 캘린더 (월별)

### 🟦 Week 1-2 (11월5주~12월1주): M1 기초
```
A-01: StartSession 통일
A-02: History 버튼 (✅ 이미 완료)
A-04: ModalManager 큐 + FocusTrap
C-01: WS 공통 클라이언트
D-01: ErrorBoundary
F-01: Disabled 탭 툴팁
```

### 🟩 Week 3-4 (12월2주~1월1주): M1 마무리
```
A-05: IA 문서화
B-02: SessionContext 단일화
C-02/C-03: WS seq/dup + 상태표시
D-02: Sentry 통합
E-01/E-02: 암호화 + 타임아웃
I-01: 번들 분석
```

### 🟨 Week 5-8 (1월2주~2월4주): M2
```
G: React Query 도입 & 기존 데이터 리팩
J: 이벤트 스키마 + Tracker
H-01: Auto-save
예약/결제/프로필 제품 검증 (백엔드 협의)
```

### 🟪 Week 9-12 (3월~4월): M2 후기
```
B-01: /session/:id 실험 플래그
E-03/E-04: 동의이력 + RBAC
I-02/I-03: 이미지·폰트·RUM
예약/결제/프로필 프론트엔드 연동
```

### 🟧 Week 13-24 (5월~8월): M3
```
H-02/H-03: 복구 UX + 타임아웃 정책
보안 심화 (감사로그, 2FA, 침투테스트)
성능 지속 개선
리포트 내보내기 (선택)
A/B 테스트 인프라
```

---

## 🔟 즉시 실행 체크리스트 (1주차)

### 우선순위 1️⃣ (월~수)
- [ ] A-01: StartSession → navigate("/session") 명시화 (패치, 0.5일)
- [ ] A-04 뼈대: ModalManager FocusTrap 기본 구조 (1.5일)
- [ ] C-01: WS 공통 클라이언트 뼈대 (1.5일)
- [ ] D-01: ErrorBoundary 라우트별 세분화 (1.5일)

### 우선순위 2️⃣ (목~금)
- [ ] F-01: Result 탭 Disabled 툴팁 추가 (0.5일)
- [ ] D-02: Sentry 기본 설정 (1일)
- [ ] I-01: webpack-bundle-analyzer 보고서 생성 (0.5일)

### 산출물 (금요일)
- [ ] 번들 분석 보고서: `analysis/bundle-report-20251105.md`
- [ ] 우선순위 1 PR 제출 및 코드 리뷰
- [ ] 2주 차 작업 상세 계획 (스토리 분해)

---

## 📝 참고 자료

### 문서
- [PRODUCTION_READINESS_ANALYSIS_PROMPT.md](./PRODUCTION_READINESS_ANALYSIS_PROMPT.md) - 프롬프트 원본
- [251105.md](./251105.md) - 일일 진행 상황

### 외부 참조
- [React Query 공식 문서](https://tanstack.com/query)
- [Sentry 설정](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG 2.1 체크리스트](https://www.w3.org/WAI/test-evaluate/preliminary/)

---

**마지막 업데이트**: 2025-11-05
**담당자**: FrontEnd Team
**다음 검토**: 2025-11-12

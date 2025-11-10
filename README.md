# BeMore Frontend

> AI 기반 실시간 심리 상담 시스템
>
> MediaPipe 얼굴 감정 인식과 Gemini AI를 활용한 24시간 심리 상담 서비스

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)](https://vitejs.dev/)

---

## 📸 데모 & 스크린샷

> 스크린샷 추가 예정

## 🎯 핵심 가치

- **실시간 감정 분석**: MediaPipe Face Mesh 기반 468개 얼굴 랜드마크 추적
- **AI 음성 상담**: Gemini AI 기반 음성 대화 + TTS 자동 재생
- **자동 대화 흐름**: 사용자 음성 → STT → AI 응답 → TTS 완전 자동화
- **접근성 우선**: WCAG AAA (7:1) 색상 대비, axe-core 통합
- **오프라인 지원**: PWA + Service Worker (Cache-first 전략)
- **성능 최적화**: 코드 분할, 이미지 압축, 프레임 샘플링 (15fps → 5fps)

---

## 🚀 빠른 시작

### Prerequisites

- **Node.js**: >=18.0.0
- **npm**: >=9.0.0
- **권한**: 카메라 + 마이크 접근 권한

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
```

### 개발 서버

```bash
# 프론트엔드 개발 서버 실행
npm run dev
# → http://localhost:5173

# 백엔드 서버 (별도 터미널)
# cd ../BeMoreBackend && npm run dev
# → http://localhost:8000
```

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 🔧 환경 변수

`.env.example` 파일을 복사하여 `.env` 생성:

```bash
# Environment Stage
VITE_STAGE=dev

# Backend API URL (Phase 9)
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000

# WebSocket URL (Phase 9)
VITE_WS_URL=ws://localhost:8000

# Logging Level
VITE_LOG_LEVEL=info

# Feature Flags
VITE_ENABLE_MOCK_STT=false
VITE_ENABLE_MOCK_MEDIAPIPE=false
```

**⚠️ 보안**: `.env` 파일은 절대 커밋하지 마세요. `.gitignore`에 포함되어 있습니다.

---

## 📦 기술 스택

### 핵심 프레임워크

| 라이브러리 | 버전 | 용도 |
|----------|------|------|
| [React](https://react.dev/) | 19.1.1 | UI 프레임워크 |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3 | 타입 안전성 |
| [Vite](https://vitejs.dev/) | 5.4.21 | 빌드 도구 (HMR, 번들링) |
| [React Router](https://reactrouter.com/) | 6.30.1 | 클라이언트 사이드 라우팅 |

### 상태 관리 & HTTP

| 라이브러리 | 버전 | 용도 |
|----------|------|------|
| [Zustand](https://zustand-demo.pmnd.rs/) | 5.0.8 | 전역 상태 관리 |
| [Axios](https://axios-http.com/) | 1.12.2 | HTTP 클라이언트 |
| Native WebSocket | - | 실시간 양방향 통신 |

### UI & 스타일링

| 라이브러리 | 버전 | 용도 |
|----------|------|------|
| [Tailwind CSS](https://tailwindcss.com/) | 3.4.18 | 유틸리티 CSS 프레임워크 |
| [React Hot Toast](https://react-hot-toast.com/) | 2.6.0 | 토스트 알림 |

### 폼 & 검증

| 라이브러리 | 버전 | 용도 |
|----------|------|------|
| [React Hook Form](https://react-hook-form.com/) | 7.65.0 | 폼 상태 관리 |
| [Zod](https://zod.dev/) | 4.1.12 | 스키마 검증 |

### AI & 미디어

| 라이브러리 | 버전 | 용도 |
|----------|------|------|
| [@mediapipe/face_mesh](https://developers.google.com/mediapipe/solutions/vision/face_landmarker) | 0.4.1633559619 | 얼굴 랜드마크 추적 (468점) |
| [@mediapipe/camera_utils](https://developers.google.com/mediapipe) | 0.3.1675466862 | 카메라 유틸리티 |
| Web Speech API | - | 음성 인식 (STT) & 음성 합성 (TTS) |

### 모니터링 & 접근성

| 라이브러리 | 버전 | 용도 |
|----------|------|------|
| [@sentry/browser](https://docs.sentry.io/platforms/javascript/) | 7.120.0 | 에러 추적 & 성능 모니터링 |
| [@axe-core/react](https://github.com/dequelabs/axe-core-npm) | 4.9.1 | 접근성 자동 검증 |

---

## ✨ 주요 기능

### 구현 완료 ✅

- [x] **실시간 얼굴 감정 인식**: MediaPipe Face Mesh 468개 랜드마크
- [x] **음성 활동 감지 (VAD)**: 실시간 음성 분석 및 시각화
- [x] **실시간 자막 (STT)**: 음성-텍스트 변환
- [x] **AI 음성 상담**: 자동 대화 흐름 (음성 입력 → AI 응답 → TTS 재생)
- [x] **감정 기반 AI 응답**: 현재 감정 상태를 고려한 맥락 인식 상담
- [x] **AI 응답 스트리밍**: 실시간 청크 단위 응답 표시
- [x] **세션 타임라인 차트**: 감정/VAD 데이터 시각화
- [x] **PWA 오프라인 지원**: Service Worker v1.2.0
- [x] **다크 모드**: class-based 테마 전환
- [x] **키보드 내비게이션**: 전체 UI 키보드 접근 가능
- [x] **배치 API 최적화**: 60x 요청 감소 (1/min vs 1/sec)

### 계획 중 📋

- [ ] **다국어 지원 (i18n)**: 기본 구조 존재, 리소스 추가 필요
- [ ] **세션 히스토리**: 과거 상담 내역 조회
- [ ] **사용자 설정 동기화**: 계정별 설정 저장

---

## 📁 프로젝트 구조

```
src/
├── components/           # UI 컴포넌트
│   ├── Common/          # Button, Card, ErrorBoundary, States 등
│   ├── Session/         # ActiveSessionView, SessionResult, SessionControls 등
│   ├── Charts/          # VADTimeline (차트 시각화)
│   ├── Emotion/         # EmotionCard, EmotionTimeline
│   ├── VAD/             # VADMonitor (음성 활동 감지)
│   ├── VideoFeed/       # VideoFeed (카메라 스트림)
│   ├── STT/             # STTSubtitle (실시간 자막)
│   ├── AIChat/          # AIChat (AI 대화 인터페이스)
│   ├── Onboarding/      # 온보딩 플로우 (권한 요청, 디바이스 테스트)
│   ├── Settings/        # 설정 패널 (계정, 알림, 개인화, 프라이버시)
│   └── ...
├── contexts/            # React Context (전역 상태)
│   ├── SessionContext.tsx      # 세션 관리
│   ├── ThemeContext.tsx        # 테마 (라이트/다크)
│   ├── I18nContext.tsx         # 국제화 (기본 구조)
│   ├── NetworkContext.tsx      # 네트워크 상태
│   ├── ToastContext.tsx        # 토스트 알림
│   ├── AccessibilityContext.tsx # 접근성 설정
│   └── ...
├── hooks/               # 커스텀 훅
│   ├── useSession.ts           # 세션 생명주기 관리
│   ├── useWebSocket.ts         # WebSocket 연결/재연결
│   ├── useMediaPipe.ts         # 얼굴 인식 (468 랜드마크)
│   ├── useVAD.ts               # 음성 활동 감지
│   ├── useEmotion.ts           # 감정 분석
│   └── ...
├── stores/              # Zustand 전역 스토어
│   ├── sessionStore.ts         # 세션 상태
│   ├── emotionStore.ts         # 감정 데이터
│   ├── vadStore.ts             # VAD 데이터
│   ├── metricsStore.ts         # 성능 메트릭
│   └── timelineStore.ts        # 타임라인 이벤트
├── services/            # API & WebSocket 클라이언트
│   ├── api.ts                  # REST API (Axios)
│   └── websocket.ts            # WebSocket Manager (재연결, 멀티채널)
├── utils/               # 유틸리티 함수
│   ├── a11y.ts                 # 접근성 헬퍼
│   ├── performance.ts          # 성능 최적화
│   ├── security.ts             # 보안 유틸리티
│   ├── vadUtils.ts             # VAD 데이터 변환
│   ├── imageCompression.ts    # 이미지 압축 (50-70% 감소)
│   ├── batchManager.ts         # 배치 API 관리
│   └── ...
├── types/               # TypeScript 타입 정의
│   ├── index.ts                # 공통 타입
│   └── session.ts              # 세션 타입
├── pages/               # 페이지 컴포넌트
│   ├── Home/Dashboard.tsx      # 대시보드
│   ├── History/History.tsx     # 세션 히스토리
│   └── Settings/SettingsPage.tsx # 설정 페이지
├── config/              # 설정
│   └── env.ts                  # 환경 변수 관리
└── workers/             # Web Worker
    └── landmarksWorker.ts      # 백그라운드 랜드마크 처리
```

**총 파일**: ~150개 TypeScript/TSX 파일

---

## 🧪 테스트 & 품질

### 스크립트

```bash
# TypeScript 타입 체크
npm run typecheck

# ESLint (린트)
npm run lint

# 유닛 테스트 (Vitest)
npm run test

# 유닛 테스트 워치 모드
npm run test:watch

# E2E 테스트 (Playwright)
npm run e2e

# E2E 테스트 UI 모드
npm run e2e:ui

# 빌드 + 번들 분석
npm run build:analyze
```

### 현재 품질 상태 (2025-11-11)

| 검증 항목 | 결과 | 상세 |
|----------|------|------|
| **TypeScript** | ✅ 0 errors | strict + **noUncheckedIndexedAccess** 활성화 |
| **ESLint** | ✅ 0 warnings | 모든 경고 수정 완료 (136 → 0) |
| **Build** | ✅ 성공 | 1.67초, 280KB 번들 |
| **Unit Tests** | ✅ 109 passed | 유틸리티 100% 커버리지 |

### 품질 도구

- **유닛 테스트**: [Vitest 2.1.4](https://vitest.dev/) + jsdom
- **E2E 테스트**: [Playwright 1.56.1](https://playwright.dev/) (Chromium)
- **타입 체크**: TypeScript 5.9.3 (strict mode)
- **린트**: ESLint 9.36.0 + typescript-eslint
- **포맷**: Prettier 설정 추가됨 (설치 필요: `npm install -D prettier`)
- **Pre-commit**: Husky 9.1.7 + lint-staged

---

## ♿ 접근성 & 국제화

### 접근성 (Accessibility)

- **WCAG AAA (7:1 대비)**: 모든 감정/시맨틱 컬러 (tailwind.config.js)
- **axe-core 통합**: 자동 접근성 검증
- **키보드 내비게이션**: 전체 UI 키보드 접근 가능
- **스크린 리더 최적화**: ARIA 라벨 및 역할 적용
- **다크 모드**: class-based 테마 전환

### 국제화 (i18n)

**상태**: ⚠️ 기본 구조 존재, 리소스 추가 필요

- `I18nContext.tsx` 파일 존재
- 번역 리소스 파일 위치 미확인
- 언어 토글 구현 여부 검증 필요

---

## 🚀 PWA & 오프라인

### Progressive Web App

- **매니페스트**: `public/manifest.json` (PWA 설정)
- **Service Worker**: v1.2.0 (`public/sw.js`)
- **아이콘**: 192x192, 512x512 (maskable)
- **테마 컬러**: #14b8a6 (primary teal)

### 캐시 전략

| 리소스 타입 | 전략 | 설명 |
|-----------|------|------|
| **HTML** | Network-first | 최신 버전 우선, 실패 시 캐시 |
| **정적 에셋** | Cache-first | JS, CSS, 폰트 캐싱 우선 |
| **이미지** | Cache-first | 50MB 제한, LRU 정책 |
| **JSON API** | Stale-While-Revalidate | 캐시 즉시 반환, 백그라운드 갱신 |

### 캐시 크기 제한

- **이미지**: 50MB
- **에셋**: 100MB
- **런타임**: 20MB

---

## 🔒 보안

- **Sentry 통합**: 에러 추적 및 성능 모니터링
- **환경 변수**: `.env` 파일 gitignore 포함
- **민감 데이터**: 로그에서 자동 제외
- **CSP (Content Security Policy)**: Vercel 배포 시 `vercel.json`에서 관리

---

## 📋 스크립트 일람

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (http://localhost:5173) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run typecheck` | TypeScript 타입 체크 |
| `npm run lint` | ESLint 실행 |
| `npm run test` | Vitest 유닛 테스트 (커버리지 포함) |
| `npm run test:watch` | Vitest 워치 모드 |
| `npm run e2e` | Playwright E2E 테스트 |
| `npm run e2e:ui` | Playwright UI 모드 |
| `npm run build:analyze` | 빌드 + 번들 분석 |

---

## 🤝 기여 가이드

### 커밋 컨벤션

```
<type>(<scope>): <subject>

[optional body]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**타입**:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 업데이트
- `chore`: 빌드/설정 변경
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `style`: 코드 스타일 (포맷팅)

### 브랜치 전략

- `main`: 프로덕션 배포 브랜치
- `feature/*`: 기능 개발 브랜치
- `fix/*`: 버그 수정 브랜치

### Pull Request

1. `main` 브랜치에서 작업 브랜치 생성
2. 변경사항 커밋 (커밋 컨벤션 준수)
3. PR 생성
4. CI 통과 확인 (typecheck, lint, test, e2e)
5. 리뷰 후 병합

---

## 📋 로드맵

### ✅ Phase 1-9: 완료 (2024년)

- [x] 프로젝트 초기 설정 (Vite + React + TypeScript)
- [x] 타입 시스템 (210줄 종합 타입 정의)
- [x] REST API 클라이언트 (Axios 기반)
- [x] WebSocket 서비스 (3채널 자동 재연결)
- [x] 커스텀 훅 (useSession, useWebSocket, useMediaPipe, useVAD, useEmotion)
- [x] Zustand 스토어 (session, emotion, vad, metrics, timeline)
- [x] UI 컴포넌트 (세션, 감정, VAD, 차트 등)
- [x] 백엔드 통합 (CORS, 프록시, 환경변수)
- [x] 배포 준비 (빌드 최적화)
- [x] 성능 최적화 (배치 API, 프레임 샘플링, 이미지 압축)

### 🚧 Phase 10: AI 음성 상담 & 품질 개선 (진행 중)

- [x] SUMMARY.md 생성
- [x] README.md 개편
- [x] Prettier 설정 추가
- [x] Node.js 버전 명시 (package.json engines)
- [x] **AI 음성 상담 구현**: 음성 입력 → AI 응답 자동화
- [x] **감정 기반 프롬프트**: 현재 감정을 AI 요청에 포함
- [x] **스트리밍 응답**: 실시간 AI 응답 표시 + TTS 재생
- [x] **백엔드 API 호환성 수정**: 필드명 일치 (message, chunk) + 8개 감정 지원 확인
- [x] **ESLint 경고 100% 수정**: 136 → 56 → 0 warnings
- [x] **TypeScript 타입 안전성 강화**: `noUncheckedIndexedAccess` 플래그 활성화 (67 → 0 errors)
- [ ] React Hooks 의존성 배열 수정
- [ ] 테스트 커버리지 목표 설정

### 📝 Phase 11: 접근성 & 국제화 (계획)

- [ ] axe-core 규칙 전체 적용 (핵심 화면 위반 0건)
- [ ] i18n 리소스 구조 정리 (최소 2개 언어)
- [ ] 키보드 단축키 도움말 모달
- [ ] 스크린 리더 최적화 검증

### 🔨 Phase 12: 테스트 & CI (계획)

- [ ] 유닛 테스트 커버리지 80% (유틸리티)
- [ ] 컴포넌트 테스트 커버리지 60%
- [ ] E2E 테스트 주요 플로우 (온보딩, 세션, 리포트)
- [ ] CI 워크플로우 최적화 (캐싱, 병렬 실행)

---

## 🤝 Frontend-Backend Integration

### Phase 9 완료 (2024년)

Phase 9 Frontend 구현이 완료되었으며, Backend와의 통합 문서가 준비되어 있습니다:

#### 📧 통합 문서

- **[Backend → Frontend 공식 전달 메시지](./docs/integration/BACKEND_TO_FRONTEND_HANDOFF.md)** (한글) - Backend Team 공식 전달서
- **[Quick Start Integration Guide](./docs/integration/QUICK_START_INTEGRATION.md)** - 5분 개요
- **[Compatibility Handoff](./docs/integration/FRONTEND_BACKEND_COMPATIBILITY_HANDOFF.md)** - Phase 9 완료 상태
- **[Detailed API Reference](./docs/integration/FRONTEND_BACKEND_API_COMPATIBILITY_DETAILED.md)** - 전체 API 스펙
- **[Implementation Compatibility Validation](./docs/integration/IMPLEMENTATION_COMPATIBILITY_VALIDATION.md)** - 호환성 검증 (100% 달성)

#### 🎙️ AI 음성 상담 통합 (Phase 10)

- **[AI Voice Counseling Backend Request](./BACKEND_AI_VOICE_REQUEST.md)** - AI 음성 상담 WebSocket 엔드포인트 스펙
- **[Backend Emotion Support Check](./BACKEND_EMOTION_CHECK.md)** - 백엔드 8개 감정 지원 범위 점검 (✅ 확인 완료)
- **[Analytics Endpoint Request](./BACKEND_ANALYTICS_ENDPOINT_REQUEST.md)** - 성능 모니터링 엔드포인트 스펙 (선택)
- **[Frontend Code Quality Update (2025-11-11)](./FRONTEND_CODE_QUALITY_UPDATE_2025_11_11.md)** - 코드 품질 개선 완료 보고서 (ESLint 0, TypeScript 0, 백엔드 영향 없음)

### Phase 9 성과

✅ **성능 최적화**:
- 배치 API: 60x 요청 감소 (1/min vs 1/sec)
- 프레임 샘플링: 67% CPU 부하 감소 (15fps → 5fps)
- 이미지 압축: 50-70% 파일 크기 감소
- 메모리 관리: LRU 캐시 + 누수 감지

✅ **테스팅**: 109개 유닛 테스트 통과 (유틸리티 100% 커버리지)  
✅ **빌드**: TypeScript 0 errors, ESLint 통과  
✅ **준비 완료**: 전체 통합 문서 제공

자세한 내용은 [Phase 9 Completion Report](./PHASE_9_COMPLETION_REPORT.md)를 참고하세요.

---

## 📚 참고 문서

### 공식 문서
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [MediaPipe Face Mesh](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [Tailwind CSS](https://tailwindcss.com/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

### 프로젝트 문서
- [SUMMARY.md](./SUMMARY.md) - 프로젝트 현황 요약 (2025-11-06)
- [Phase 9 Completion Report](./PHASE_9_COMPLETION_REPORT.md)
- [Backend Integration Docs](./docs/integration/)
- [Frontend Code Quality Update (2025-11-11)](./FRONTEND_CODE_QUALITY_UPDATE_2025_11_11.md) - ESLint/TypeScript 품질 개선 완료

---

## 📄 변경 기록

주요 마일스톤:

- **2024-11-05**: Phase 9 완료 (성능 최적화, Backend 통합 100%)
- **2024-10-24**: Phase 1-8 완료 (핵심 기능 구현)
- **2025-11-06**: SUMMARY.md 추가, README 개편, Prettier 설정
- **2025-01-10**: Phase 10 AI 음성 상담 구현 완료 (음성 대화 자동화, Backend API 호환성 수정, 8개 감정 지원 확인)
- **2025-11-11**: 코드 품질 100% 달성 (ESLint 0 warnings, TypeScript `noUncheckedIndexedAccess` 활성화, 13개 파일 타입 안전성 강화)

### 상세 변경 내역 (2025-11-11)

#### ESLint 경고 완전 제거
- **136 → 56 warnings**: Phase 1 (react-hooks, unused vars 수정)
- **56 → 0 warnings**: Phase 2 (any 타입 제거, 접근성 개선)
- **수정 범위**: 45개 파일 (components, hooks, utils, stores, contexts)

#### TypeScript 타입 안전성 강화
- **플래그 활성화**: `noUncheckedIndexedAccess: true` (tsconfig.app.json)
- **오류 수정**: 67 → 35 → 0 errors
- **수정 파일** (13개):
  - 컴포넌트: SessionHighlights, SessionResult, MicrophoneCheck, VideoFeed, MetricCard, NotificationSettings, FocusTrap
  - 훅: useEmotion
  - 스토어: timelineStore
  - 유틸리티: memoryOptimization, performanceReporting, security
  - 워커: landmarksWorker

#### 적용된 타입 안전 패턴
- **배열 요소 안전 접근**: 모든 배열 인덱싱에 undefined 체크 추가
- **Record 조회 보호**: nullish coalescing 연산자 활용
- **동적 객체 순회**: 타입 가드와 존재 확인 강화
- **첫/마지막 요소**: 배열 경계 안전성 확보

#### 빌드 검증
- **TypeScript**: ✅ 0 errors (strict + noUncheckedIndexedAccess)
- **ESLint**: ✅ 0 warnings
- **Build**: ✅ 1.67초, 280KB (gzip: 89KB)
- **백엔드 영향**: 0% (100% 프론트엔드 내부 로직)

자세한 변경 내역은 Git 커밋 로그를 참고하세요.

---

## 📜 라이선스

이 프로젝트의 라이선스는 확실하지 않습니다. 프로젝트 소유자에게 문의하세요.

---

## 📧 Contact

**프로젝트 관련 문의**: BeMore 팀

---

**작성 기준**:
- ✅ 사실 기반, package.json 및 실제 파일 구조 참고
- ⚠️ 불확실한 항목은 "확실하지 않음" 명시
- 모든 버전은 검증된 데이터 (2025-11-06)

# BeMore 프론트엔드

BeMore 멀티모달 감정 인식 및 상담 시스템의 React 기반 웹 클라이언트입니다. 얼굴 표정, 음성, 텍스트 입력을 캡처하여 실시간 감정 분석과 AI 기반 상담 세션을 제공합니다.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)](https://vitejs.dev/)

---

## 개요

BeMore 프론트엔드는 **React 19 + TypeScript** 기반 웹 애플리케이션으로:

- 멀티모달 세션 데이터 기록 (얼굴 랜드마크, 음성 활동, 음성 전사)
- MediaPipe Face Mesh를 사용한 실시간 감정 분석 (468개 랜드마크)
- 자동 대화 흐름을 갖춘 AI 음성 상담 제공 (STT → AI 응답 → TTS)
- 사용자 성찰을 위한 감정 타임라인 및 세션 요약 표시

백엔드와 REST API (인증, 세션 관리) 및 WebSocket (실시간 데이터 스트림)을 통해 통신합니다.

---

## 주요 화면 및 플로우

### 공개 라우트
- **랜딩 페이지** (`/`): 제품 소개, 로그인/회원가입 안내
- **로그인** (`/auth/login`): 이메일/비밀번호 인증
- **회원가입** (`/auth/signup`): 사용자 등록 폼

### 보호된 라우트 (인증된 사용자)
- **대시보드** (`/app`): 세션 개요, 빠른 시작 버튼
- **세션 기록** (`/app/session`): 활성 상담 세션을 위한 메인 UI
  - 얼굴 감정 인식이 포함된 실시간 카메라 피드
  - 실시간 음성 활동 감지(VAD) 시각화
  - 음성 전사를 표시하는 STT 실시간 자막
  - 감정 배지가 포함된 상담 응답을 보여주는 AI 메시지 오버레이
  - 세션 컨트롤 (시작, 일시정지, 종료)
- **히스토리** (`/app/history`): 과거 세션 목록 (UI 구현됨, 백엔드 연동 대기 중)
- **설정** (`/app/settings`): 사용자 설정 패널 (UI 구현됨, 일부 기능만 작동)

### 개발 전용
- **개발 도구** (`/dev-tools`): 시스템 상태 확인, API 테스트, 수동 검증 체크리스트

---

## 기능

### 구현 완료 ✅

**세션 기록 및 분석**:
- 실시간 얼굴 감정 인식 (MediaPipe Face Mesh, 468개 얼굴 랜드마크)
- 파형 시각화가 포함된 음성 활동 감지(VAD)
- 음성-텍스트 변환(STT) 실시간 자막 (Web Speech API)
- STT 시스템 안정성 개선 (타임아웃 5초, Web Speech API 폴백, AudioContext 생명주기 관리, AI 요청 디바운싱 500ms)
- AI 응답을 위한 텍스트-음성 변환(TTS)
- 8가지 감정 유형: 행복, 슬픔, 분노, 불안, 중립, 놀람, 혐오, 두려움
- 감정 타임라인 시각화

**AI 음성 상담**:
- 자동 대화 흐름: 사용자 음성 → STT → AI 응답 요청 → TTS 재생
- 감정 인식 AI 프롬프트 (현재 감정이 사용자 메시지와 함께 전송됨)
- 실시간 표시가 포함된 스트리밍 AI 응답
- 감정 배지가 포함된 채팅 메시지용 비디오 오버레이 UI
- 사용자 친화적 오류 처리 (세션 만료, 네트워크 문제)

**CBT 분석 UI**:
- 인지 왜곡 감지 결과 표시 (9가지 왜곡 유형 지원)
- 심각도별 색상 코딩 (낮음=노랑, 중간=주황, 높음=빨강)
- 신뢰도 점수 및 예시 문구 표시
- CBT 개입 권장 패널 (긴급도별 스타일링)
- 생각해볼 질문 및 권장 활동 카드
- 다크모드 및 반응형 디자인 지원
- 세션 결과 페이지에서 조건부 렌더링

**통신**:
- WebSocket 3채널 통신 (landmarks, voice, session control)
- 인증 및 세션 관리를 위한 REST API
- 지수 백오프를 사용한 자동 재연결
- 백엔드 콜드 스타트 방지를 위한 Keep-alive ping

**품질 및 접근성**:
- Service Worker v1.2.0을 사용한 PWA 지원 (오프라인 캐싱)
- 다크 모드 (클래스 기반 테마 전환)
- WCAG AAA 색상 대비 (7:1 비율)
- 키보드 내비게이션 지원
- axe-core 접근성 검증 (개발 모드)
- 카메라/마이크 권한 요청이 포함된 온보딩 플로우

**테스트 및 CI/CD**:
- Playwright를 사용한 E2E 테스트 (5단계 세션 플로우 자동화)
- GitHub Actions CI/CD 파이프라인 (push/PR 시 자동 테스트)
- Vitest를 사용한 유닛 테스트 (유틸리티 100% 커버리지)
- TypeScript strict mode + `noUncheckedIndexedAccess`
- ESLint 경고 0개

### 부분 구현 ⚠️

- **히스토리 페이지**: UI 컴포넌트 존재, 백엔드 연동 미완성
- **설정 페이지**: UI 패널 존재, 일부 기능은 백엔드 동기화 필요
- **다국어 지원(i18n)**: Context 구조 존재, 번역 리소스 최소화

### 계획 중 📋

- 완전한 다국어 지원 (완전한 i18n 리소스 파일)
- 기기 간 사용자 설정 동기화
- 고급 데이터 시각화 (세션 인사이트, 트렌드 분석)
- 모바일 기기를 위한 향상된 반응형 디자인
- 향상된 스크린 리더 최적화

---

## 기술 스택

### 핵심 프레임워크
| 패키지 | 버전 | 용도 |
|---------|---------|---------|
| React | 19.1.1 | UI 라이브러리 |
| TypeScript | 5.9.3 | 타입 안정성 |
| Vite | 5.4.21 | HMR을 갖춘 빌드 도구 |
| React Router | 6.30.1 | 클라이언트 사이드 라우팅 |

### 상태 관리 및 HTTP
| 패키지 | 버전 | 용도 |
|---------|---------|---------|
| Zustand | 5.0.8 | 전역 상태 관리 |
| Axios | 1.12.2 | HTTP 클라이언트 |
| Native WebSocket | - | 실시간 양방향 통신 |

### UI 및 스타일링
| 패키지 | 버전 | 용도 |
|---------|---------|---------|
| Tailwind CSS | 3.4.18 | 유틸리티 우선 CSS 프레임워크 |
| React Hot Toast | 2.6.0 | 토스트 알림 |

### 폼 및 검증
| 패키지 | 버전 | 용도 |
|---------|---------|---------|
| React Hook Form | 7.65.0 | 폼 상태 관리 |
| Zod | 4.1.12 | 스키마 검증 |

### AI 및 미디어
| 패키지 | 버전 | 용도 |
|---------|---------|---------|
| @mediapipe/face_mesh | 0.4.1633559619 | 468포인트 얼굴 랜드마크 추적 |
| @mediapipe/camera_utils | 0.3.1675466862 | 카메라 유틸리티 |
| Web Speech API | - | STT (SpeechRecognition) & TTS (SpeechSynthesis) |

### 모니터링 및 접근성
| 패키지 | 버전 | 용도 |
|---------|---------|---------|
| @sentry/browser | 7.120.0 | 오류 추적 및 성능 모니터링 |
| @axe-core/react | 4.9.1 | 자동화된 접근성 테스트 |

### 테스트
| 패키지 | 버전 | 용도 |
|---------|---------|---------|
| Vitest | 2.1.4 | 유닛 테스트 프레임워크 |
| Playwright | 1.56.1 | E2E 테스트 (Chromium, headless) |

---

## 프로젝트 구조

```
src/
├── components/          # UI 컴포넌트
│   ├── AIChat/         # AI 메시지 오버레이, 음성 채팅 UI
│   ├── Auth/           # 로그인, 회원가입, 인증 가드
│   ├── Charts/         # VAD 타임라인, 감정 차트
│   ├── Common/         # 공통 컴포넌트 (버튼, 카드, 모달)
│   ├── Emotion/        # 감정 카드, 감정 타임라인
│   ├── Layout/         # 앱 레이아웃 래퍼
│   ├── Onboarding/     # 권한 요청, 장치 확인
│   ├── Session/        # 세션 컨트롤, 요약, 결과, CBT 분석
│   │   ├── SessionResult.tsx        # 세션 결과 메인 화면
│   │   ├── CBTAnalysisSection.tsx   # CBT 분석 메인 섹션
│   │   ├── CognitiveDistortionCard.tsx  # 인지 왜곡 카드
│   │   ├── InterventionPanel.tsx    # CBT 개입 패널
│   │   └── TaskCard.tsx             # 추천 활동 카드
│   ├── Settings/       # 설정 패널
│   ├── STT/            # 음성-텍스트 자막 표시
│   ├── VAD/            # 음성 활동 감지 모니터
│   └── VideoFeed/      # MediaPipe 오버레이가 있는 카메라 스트림
├── pages/              # 페이지 수준 컴포넌트
│   ├── Auth/           # LoginPage, SignupPage
│   ├── Home/           # Dashboard
│   ├── History/        # 세션 히스토리 목록
│   ├── Landing/        # 랜딩 페이지
│   ├── Settings/       # 설정 페이지
│   └── DevTools.tsx    # 개발 검증 대시보드
├── hooks/              # 커스텀 React 훅
│   ├── useSession.ts   # 세션 생명주기 관리
│   ├── useWebSocket.ts # WebSocket 연결 및 재연결
│   ├── useMediaPipe.ts # MediaPipe Face Mesh 통합
│   ├── useVAD.ts       # 음성 활동 감지
│   ├── useEmotion.ts   # 감정 분석
│   ├── useFallbackSTT.ts # Web Speech API 폴백 (브라우저 네이티브 음성 인식)
│   └── ...
├── contexts/           # React Context 프로바이더
│   ├── AuthContext.tsx         # 인증 상태
│   ├── SessionContext.tsx      # 세션 상태
│   ├── ThemeContext.tsx        # 라이트/다크 테마
│   ├── I18nContext.tsx         # 다국어 지원 (기본 구조)
│   ├── NetworkContext.tsx      # 네트워크 상태
│   ├── AccessibilityContext.tsx # 접근성 설정
│   └── ...
├── stores/             # Zustand 전역 스토어
│   ├── sessionStore.ts  # 세션 데이터
│   ├── emotionStore.ts  # 감정 히스토리
│   ├── vadStore.ts      # VAD 메트릭
│   └── ...
├── services/           # API 및 WebSocket 클라이언트
│   ├── api/            # 모듈화된 API 서비스
│   │   ├── auth.api.ts       # 로그인, 회원가입, 로그아웃
│   │   ├── session.api.ts    # 세션 시작/종료
│   │   ├── emotion.api.ts    # 감정 데이터 조회
│   │   └── ...
│   ├── shared/         # 공유 API 유틸리티 (apiClient, types)
│   └── websocket.ts    # WebSocket 매니저 (3채널)
├── utils/              # 유틸리티 함수
│   ├── a11y.ts         # 접근성 헬퍼
│   ├── performance.ts  # 성능 최적화
│   ├── security.ts     # 보안 유틸리티 (CSP, HTTPS)
│   ├── vadUtils.ts     # VAD 데이터 변환
│   ├── imageCompression.ts # 이미지 압축 (50-70% 크기 감소)
│   ├── analytics.ts    # 분석 추적
│   └── ...
├── types/              # TypeScript 타입 정의
│   ├── index.ts        # 공통 타입 (EmotionType, VADMetrics 등)
│   └── session.ts      # 세션 관련 타입
├── config/             # 설정
│   └── env.ts          # 환경 변수 관리
├── workers/            # Web Workers
│   └── landmarksWorker.ts # 백그라운드 랜드마크 처리
├── locales/            # i18n 번역 파일 (최소화)
└── assets/             # 정적 에셋 (이미지, 폰트)
```

**총 파일 수**: 약 150개 TypeScript/TSX 파일

---

## 설치 및 스크립트

### 사전 요구사항

- **Node.js**: >=18.0.0
- **npm**: >=9.0.0
- **브라우저 권한**: 카메라 + 마이크 접근 권한 필요

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd BeMoreFrontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 백엔드 URL로 편집
```

### 환경 변수

`.env.example`을 `.env`로 복사하고 설정:

```bash
# 개발 환경 (기본값)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# 프로덕션 (Render 백엔드)
VITE_API_URL=https://bemorebackend.onrender.com
VITE_WS_URL=wss://bemorebackend.onrender.com

# 로깅
VITE_LOG_LEVEL=info  # debug | info | warn | error

# 기능 플래그
VITE_ENABLE_MOCK_STT=false
VITE_ENABLE_MOCK_MEDIAPIPE=false
```

**참고**: `.env`는 gitignore에 포함되어 있습니다. 민감한 자격 증명을 커밋하지 마세요.

### 개발

```bash
# 개발 서버 시작 (http://localhost:5173)
npm run dev

# localhost:8000에서 백엔드와 함께 개발 서버 실행
# (백엔드는 별도로 실행되어야 함)
```

### 빌드 및 미리보기

```bash
# 타입 체크
npm run typecheck

# 린트
npm run lint

# 프로덕션 빌드
npm run build

# 프로덕션 빌드 미리보기
npm run preview

# 번들 분석과 함께 빌드
npm run build:analyze
```

### 테스트

```bash
# 유닛 테스트 (Vitest)
npm run test

# 유닛 테스트 워치 모드
npm run test:watch

# E2E 테스트 (Playwright)
npm run e2e

# E2E 테스트 UI 모드
npm run e2e:ui

# 세션 플로우 E2E 검증 (5단계)
npm run verify:session

# 전체 검증 (빌드 + E2E)
npm run verify:full

# CI 검증 (빌드 + 타입 체크 + 린트 + E2E)
npm run verify:ci
```

---

## 백엔드 연동

### 통신 프로토콜

**REST API** (Axios):
- 인증: `POST /api/auth/login`, `POST /api/auth/signup`
- 세션 관리: `POST /api/sessions/start`, `POST /api/sessions/end`
- 데이터 조회: `GET /api/sessions/:id`, `GET /api/emotions/:sessionId`

**WebSocket** (3채널):
1. **Landmarks 채널** (`/ws/landmarks`): 얼굴 랜드마크 데이터 → 백엔드 감정 분석
2. **Voice 채널** (`/ws/voice`): 오디오 스트림 → 백엔드 STT + VAD 분석
3. **Session 채널** (`/ws/session`): 제어 메시지 (시작, 일시정지, 종료, AI 요청)

### 연결 플로우

1. 사용자가 REST API를 통해 로그인 → 인증 토큰 수신
2. 사용자가 세션 시작 → REST API가 세션 생성 → `sessionId` 수신
3. 프론트엔드가 3개 WebSocket 연결 설정 (URL/헤더에 `sessionId` 포함)
4. 프론트엔드가 실시간 데이터 전송 (landmarks @ 5fps, 오디오 청크)
5. 백엔드가 분석 결과 전송 (감정, STT 텍스트, VAD 메트릭, AI 응답)
6. 사용자가 세션 종료 → 프론트엔드가 WebSocket 닫기 → REST API가 세션 마무리

### Base URL

환경 변수를 통해 설정:
- **개발**: `http://localhost:8000` (HTTP) + `ws://localhost:8000` (WebSocket)
- **프로덕션**: `https://bemorebackend.onrender.com` (HTTPS) + `wss://bemorebackend.onrender.com` (WebSocket)

프로덕션에서 프로토콜 업그레이드 자동 감지 (HTTP→HTTPS, WS→WSS).

---

## 제약사항 및 향후 작업

### 알려진 제약사항

**UI/UX**:
- 반응형 디자인 미완성 (데스크톱 우선, 모바일 레이아웃 개선 필요)
- 일부 모달/오버레이가 작은 화면에서 오버플로우될 수 있음
- 컴포넌트 간 로딩 상태 불일치

**기능**:
- 히스토리 페이지: UI 존재하지만 백엔드 연동 없음 (과거 세션 조회 불가)
- 설정 페이지: 일부 설정 (알림, 개인화)이 백엔드와 동기화되지 않음
- 오류 처리: 일부 엣지 케이스에서 일반적인 오류 메시지 표시
- 다국어 지원: 영어만 지원 (i18n 구조 존재, 리소스 미완성)

**접근성**:
- 스크린 리더 지원 테스트 및 최적화 필요
- 일부 인터랙티브 요소에 ARIA 라벨 누락
- 키보드 단축키가 완전히 문서화되지 않음

**성능**:
- 대용량 세션 데이터로 인한 메모리 압박 가능 (페이지네이션 미구현)
- 긴 목록에 대한 가상화 없음 (히스토리, 타임라인 이벤트)

### 계획된 개선사항

- [ ] 모바일 반응형 디자인 완성 (브레이크포인트, 터치 제스처)
- [ ] 히스토리 페이지 백엔드 연동 구현
- [ ] 다국어 지원 추가 (최소 한국어, 영어)
- [ ] 실행 가능한 가이드가 포함된 오류 메시지 개선
- [ ] 포괄적인 스크린 리더 테스트 추가
- [ ] 대용량 세션을 위한 데이터 페이지네이션 구현
- [ ] 고급 데이터 시각화 추가 (차트, 트렌드 분석)
- [ ] 페이지 새로고침 후 세션 재개
- [ ] 번들 크기 최적화 (코드 분할, 지연 로딩)

---

## 품질 상태

| 검사 항목 | 상태 | 세부사항 |
|-------|--------|---------|
| **TypeScript** | ✅ 0 오류 | Strict mode + `noUncheckedIndexedAccess` |
| **ESLint** | ✅ 0 경고 | 모든 경고 수정 완료 |
| **Build** | ✅ 성공 | 1.67초, 280KB 번들 (gzip: 89KB) |
| **Unit Tests** | ✅ 109개 통과 | 유틸리티 100% 커버리지 |
| **E2E Tests** | ✅ 통과 | 5단계 세션 플로우 검증 완료 |
| **CI/CD** | ✅ 활성화 | push/PR 시 GitHub Actions |

---

## 문서

### 프로젝트 문서
- **[SUMMARY.md](./SUMMARY.md)**: 프로젝트 상태 개요 (기술 스택, 품질 메트릭)
- **[VERIFICATION_SYSTEM.md](./VERIFICATION_SYSTEM.md)**: 테스트 및 검증 가이드
- **[docs/PHASE_12_E2E_COMPLETION.md](./docs/PHASE_12_E2E_COMPLETION.md)**: E2E 테스트 시스템 세부사항
- **[docs/CI_CD_QUICK_START.md](./docs/CI_CD_QUICK_START.md)**: CI/CD 파이프라인 설정 (10분)

### 백엔드 연동 문서
- **[BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)**: 백엔드 팀을 위한 상세 연동 가이드
- **[BACKEND_INTEGRATION_BRIEF.md](./BACKEND_INTEGRATION_BRIEF.md)**: 빠른 요약 (3분 소요)
- **[FRONTEND_VERIFICATION_CHECKLIST.md](./FRONTEND_VERIFICATION_CHECKLIST.md)**: 프론트엔드 검증 단계
- **[docs/integration/backend/BACKEND_STT_IMPROVEMENTS.md](./docs/integration/backend/BACKEND_STT_IMPROVEMENTS.md)**: STT 시스템 개선사항 기술 문서
- **[docs/integration/backend/BACKEND_HANDOFF_STT_IMPROVEMENTS.md](./docs/integration/backend/BACKEND_HANDOFF_STT_IMPROVEMENTS.md)**: STT 개선사항 백엔드 전달 문서

### UX/HCI 문서
- **[UX_HCI_IMPROVEMENT_GUIDELINES.md](./UX_HCI_IMPROVEMENT_GUIDELINES.md)**: UX 개선 가이드라인
- **[docs/UX_CHECKLIST.md](./docs/UX_CHECKLIST.md)**: 빠른 UX 체크리스트

### 외부 참고 자료
- [React 문서](https://react.dev/)
- [Vite 문서](https://vitejs.dev/)
- [MediaPipe Face Mesh](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 라이선스

이 프로젝트의 라이선스 상태는 불확실합니다. 라이선스 정보는 프로젝트 소유자에게 문의하세요.

---

## 문의

**프로젝트 팀**: BeMore Team

---

**최종 업데이트**: 2024-11-18
**기준**: 실제 구현 (React 19.1, TypeScript 5.9, Vite 5.4)
**정확도**: 모든 기능, 기술 스택, 스크립트는 소스 코드에서 검증됨

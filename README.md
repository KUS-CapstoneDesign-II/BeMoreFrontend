# BeMore Frontend

React + TypeScript + Vite 기반 BeMore 심리 상담 시스템 프론트엔드

## 🚀 Quick Start

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 📁 프로젝트 구조

```
src/
├── components/           # UI 컴포넌트
│   ├── Header/          # 헤더 컴포넌트
│   ├── Video/           # 비디오 관련 컴포넌트
│   ├── Emotion/         # 감정 분석 컴포넌트
│   ├── VAD/             # 음성 활동 감지 컴포넌트
│   ├── Session/         # 세션 관련 컴포넌트
│   └── Common/          # 공통 컴포넌트
├── hooks/               # 커스텀 훅
│   ├── useSession.ts    # 세션 관리 ✅
│   ├── useWebSocket.ts  # WebSocket 연결 ✅
│   ├── useMediaPipe.ts  # 얼굴 인식 ✅
│   ├── useVAD.ts        # 음성 활동 감지 ✅
│   └── useEmotion.ts    # 감정 분석 ✅
├── services/            # API & WebSocket 서비스
│   ├── api.ts           # REST API 클라이언트 ✅
│   └── websocket.ts     # WebSocket 매니저 ✅
├── stores/              # Zustand 스토어
│   ├── sessionStore.ts  # 세션 상태 ✅
│   ├── emotionStore.ts  # 감정 데이터 ✅
│   └── vadStore.ts      # VAD 데이터 ✅
├── types/               # TypeScript 타입
│   └── index.ts         # 타입 정의 ✅
└── utils/               # 유틸리티 함수
```

## 🛠️ 기술 스택

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API
- **Face Detection**: MediaPipe Face Mesh
- **Styling**: CSS Modules (예정)

## 📋 완료된 작업

### Phase 1: 프로젝트 초기 설정 ✅
- [x] Vite + React + TypeScript 프로젝트 생성
- [x] 필수 라이브러리 설치 (@mediapipe/face_mesh, axios, zustand)
- [x] 디렉토리 구조 생성

### Phase 2: 핵심 서비스 구현 ✅
- [x] TypeScript 타입 정의 (Session, Emotion, VAD, WebSocket)
- [x] REST API 클라이언트 (sessionAPI, sttAPI, monitoringAPI)
- [x] WebSocket 서비스 (ReconnectingWebSocket, WebSocketManager)

### Phase 3: 커스텀 훅 구현 ✅
- [x] useSession - 세션 관리 훅
- [x] useWebSocket - WebSocket 연결 훅
- [x] useMediaPipe - 얼굴 인식 훅
- [x] useVAD - 음성 활동 감지 훅
- [x] useEmotion - 감정 분석 훅

### Phase 3-B: 상태 관리 ✅
- [x] sessionStore - 세션 전역 상태
- [x] emotionStore - 감정 데이터 저장
- [x] vadStore - VAD 데이터 저장

## 📋 남은 작업

### Phase 4: UI 컴포넌트 (2시간)
- [ ] Header - 헤더 (세션 ID, 상태 표시)
- [ ] VideoFeed - 비디오 스트림 + 캔버스
- [ ] FaceMeshOverlay - 얼굴 랜드마크 그리기
- [ ] STTSubtitle - 실시간 자막
- [ ] EmotionCard - 감정 카드
- [ ] VADMonitor - VAD 분석 표시
- [ ] SessionControls - 제어 버튼
- [ ] SessionReport - 리포트 모달
- [ ] LoadingOverlay - 로딩 화면
- [ ] Toast - 알림

### Phase 5: 백엔드 연동 ✅
- [x] BeMoreBackend CORS 설정
- [x] Vite 프록시 설정 (vite.config.ts)
- [x] 환경 변수 설정 (.env)

### Phase 6: 배포 설정 ✅
- [x] Node.js 18 호환성 수정 (Vite 5.4.x)
- [x] Vercel 배포 설정
- [x] 배포 가이드 문서

### Phase 7: 스타일링 (예정)
- [ ] Tailwind CSS 설정
- [ ] 디자인 시스템 구현
- [ ] 반응형 레이아웃

### Phase 8: 테스트 및 디버깅 (예정)
- [ ] WebSocket 연결 테스트
- [ ] MediaPipe 얼굴 인식 테스트
- [ ] VAD + STT 통합 테스트
- [ ] 전체 플로우 테스트

## 🎉 Week 1 완료 현황

### ✅ 완료된 작업 (Day 1-5)
1. **프로젝트 초기 설정** - Vite + React + TypeScript
2. **타입 시스템** - 210줄의 종합 타입 정의
3. **REST API 클라이언트** - Axios 기반 API 래퍼
4. **WebSocket 서비스** - 3채널 자동 재연결
5. **커스텀 훅 4개** - useWebSocket, useMediaPipe, useVAD, useEmotion
6. **Zustand 스토어 3개** - session, emotion, vad
7. **백엔드 통합** - CORS, 프록시, 환경변수
8. **배포 준비** - Vercel 설정, 빌드 최적화

### 📊 통계
- **총 파일**: 13개 핵심 파일
- **총 코드**: ~1,300줄 (타입 안전 TypeScript)
- **빌드 시간**: 430ms
- **번들 크기**: 194KB (gzip: 60KB)

## 🔧 환경 변수

`.env` 파일 생성:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## 🚀 개발 서버 실행

```bash
# 백엔드 서버 (터미널 1)
cd BeMoreBackend
npm run dev

# 프론트엔드 서버 (터미널 2)
cd BeMoreFrontend
npm run dev
```

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:8000

## 📝 다음 작업 (Week 2)

### Phase 4: UI 컴포넌트 구현
1. **세션 페이지 코어**
   - VideoFeed - 카메라 스트림
   - FaceMeshOverlay - 468개 랜드마크 시각화
   - STTSubtitle - 실시간 자막 (유튜브 스타일)
   - EmotionCard - 감정 표시 카드
   - VADMonitor - 음성 활동 모니터
   - AIChat - AI 대화 + TTS
   - SessionControls - 일시정지/재개/종료

2. **페이지 라우팅**
   - React Router 설정
   - 온보딩 3단계 페이지
   - 세션 페이지
   - 리포트 페이지

3. **Tailwind CSS 스타일링**
   - 디자인 시스템 구축
   - 컴포넌트 스타일링
   - 반응형 레이아웃

## 📚 참고 문서

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [MediaPipe Face Mesh](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## 🎯 목표

현재 BeMoreBackend의 2,729줄 단일 HTML 파일을:
- **모듈화**: 재사용 가능한 컴포넌트로 분리
- **타입 안전성**: TypeScript로 타입 체크
- **상태 관리**: Zustand로 전역 상태 관리
- **개발 효율성**: HMR, 컴포넌트 기반 개발
- **유지보수성**: 명확한 구조와 책임 분리

## 📧 Contact

프로젝트 관련 문의: BeMore 팀

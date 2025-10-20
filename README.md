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
│   ├── useWebSocket.ts  # WebSocket 연결 (TODO)
│   ├── useMediaPipe.ts  # 얼굴 인식 (TODO)
│   ├── useVAD.ts        # 음성 활동 감지 (TODO)
│   └── useEmotion.ts    # 감정 분석 (TODO)
├── services/            # API & WebSocket 서비스
│   ├── api.ts           # REST API 클라이언트 ✅
│   └── websocket.ts     # WebSocket 매니저 ✅
├── stores/              # Zustand 스토어
│   ├── sessionStore.ts  # 세션 상태 (TODO)
│   ├── emotionStore.ts  # 감정 데이터 (TODO)
│   └── vadStore.ts      # VAD 데이터 (TODO)
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

### Phase 3: 커스텀 훅 구현 (진행 중)
- [x] useSession - 세션 관리 훅
- [ ] useWebSocket - WebSocket 연결 훅
- [ ] useMediaPipe - 얼굴 인식 훅
- [ ] useVAD - 음성 활동 감지 훅
- [ ] useEmotion - 감정 분석 훅

## 📋 남은 작업

### Phase 3: 커스텀 훅 완성 (1.5시간)
- [ ] useWebSocket - WebSocket 3개 채널 관리
- [ ] useMediaPipe - FaceMesh 초기화 및 랜드마크 추출
- [ ] useVAD - 음량 측정 및 STT 조건 판단
- [ ] useEmotion - 감정 업데이트 수신

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

### Phase 5: 상태 관리 (30분)
- [ ] sessionStore - 세션 전역 상태
- [ ] emotionStore - 감정 데이터 저장
- [ ] vadStore - VAD 데이터 저장

### Phase 6: 백엔드 연동 (30분)
- [ ] BeMoreBackend CORS 설정
- [ ] Vite 프록시 설정 (vite.config.ts)
- [ ] 환경 변수 설정 (.env)

### Phase 7: 스타일링 (1시간)
- [ ] CSS 모듈 또는 Tailwind CSS 설정
- [ ] 기존 디자인 시스템 마이그레이션
- [ ] 반응형 레이아웃

### Phase 8: 테스트 및 디버깅 (1시간)
- [ ] WebSocket 연결 테스트
- [ ] MediaPipe 얼굴 인식 테스트
- [ ] VAD + STT 통합 테스트
- [ ] 전체 플로우 테스트

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

## 📝 다음 세션 작업

1. **커스텀 훅 완성** (useWebSocket, useMediaPipe, useVAD, useEmotion)
2. **Zustand 스토어 구현**
3. **UI 컴포넌트 구현** (Header, VideoFeed, EmotionCard 등)
4. **백엔드 CORS 설정**
5. **통합 테스트**

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

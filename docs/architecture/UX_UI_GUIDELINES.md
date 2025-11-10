# BeMore Frontend UX/UI 개선 가이드라인

> **Version**: 1.0.0
> **Last Updated**: 2025-10-20
> **Target**: BeMore AI 심리 상담 시스템 프론트엔드

---

## 📑 목차

1. [개요](#1-개요)
2. [디자인 시스템](#2-디자인-시스템)
3. [컴포넌트별 개선안](#3-컴포넌트별-개선안)
4. [사용자 플로우](#4-사용자-플로우)
5. [접근성](#5-접근성)
6. [반응형 디자인](#6-반응형-디자인)
7. [마이크로 인터랙션](#7-마이크로-인터랙션)
8. [감정 디자인](#8-감정-디자인)
9. [성능 최적화 UX](#9-성능-최적화-ux)
10. [구현 우선순위](#10-구현-우선순위)

---

## 1. 개요

### 1.1 디자인 철학

BeMore는 **AI 기반 심리 상담 서비스**로서, 다음 핵심 가치를 UI/UX에 반영해야 합니다:

#### 🎯 핵심 가치
- **신뢰 (Trust)**: 전문적이고 안정적인 인상
- **편안함 (Comfort)**: 심리적 안전감을 주는 환경
- **공감 (Empathy)**: 사용자 감정을 이해하는 따뜻함
- **명확성 (Clarity)**: 직관적이고 이해하기 쉬운 인터페이스
- **프라이버시 (Privacy)**: 개인정보 보호에 대한 강조

#### 🎨 디자인 방향
- **미니멀리즘**: 불필요한 요소 제거, 핵심에 집중
- **부드러운 곡선**: 각진 디자인보다 부드러운 모서리 사용
- **자연스러운 애니메이션**: 차분하고 예측 가능한 모션
- **따뜻한 색상**: 차가운 블루 계열보다 따뜻한 톤 선호

### 1.2 타겟 사용자

#### 주요 타겟
- **연령대**: 20-40대 (MZ세대 직장인 중심)
- **기술 수준**: 중급 (스마트폰 사용에 익숙)
- **사용 환경**: 개인 공간 (집, 개인 사무실)
- **사용 시간**: 30분-1시간 세션

#### 사용자 니즈
- 심리적 안정감과 편안함
- 명확한 가이드와 피드백
- 프라이버시 보호
- 접근성 (장애인, 고령자 포함)

---

## 2. 디자인 시스템

### 2.1 색상 팔레트

#### 기본 색상 (Primary Colors)

```javascript
// tailwind.config.js
colors: {
  // 주 색상: 차분한 청록색 (신뢰감, 안정감)
  primary: {
    50: '#f0fdfa',   // 매우 밝음
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',  // 기본
    600: '#0d9488',  // 호버
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',  // 매우 어두움
  },

  // 보조 색상: 따뜻한 오렌지 (활력, 격려)
  secondary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',  // 기본
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
}
```

#### 감정별 색상 (현재 구현 개선)

```javascript
emotion: {
  // 긍정 감정: 따뜻한 톤
  happy: '#FCD34D',      // 노란색 → '#F59E0B' (앰버) 권장
  surprised: '#F59E0B',  // 주황색 유지

  // 중립 감정: 차분한 톤
  neutral: '#9CA3AF',    // 회색 유지

  // 부정 감정: 차분하면서 구분되는 톤
  sad: '#60A5FA',        // 파란색 유지
  anxious: '#A78BFA',    // 보라색 유지
  fearful: '#8B5CF6',    // 인디고 유지

  // 경고 감정: 눈에 띄지만 공격적이지 않게
  angry: '#EF4444',      // 빨간색 → '#F87171' (연한 빨강) 권장
  disgusted: '#10B981',  // 초록색 유지
}
```

#### 의미론적 색상 (Semantic Colors)

```javascript
semantic: {
  // 성공
  success: {
    light: '#D1FAE5',
    DEFAULT: '#10B981',
    dark: '#047857',
  },

  // 경고
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#F59E0B',
    dark: '#D97706',
  },

  // 오류
  error: {
    light: '#FEE2E2',
    DEFAULT: '#EF4444',
    dark: '#DC2626',
  },

  // 정보
  info: {
    light: '#DBEAFE',
    DEFAULT: '#3B82F6',
    dark: '#1D4ED8',
  },
}
```

#### 중립 색상 (Neutral Colors)

```javascript
// 기존 gray 대신 warm-gray 사용 (따뜻한 느낌)
neutral: {
  50: '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
}
```

### 2.2 타이포그래피

#### 폰트 패밀리

```css
/* 한글: Pretendard (가독성 우수, 친근함) */
/* 영문: Inter (현대적, 가독성) */
/* 코드: JetBrains Mono */

@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

:root {
  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
}
```

#### 타입 스케일

```javascript
// tailwind.config.js
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px - 캡션
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px - 부가 정보
  'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px - 본문
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px - 강조
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px - 소제목
  '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px - 제목
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px - 큰 제목
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px - 페이지 제목
}

// 사용 가이드
- 페이지 제목: text-3xl font-bold
- 섹션 제목: text-2xl font-semibold
- 카드 제목: text-lg font-semibold
- 본문: text-base
- 부가 정보: text-sm text-gray-600
- 캡션/라벨: text-xs text-gray-500
```

#### 폰트 웨이트

```javascript
fontWeight: {
  light: 300,     // 가벼운 텍스트 (거의 사용 안 함)
  normal: 400,    // 일반 본문
  medium: 500,    // 강조 텍스트
  semibold: 600,  // 제목, 버튼
  bold: 700,      // 중요 제목
  extrabold: 800, // 특별 강조 (거의 사용 안 함)
}
```

### 2.3 간격 시스템 (Spacing)

#### 8px 기반 그리드

```javascript
// Tailwind 기본 spacing 사용 (4px 단위)
// 심리 상담 UI는 여유로운 공간이 중요

spacing: {
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px  ← 최소 간격
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px ← 기본 간격
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px ← 섹션 간격
  8: '2rem',     // 32px ← 큰 섹션 간격
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px ← 페이지 간격
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
}

// 사용 가이드
- 컴포넌트 내부 패딩: p-4 (16px)
- 카드 사이 간격: space-y-4 또는 gap-4
- 섹션 사이 간격: space-y-6 또는 space-y-8
- 페이지 여백: px-4 py-6 (모바일), px-6 py-8 (데스크톱)
```

### 2.4 테두리 반경 (Border Radius)

```javascript
borderRadius: {
  'none': '0',
  'sm': '0.25rem',    // 4px - 작은 요소
  DEFAULT: '0.5rem',  // 8px - 기본 (버튼, 입력)
  'md': '0.75rem',    // 12px - 카드
  'lg': '1rem',       // 16px - 큰 카드
  'xl': '1.25rem',    // 20px - 특별한 요소
  '2xl': '1.5rem',    // 24px - 매우 큰 카드
  'full': '9999px',   // 완전한 원형
}

// 사용 가이드
- 버튼: rounded-lg (16px)
- 입력 필드: rounded-md (12px)
- 카드: rounded-xl (20px)
- 아바타/태그: rounded-full
```

### 2.5 그림자 (Shadows)

```javascript
boxShadow: {
  // 부드럽고 자연스러운 그림자 (심리 상담에 적합)
  'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

  // 커스텀 그림자 (따뜻한 느낌)
  'warm': '0 4px 12px rgba(251, 146, 60, 0.15)',      // 오렌지 계열
  'primary': '0 4px 12px rgba(20, 184, 166, 0.15)',  // 청록 계열
  'glow': '0 0 20px rgba(20, 184, 166, 0.3)',        // 발광 효과

  // 내부 그림자 (입력 필드)
  'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  'none': 'none',
}

// 사용 가이드
- 일반 카드: shadow-md
- 호버 효과: hover:shadow-lg
- 강조 요소: shadow-primary
- 입력 필드 포커스: shadow-inner + ring
```

### 2.6 애니메이션

#### 트랜지션 타이밍

```javascript
transitionDuration: {
  75: '75ms',     // 즉각적인 피드백
  100: '100ms',   // 빠른 피드백
  150: '150ms',   // 기본 피드백
  200: '200ms',   // 표준 전환
  300: '300ms',   // 부드러운 전환 (권장)
  500: '500ms',   // 느린 전환
  700: '700ms',   // 매우 느린 전환
  1000: '1000ms', // 특별한 효과
}

transitionTimingFunction: {
  'ease-soft': 'cubic-bezier(0.4, 0, 0.2, 1)',        // 기본
  'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // 탄성
  'ease-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',  // 부드러움
}

// 사용 가이드
- 버튼 호버: transition-all duration-200
- 모달 등장: transition-all duration-300 ease-smooth
- 페이드 인: transition-opacity duration-300
- 슬라이드: transition-transform duration-300
```

#### 애니메이션 원칙

1. **부드럽고 예측 가능해야 함**
   - 갑작스러운 움직임 X
   - 일관된 타이밍 함수 사용

2. **목적이 명확해야 함**
   - 장식용 애니메이션 최소화
   - 피드백, 전환, 주의 끌기에만 사용

3. **성능 고려**
   - transform, opacity 위주 사용
   - width, height 애니메이션 지양

4. **사용자 선택 존중**
   - `prefers-reduced-motion` 미디어 쿼리 지원

```css
/* prefers-reduced-motion 지원 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 3. 컴포넌트별 개선안

### 3.1 VideoFeed 컴포넌트

#### 현재 문제점
- 카메라 권한 요청 UX 부족
- 로딩 상태가 단조로움
- 에러 메시지가 기술적임
- MediaPipe 초기화 시간 동안 아무것도 안 보임

#### 개선안

##### 1) 카메라 권한 요청 플로우

```tsx
// 3단계 플로우: 안내 → 권한 요청 → 연결
enum CameraState {
  IDLE = 'idle',           // 초기 상태
  GUIDE = 'guide',         // 권한 안내
  REQUESTING = 'requesting', // 권한 요청 중
  CONNECTING = 'connecting', // 카메라 연결 중
  CONNECTED = 'connected',   // 연결 완료
  DENIED = 'denied',         // 권한 거부
  ERROR = 'error',           // 오류
}

// UI 개선
<div className="camera-permission-guide">
  <div className="icon-container">
    <CameraIcon className="w-16 h-16 text-primary-500" />
  </div>

  <h3 className="text-xl font-semibold mb-2">
    카메라 접근이 필요합니다
  </h3>

  <p className="text-gray-600 mb-6 text-center max-w-md">
    얼굴 표정 분석을 위해 카메라를 사용합니다.
    <br />
    촬영된 영상은 서버에 저장되지 않으며,
    <br />
    실시간 분석에만 사용됩니다.
  </p>

  <button
    onClick={requestCameraPermission}
    className="btn-primary"
  >
    카메라 켜기
  </button>

  <p className="text-xs text-gray-500 mt-4">
    🔒 개인정보는 안전하게 보호됩니다
  </p>
</div>
```

##### 2) 로딩 상태 개선

```tsx
// 프로그레시브 로딩 피드백
<div className="loading-container">
  {/* 단계별 로딩 표시 */}
  <div className="steps">
    <Step
      label="카메라 연결"
      status={cameraConnected ? 'completed' : 'loading'}
    />
    <Step
      label="얼굴 인식 초기화"
      status={mediaPipeReady ? 'completed' : 'pending'}
    />
    <Step
      label="분석 시작"
      status={isAnalyzing ? 'completed' : 'pending'}
    />
  </div>

  {/* 예상 시간 표시 */}
  <p className="text-sm text-gray-500 mt-4">
    약 {estimatedTime}초 소요됩니다...
  </p>

  {/* 스켈레톤 UI */}
  <div className="skeleton-video" />
</div>
```

##### 3) 에러 처리 개선

```tsx
// 사용자 친화적인 에러 메시지
const errorMessages = {
  'Permission denied': {
    title: '카메라 권한이 필요합니다',
    message: '브라우저 설정에서 카메라 권한을 허용해주세요.',
    action: '설정 방법 보기',
    icon: 'camera-off',
  },
  'Device not found': {
    title: '카메라를 찾을 수 없습니다',
    message: '카메라가 연결되어 있는지 확인해주세요.',
    action: '다시 시도',
    icon: 'alert',
  },
  'MediaPipe failed': {
    title: '얼굴 인식 초기화 실패',
    message: '페이지를 새로고침 후 다시 시도해주세요.',
    action: '새로고침',
    icon: 'refresh',
  },
};

<ErrorState
  {...errorMessages[errorType]}
  onAction={handleErrorAction}
/>
```

##### 4) 랜드마크 시각화 개선

```tsx
// 랜드마크 표시 토글
const [showLandmarks, setShowLandmarks] = useState(true);
const [landmarkOpacity, setLandmarkOpacity] = useState(0.7);

<div className="video-controls">
  <Toggle
    checked={showLandmarks}
    onChange={setShowLandmarks}
    label="랜드마크 표시"
  />

  {showLandmarks && (
    <Slider
      value={landmarkOpacity}
      onChange={setLandmarkOpacity}
      min={0.1}
      max={1}
      step={0.1}
      label="투명도"
    />
  )}
</div>

// 랜드마크 색상 개선 (초록색 → 청록색)
ctx.fillStyle = `rgba(20, 184, 166, ${landmarkOpacity})`;
ctx.strokeStyle = `rgba(20, 184, 166, ${landmarkOpacity * 0.8})`;
```

### 3.2 EmotionCard 컴포넌트

#### 현재 문제점
- 정적인 표시 (애니메이션 부족)
- 감정 변화 히스토리 없음
- 신뢰도만 표시, 추가 컨텍스트 부족

#### 개선안

##### 1) 감정 변화 애니메이션

```tsx
// 감정 변화 시 부드러운 전환
const [prevEmotion, setPrevEmotion] = useState<EmotionType | null>(null);

useEffect(() => {
  if (emotion !== prevEmotion && prevEmotion !== null) {
    // 변화 애니메이션 트리거
    setIsChanging(true);
    setTimeout(() => setIsChanging(false), 500);
  }
  setPrevEmotion(emotion);
}, [emotion]);

<div
  className={`
    emotion-card
    ${isChanging ? 'animate-emotion-change' : ''}
  `}
>
  {/* 이전 감정 → 현재 감정 크로스페이드 */}
</div>

// CSS
@keyframes emotion-change {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

##### 2) 감정 히스토리 미니 차트

```tsx
<div className="emotion-history mt-4">
  <p className="text-xs text-gray-500 mb-2">최근 감정 변화</p>

  <div className="history-dots flex gap-1">
    {recentEmotions.slice(-10).map((e, i) => (
      <div
        key={i}
        className={`
          w-2 h-2 rounded-full
          bg-emotion-${e.emotion}
          ${i === 9 ? 'ring-2 ring-offset-1 ring-primary-500' : ''}
        `}
        title={`${emotionLabels[e.emotion]} (${e.timestamp})`}
      />
    ))}
  </div>
</div>
```

##### 3) 감정 강도 시각화

```tsx
<div className="emotion-intensity">
  <div className="flex items-center justify-between mb-1">
    <span className="text-xs text-gray-600">감정 강도</span>
    <span className="text-xs font-medium">{Math.round(confidence * 100)}%</span>
  </div>

  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
    <div
      className={`
        absolute inset-y-0 left-0
        bg-gradient-to-r from-emotion-${emotion} to-emotion-${emotion}-dark
        transition-all duration-500
      `}
      style={{ width: `${confidence * 100}%` }}
    />
  </div>
</div>
```

##### 4) 컨텍스트 메시지

```tsx
// 감정에 따른 공감 메시지
const emotionContexts = {
  happy: '좋은 에너지가 느껴지네요! 😊',
  sad: '힘든 시간을 보내고 계시는군요. 천천히 이야기해주세요.',
  angry: '많이 화가 나셨나 봐요. 어떤 일이 있었는지 들어드릴게요.',
  anxious: '불안한 마음이 크신 것 같아요. 함께 천천히 풀어보아요.',
  neutral: '편안한 상태이시네요.',
  surprised: '놀라운 일이 있었나요?',
  fearful: '무서운 마음이 드시는군요. 안전한 공간입니다.',
  disgusted: '불편한 감정이 느껴지네요.',
};

<p className="text-sm text-gray-600 mt-2 italic">
  {emotionContexts[emotion]}
</p>
```

### 3.3 VADMonitor 컴포넌트

#### 현재 문제점
- 숫자 나열식 표시
- 시각화 부족
- 실시간 변화 표현 부족

#### 개선안

##### 1) 실시간 오디오 파형

```tsx
<div className="audio-waveform h-24 bg-gray-900 rounded-lg p-4">
  <canvas
    ref={waveformCanvasRef}
    className="w-full h-full"
  />
  {/* 실시간 오디오 레벨 시각화 */}
</div>
```

##### 2) 발화 타임라인

```tsx
<div className="speech-timeline">
  <div className="flex items-center gap-2 mb-2">
    <span className="text-xs text-gray-600">발화 패턴</span>
    <span className="text-xs text-gray-400">(최근 30초)</span>
  </div>

  <div className="timeline-bars flex gap-0.5 h-8">
    {last30Seconds.map((sample, i) => (
      <div
        key={i}
        className={`
          flex-1 rounded-sm transition-all
          ${sample.isSpeaking ? 'bg-blue-500' : 'bg-gray-300'}
        `}
        style={{ height: `${sample.volume * 100}%` }}
      />
    ))}
  </div>
</div>
```

##### 3) 원형 프로그레스 (발화/침묵 비율)

```tsx
<div className="circular-progress">
  <svg viewBox="0 0 100 100" className="w-32 h-32">
    {/* 배경 원 */}
    <circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="#e5e7eb"
      strokeWidth="10"
    />

    {/* 발화 비율 원 */}
    <circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="10"
      strokeDasharray={`${speechRatio * 283} 283`}
      strokeLinecap="round"
      transform="rotate(-90 50 50)"
      className="transition-all duration-500"
    />

    {/* 중앙 텍스트 */}
    <text
      x="50"
      y="50"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-2xl font-bold fill-gray-700"
    >
      {Math.round(speechRatio * 100)}%
    </text>
  </svg>

  <p className="text-center text-sm text-gray-600 mt-2">발화 비율</p>
</div>
```

##### 4) 건강 상태 인디케이터

```tsx
// VAD 메트릭 기반 발화 건강도 평가
const getSpeechHealth = (metrics: VADMetrics) => {
  const { speechRatio, averagePauseDuration, longestPause } = metrics;

  // 이상적인 범위
  const idealSpeechRatio = 0.5 - 0.7;  // 50-70%
  const idealPauseDuration = 1000 - 2000;  // 1-2초

  if (
    speechRatio >= 0.5 && speechRatio <= 0.7 &&
    averagePauseDuration >= 1000 && averagePauseDuration <= 2000 &&
    longestPause < 5000
  ) {
    return { status: 'good', label: '건강한 발화 패턴', color: 'green' };
  } else if (speechRatio < 0.3 || longestPause > 10000) {
    return { status: 'warning', label: '긴 침묵이 감지됨', color: 'yellow' };
  } else {
    return { status: 'normal', label: '정상 범위', color: 'blue' };
  }
};

<div className={`health-indicator bg-${health.color}-50 border border-${health.color}-200 p-3 rounded-lg`}>
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full bg-${health.color}-500 animate-pulse`} />
    <span className="text-sm font-medium text-gray-700">
      {health.label}
    </span>
  </div>
</div>
```

### 3.4 AIChat 컴포넌트

#### 현재 문제점
- 메시지만 나열, 시각적 구분 부족
- TTS 피드백 부족
- 대화 흐름 파악 어려움
- 타이핑 애니메이션 없음

#### 개선안

##### 1) 타이핑 인디케이터

```tsx
const [isAITyping, setIsAITyping] = useState(false);

{isAITyping && (
  <div className="flex justify-start mb-3">
    <div className="bg-gray-100 rounded-lg px-4 py-3">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
)}
```

##### 2) 메시지 타임스탬프 & 읽음 표시

```tsx
<div className="message-bubble">
  <p className="message-content">{message.content}</p>

  <div className="message-meta flex items-center gap-2 mt-1">
    <span className="text-xs text-gray-400">
      {formatTime(message.timestamp)}
    </span>

    {message.role === 'user' && (
      <span className="text-xs text-blue-500">
        {message.read ? '✓✓' : '✓'}
      </span>
    )}
  </div>
</div>
```

##### 3) TTS 시각적 피드백

```tsx
{isSpeaking && (
  <div className="tts-feedback fixed bottom-20 left-1/2 transform -translate-x-1/2">
    <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-primary-500 rounded-full animate-sound-wave"
            style={{
              animationDelay: `${i * 100}ms`,
              height: '20px',
            }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-700">AI가 말하고 있습니다...</span>
      <button
        onClick={stopSpeaking}
        className="text-red-500 hover:text-red-600"
      >
        <StopIcon className="w-4 h-4" />
      </button>
    </div>
  </div>
)}

@keyframes sound-wave {
  0%, 100% { height: 8px; }
  50% { height: 20px; }
}
```

##### 4) 대화 요약 & 주제 태그

```tsx
<div className="conversation-summary bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
  <p className="text-sm font-medium text-blue-900 mb-1">대화 주제</p>
  <div className="flex flex-wrap gap-2">
    {topics.map(topic => (
      <span
        key={topic}
        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
      >
        #{topic}
      </span>
    ))}
  </div>
</div>
```

##### 5) 제안 답변 (Quick Replies)

```tsx
<div className="quick-replies mt-3">
  <p className="text-xs text-gray-500 mb-2">빠른 답변</p>
  <div className="flex flex-wrap gap-2">
    {suggestedReplies.map(reply => (
      <button
        key={reply}
        onClick={() => sendMessage(reply)}
        className="
          px-3 py-1 bg-gray-100 hover:bg-gray-200
          text-sm text-gray-700 rounded-full
          transition-colors
        "
      >
        {reply}
      </button>
    ))}
  </div>
</div>
```

### 3.5 STTSubtitle 컴포넌트

#### 현재 문제점
- 가독성 낮음 (작은 폰트, 낮은 대비)
- 위치 고정 (비디오에 가려질 수 있음)
- 긴 텍스트 처리 부족

#### 개선안

##### 1) 가독성 개선

```tsx
<div
  className={`
    absolute bottom-20 left-1/2 transform -translate-x-1/2
    bg-black bg-opacity-90 text-white
    px-6 py-4 rounded-xl
    text-base md:text-lg font-medium leading-relaxed
    max-w-[90%] text-center
    backdrop-blur-sm
    shadow-2xl
    border border-white border-opacity-10
    ${isVisible ? 'opacity-100' : 'opacity-0'}
    transition-all duration-300 ease-soft
  `}
>
  {displayText}
</div>
```

##### 2) 긴 텍스트 자동 줄바꿈

```tsx
const formatSubtitle = (text: string, maxCharsPerLine: number = 50) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length > maxCharsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });

  if (currentLine) lines.push(currentLine.trim());

  return lines.map((line, i) => (
    <div key={i}>{line}</div>
  ));
};
```

##### 3) 위치 조정 옵션

```tsx
enum SubtitlePosition {
  TOP = 'top-20',
  MIDDLE = 'top-1/2 -translate-y-1/2',
  BOTTOM = 'bottom-20',
}

const [position, setPosition] = useState(SubtitlePosition.BOTTOM);

// 사용자 설정 가능
<select onChange={(e) => setPosition(e.target.value)}>
  <option value={SubtitlePosition.TOP}>상단</option>
  <option value={SubtitlePosition.MIDDLE}>중앙</option>
  <option value={SubtitlePosition.BOTTOM}>하단</option>
</select>
```

##### 4) 강조 단어 하이라이트

```tsx
// 감정 관련 키워드 강조
const emotionKeywords = ['행복', '슬픔', '화', '불안', '걱정', '기쁨'];

const highlightKeywords = (text: string) => {
  let highlighted = text;

  emotionKeywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlighted = highlighted.replace(
      regex,
      '<span class="text-yellow-300 font-semibold">$1</span>'
    );
  });

  return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
};
```

### 3.6 SessionControls 컴포넌트

#### 현재 문제점
- alert() 사용 (사용자 경험 나쁨)
- 확인 절차 없이 즉시 실행
- 상태 변화 피드백 부족

#### 개선안

##### 1) 확인 모달

```tsx
// 종료 시 확인 모달
const [showEndModal, setShowEndModal] = useState(false);

<Modal
  isOpen={showEndModal}
  onClose={() => setShowEndModal(false)}
  title="세션을 종료하시겠습니까?"
>
  <p className="text-gray-600 mb-6">
    현재까지의 대화 내용이 저장되며,
    <br />
    리포트를 확인하실 수 있습니다.
  </p>

  <div className="flex gap-3">
    <button
      onClick={() => setShowEndModal(false)}
      className="btn-secondary flex-1"
    >
      취소
    </button>
    <button
      onClick={handleEndSession}
      className="btn-primary flex-1"
    >
      종료하기
    </button>
  </div>
</Modal>
```

##### 2) 토스트 피드백

```tsx
// 액션 완료 시 토스트
const showToast = (message: string, type: 'success' | 'info' | 'error') => {
  toast({
    title: message,
    type,
    duration: 3000,
  });
};

// 사용
const handlePause = async () => {
  await onPause?.();
  showToast('세션이 일시정지되었습니다', 'info');
};
```

##### 3) 로딩 상태

```tsx
const [isLoading, setIsLoading] = useState(false);

<button
  onClick={handleAction}
  disabled={isLoading}
  className="btn-primary"
>
  {isLoading ? (
    <>
      <Spinner className="w-5 h-5 mr-2" />
      처리 중...
    </>
  ) : (
    <>
      <Icon className="w-5 h-5 mr-2" />
      액션
    </>
  )}
</button>
```

##### 4) 세션 시간 표시

```tsx
const [sessionDuration, setSessionDuration] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setSessionDuration(prev => prev + 1);
  }, 1000);

  return () => clearInterval(interval);
}, []);

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

<div className="session-timer">
  <ClockIcon className="w-4 h-4" />
  <span>{formatDuration(sessionDuration)}</span>
</div>
```

---

## 4. 사용자 플로우

### 4.1 온보딩 플로우

#### Step 1: 환영 & 소개

```tsx
<OnboardingIntro>
  <Logo className="w-20 h-20 mx-auto mb-6" />

  <h1 className="text-3xl font-bold text-gray-900 mb-3">
    BeMore에 오신 것을 환영합니다
  </h1>

  <p className="text-gray-600 mb-8 max-w-md mx-auto">
    AI 기반 심리 상담 서비스로 당신의 감정을 이해하고
    더 나은 마음 건강을 만들어가세요
  </p>

  <div className="features grid grid-cols-3 gap-4 mb-8">
    <Feature
      icon={<ShieldIcon />}
      label="안전한 대화"
    />
    <Feature
      icon={<ChartIcon />}
      label="감정 분석"
    />
    <Feature
      icon={<LockIcon />}
      label="개인정보 보호"
    />
  </div>

  <button className="btn-primary w-full max-w-sm">
    시작하기
  </button>
</OnboardingIntro>
```

#### Step 2: 권한 안내

```tsx
<OnboardingPermission>
  <h2 className="text-2xl font-bold mb-6">필요한 권한</h2>

  <div className="permissions space-y-4">
    <PermissionItem
      icon={<CameraIcon />}
      title="카메라"
      description="얼굴 표정 분석을 위해 사용됩니다"
      required={true}
      status={cameraPermission}
    />

    <PermissionItem
      icon={<MicrophoneIcon />}
      title="마이크"
      description="음성 대화를 위해 사용됩니다"
      required={true}
      status={micPermission}
    />
  </div>

  <div className="privacy-notice bg-blue-50 p-4 rounded-lg mt-6">
    <p className="text-sm text-blue-900">
      🔒 모든 데이터는 암호화되어 안전하게 처리되며,
      서버에 영구 저장되지 않습니다
    </p>
  </div>

  <button
    onClick={requestPermissions}
    className="btn-primary w-full mt-6"
  >
    권한 허용하기
  </button>
</OnboardingPermission>
```

#### Step 3: 사용 가이드

```tsx
<OnboardingGuide>
  <h2 className="text-2xl font-bold mb-6">사용 방법</h2>

  <div className="guides space-y-6">
    <GuideCard
      number="1"
      title="편안한 자세로 앉으세요"
      description="카메라가 얼굴을 잘 볼 수 있도록 조명이 밝은 곳에 앉아주세요"
      illustration={<SittingIllustration />}
    />

    <GuideCard
      number="2"
      title="자연스럽게 대화하세요"
      description="AI 상담사와 편안하게 대화하며 감정을 표현해주세요"
      illustration={<TalkingIllustration />}
    />

    <GuideCard
      number="3"
      title="리포트를 확인하세요"
      description="세션 종료 후 감정 분석 리포트를 확인할 수 있습니다"
      illustration={<ReportIllustration />}
    />
  </div>

  <button className="btn-primary w-full mt-8">
    상담 시작하기
  </button>
</OnboardingGuide>
```

### 4.2 세션 시작 플로우

```
1. 준비 화면
   ↓
2. 권한 확인 (카메라, 마이크)
   ↓
3. 디바이스 테스트
   ↓
4. 카운트다운 (3, 2, 1)
   ↓
5. 세션 시작
```

```tsx
<SessionPreparation>
  {/* 단계 1: 준비 중 */}
  {step === 'preparing' && (
    <div className="text-center">
      <Spinner className="w-12 h-12 mx-auto mb-4" />
      <p>세션을 준비하고 있습니다...</p>
    </div>
  )}

  {/* 단계 2: 디바이스 테스트 */}
  {step === 'testing' && (
    <DeviceTest
      onComplete={() => setStep('countdown')}
    />
  )}

  {/* 단계 3: 카운트다운 */}
  {step === 'countdown' && (
    <Countdown
      from={3}
      onComplete={() => startSession()}
    />
  )}
</SessionPreparation>
```

### 4.3 세션 종료 플로우

```
1. 종료 확인 모달
   ↓
2. 저장 중 표시
   ↓
3. 리포트 생성
   ↓
4. 리포트 페이지로 전환
```

```tsx
<SessionEnd>
  {/* 저장 중 */}
  {isSaving && (
    <div className="saving-overlay">
      <div className="bg-white rounded-xl p-8 text-center">
        <Spinner className="w-16 h-16 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          세션을 저장하고 있습니다
        </h3>
        <p className="text-gray-600">
          잠시만 기다려주세요...
        </p>

        <div className="progress-bar mt-4">
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )}

  {/* 저장 완료 */}
  {saved && (
    <div className="saved-success">
      <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">
        세션이 저장되었습니다
      </h3>
      <p className="text-gray-600 mb-6">
        리포트를 확인하시겠습니까?
      </p>

      <div className="flex gap-3">
        <button className="btn-secondary flex-1">
          나중에 보기
        </button>
        <button className="btn-primary flex-1">
          리포트 확인
        </button>
      </div>
    </div>
  )}
</SessionEnd>
```

---

## 5. 접근성 (Accessibility)

### 5.1 WCAG 2.1 AA 준수

#### 색상 대비

```javascript
// 최소 대비율: 4.5:1 (일반 텍스트), 3:1 (큰 텍스트)

// ✅ 좋은 예
text: '#1f2937' (gray-800) on background: '#ffffff' (white) → 대비율 16:1

// ❌ 나쁜 예
text: '#9ca3af' (gray-400) on background: '#ffffff' (white) → 대비율 2.8:1

// 대비율 검사 도구
// https://webaim.org/resources/contrastchecker/
```

#### 키보드 내비게이션

```tsx
// 모든 인터랙티브 요소는 Tab으로 접근 가능
<button
  className="btn-primary"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  클릭
</button>

// Focus 순서 명시
<div tabIndex={0}>  // 포커스 가능
<div tabIndex={-1}> // 프로그래매틱으로만 포커스
```

#### Focus Indicator

```css
/* 기본 포커스 스타일 개선 */
*:focus-visible {
  outline: 3px solid theme('colors.primary.500');
  outline-offset: 2px;
  border-radius: 4px;
}

/* 버튼 포커스 */
.btn:focus-visible {
  @apply ring-4 ring-primary-500 ring-opacity-50;
}

/* 입력 필드 포커스 */
input:focus-visible {
  @apply border-primary-500 ring-4 ring-primary-500 ring-opacity-25;
}
```

### 5.2 스크린 리더 지원

#### ARIA 레이블

```tsx
// 이미지/아이콘 버튼
<button aria-label="세션 종료">
  <XIcon className="w-5 h-5" />
</button>

// 상태 표시
<div role="status" aria-live="polite">
  {isLoading ? '로딩 중...' : '완료'}
</div>

// 진행 상황
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
>
  {progress}%
</div>

// 경고/에러
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

#### 시맨틱 HTML

```tsx
// ✅ 좋은 예
<header>...</header>
<main>...</main>
<nav>...</nav>
<article>...</article>
<section>...</section>
<footer>...</footer>

// ❌ 나쁜 예
<div className="header">...</div>
<div className="main">...</div>
```

#### 숨김 콘텐츠

```tsx
// 시각적으로 숨기되 스크린 리더는 읽음
<span className="sr-only">
  현재 감정: {emotion}
</span>

// CSS
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### 5.3 모션 감소 모드

```css
/* 사용자가 모션 감소를 선호하는 경우 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// React에서 감지
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

<div
  className={
    prefersReducedMotion
      ? 'transition-none'
      : 'transition-all duration-300'
  }
>
```

### 5.4 다크 모드 지원

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // 또는 'media'

  theme: {
    extend: {
      colors: {
        // 다크 모드 색상
        dark: {
          bg: '#1a1a1a',
          surface: '#2d2d2d',
          border: '#3d3d3d',
          text: {
            primary: '#e5e5e5',
            secondary: '#a3a3a3',
          }
        }
      }
    }
  }
}
```

```tsx
// 다크 모드 토글
const [darkMode, setDarkMode] = useState(false);

useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [darkMode]);

// 컴포넌트에서 사용
<div className="bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text-primary">
```

---

## 6. 반응형 디자인

### 6.1 브레이크포인트

```javascript
// Tailwind 기본 브레이크포인트
screens: {
  'sm': '640px',   // 모바일 (가로)
  'md': '768px',   // 태블릿
  'lg': '1024px',  // 데스크톱
  'xl': '1280px',  // 큰 데스크톱
  '2xl': '1536px', // 매우 큰 화면
}

// 사용 가이드
- 기본: 모바일 우선 (mobile-first)
- sm: 중간 크기 모바일
- md: 태블릿
- lg: 데스크톱 (주요 타겟)
- xl, 2xl: 큰 화면
```

### 6.2 레이아웃 패턴

#### 모바일 (< 768px)

```tsx
<div className="flex flex-col">
  {/* 비디오 피드 */}
  <div className="w-full">
    <VideoFeed />
  </div>

  {/* 탭으로 전환 가능한 사이드바 */}
  <Tabs>
    <Tab label="감정">
      <EmotionCard />
    </Tab>
    <Tab label="음성">
      <VADMonitor />
    </Tab>
    <Tab label="대화">
      <AIChat />
    </Tab>
  </Tabs>

  {/* 하단 고정 컨트롤 */}
  <div className="fixed bottom-0 left-0 right-0 bg-white p-4">
    <SessionControls />
  </div>
</div>
```

#### 태블릿 (768px - 1024px)

```tsx
<div className="grid grid-cols-2 gap-4">
  {/* 왼쪽: 비디오 */}
  <div className="col-span-2 lg:col-span-1">
    <VideoFeed />
    <AIChat />
  </div>

  {/* 오른쪽: 사이드바 */}
  <div className="col-span-2 lg:col-span-1">
    <EmotionCard />
    <VADMonitor />
    <SessionControls />
  </div>
</div>
```

#### 데스크톱 (>= 1024px)

```tsx
<div className="grid grid-cols-3 gap-6">
  {/* 왼쪽: 비디오 + 대화 (2/3) */}
  <div className="col-span-2 space-y-4">
    <VideoFeed />
    <AIChat />
    <SessionControls />
  </div>

  {/* 오른쪽: 사이드바 (1/3) */}
  <div className="col-span-1 space-y-4">
    <EmotionCard />
    <VADMonitor />
    <SystemStatus />
  </div>
</div>
```

### 6.3 터치 최적화

```css
/* 터치 타겟 최소 크기: 44x44px */
.btn {
  @apply min-h-[44px] min-w-[44px] px-4 py-2;
}

/* 터치 피드백 */
.btn:active {
  @apply transform scale-95;
}

/* 스와이프 제스처 */
.swipeable {
  touch-action: pan-x;
  user-select: none;
}
```

```tsx
// 스와이프 감지
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => nextTab(),
  onSwipedRight: () => prevTab(),
  trackMouse: true,
});

<div {...handlers}>
  {/* 스와이프 가능한 콘텐츠 */}
</div>
```

---

## 7. 마이크로 인터랙션

### 7.1 버튼 상태

```tsx
// Hover, Active, Focus, Disabled 상태
<button
  className="
    // 기본
    bg-primary-500 text-white px-4 py-2 rounded-lg
    transition-all duration-200

    // Hover
    hover:bg-primary-600 hover:shadow-lg hover:scale-105

    // Active (클릭)
    active:scale-95

    // Focus
    focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-opacity-50

    // Disabled
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  "
  disabled={isLoading}
>
  {isLoading ? '처리 중...' : '확인'}
</button>
```

### 7.2 로딩 상태

#### 스피너

```tsx
<svg
  className="animate-spin h-5 w-5 text-primary-500"
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
>
  <circle
    className="opacity-25"
    cx="12"
    cy="12"
    r="10"
    stroke="currentColor"
    strokeWidth="4"
  />
  <path
    className="opacity-75"
    fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
  />
</svg>
```

#### 스켈레톤

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
```

#### 프로그레스 바

```tsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className="bg-primary-500 h-2 rounded-full transition-all duration-500"
    style={{ width: `${progress}%` }}
  />
</div>
```

### 7.3 성공/에러 피드백

#### 체크마크 애니메이션

```tsx
<svg
  className="checkmark w-16 h-16 text-green-500"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 52 52"
>
  <circle
    className="checkmark-circle"
    cx="26"
    cy="26"
    r="25"
    fill="none"
  />
  <path
    className="checkmark-check"
    fill="none"
    d="M14 27l7 7 16-16"
  />
</svg>

<style>
  .checkmark-circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke: currentColor;
    stroke-width: 2;
    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .checkmark-check {
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
  }

  @keyframes stroke {
    to {
      stroke-dashoffset: 0;
    }
  }
</style>
```

#### 토스트 알림

```tsx
// Toast 컴포넌트
<div
  className={`
    fixed bottom-4 right-4
    bg-white shadow-xl rounded-lg p-4
    flex items-center gap-3
    transform transition-all duration-300
    ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
  `}
>
  {type === 'success' && <CheckCircleIcon className="w-6 h-6 text-green-500" />}
  {type === 'error' && <XCircleIcon className="w-6 h-6 text-red-500" />}
  {type === 'info' && <InfoIcon className="w-6 h-6 text-blue-500" />}

  <div>
    <p className="font-medium">{title}</p>
    {message && <p className="text-sm text-gray-600">{message}</p>}
  </div>

  <button
    onClick={onClose}
    className="ml-4 text-gray-400 hover:text-gray-600"
  >
    <XIcon className="w-5 h-5" />
  </button>
</div>
```

### 7.4 입력 피드백

```tsx
<input
  className="
    // 기본
    w-full px-4 py-2 border border-gray-300 rounded-lg
    transition-all duration-200

    // Focus
    focus:border-primary-500 focus:ring-4 focus:ring-primary-500 focus:ring-opacity-25

    // Error
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}

    // Success
    ${success ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}
  "
  onChange={handleChange}
/>

{/* 에러 메시지 */}
{error && (
  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
    <XCircleIcon className="w-4 h-4" />
    {error}
  </p>
)}

{/* 성공 메시지 */}
{success && (
  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
    <CheckCircleIcon className="w-4 h-4" />
    입력이 올바릅니다
  </p>
)}
```

---

## 8. 감정 디자인 (Emotional Design)

### 8.1 신뢰감 구축

#### 전문성 표현

```tsx
// 자격증/인증 표시
<div className="certification-badge">
  <ShieldCheckIcon className="w-5 h-5 text-blue-500" />
  <span className="text-sm text-gray-700">
    AI 윤리 가이드라인 준수
  </span>
</div>

// 통계 표시
<div className="stats grid grid-cols-3 gap-4">
  <Stat label="누적 상담" value="10,000+" />
  <Stat label="만족도" value="98%" />
  <Stat label="보안 등급" value="A+" />
</div>
```

#### 투명성

```tsx
// 데이터 처리 안내
<InfoBox>
  <h4>데이터는 어떻게 사용되나요?</h4>
  <ul>
    <li>✓ 실시간 감정 분석에만 사용</li>
    <li>✓ 세션 종료 후 즉시 삭제</li>
    <li>✓ 제3자 공유 절대 금지</li>
    <li>✓ 암호화된 연결 (HTTPS/WSS)</li>
  </ul>
</InfoBox>
```

### 8.2 편안함 제공

#### 따뜻한 메시지

```typescript
// 상황별 격려 메시지
const encouragementMessages = {
  sessionStart: [
    '편안하게 시작해볼까요? 😊',
    '오늘도 잘 이겨내고 계시네요',
    '이야기 들려주셔서 감사해요',
  ],
  longPause: [
    '천천히 생각하셔도 괜찮아요',
    '편안하게 말씀해주세요',
    '시간은 충분해요',
  ],
  emotionChange: {
    sadToHappy: '기분이 조금 나아지신 것 같아요! 💛',
    angryToNeutral: '마음이 차분해지고 계시네요',
  },
};
```

#### 부드러운 비주얼

```css
/* 부드러운 그라데이션 */
.warm-gradient {
  background: linear-gradient(
    135deg,
    rgba(251, 146, 60, 0.1) 0%,
    rgba(20, 184, 166, 0.1) 100%
  );
}

/* 부드러운 그림자 */
.soft-shadow {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}

/* 곡선 강조 */
.rounded-smooth {
  border-radius: 24px;
}
```

### 8.3 공감 표현

#### 감정 반영 UI

```tsx
// 감정에 따라 UI 색상 변경
const emotionTheme = {
  happy: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    accent: 'text-yellow-600',
  },
  sad: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'text-blue-600',
  },
  // ...
};

<div className={`${emotionTheme[emotion].bg} ${emotionTheme[emotion].border} border-2 p-4 rounded-lg`}>
  <p className={emotionTheme[emotion].accent}>
    {emotionContexts[emotion]}
  </p>
</div>
```

#### 개인화된 경험

```tsx
// 사용자 이름 사용
<p>안녕하세요, {userName}님 👋</p>

// 이전 세션 참조
<p>지난번에 말씀하신 {previousTopic}은 어떻게 되었나요?</p>

// 진행도 표시
<p>이번이 {sessionCount}번째 세션이네요! 꾸준히 참여해주셔서 감사해요 ✨</p>
```

### 8.4 프라이버시 강조

#### 보안 인디케이터

```tsx
<div className="security-indicator flex items-center gap-2 text-green-600">
  <LockIcon className="w-4 h-4" />
  <span className="text-sm font-medium">안전한 연결</span>
</div>

// 데이터 삭제 확인
<div className="data-deletion-notice bg-green-50 border border-green-200 p-3 rounded-lg">
  <p className="text-sm text-green-800">
    ✓ 이 세션의 영상 데이터는 5분 후 자동 삭제됩니다
  </p>
</div>
```

#### 개인정보 설정

```tsx
<PrivacySettings>
  <Toggle
    label="대화 기록 저장"
    description="다음 세션에서 참고하기 위해 대화 내용을 저장합니다"
    checked={saveTranscript}
    onChange={setSaveTranscript}
  />

  <Toggle
    label="감정 분석 데이터 저장"
    description="리포트 생성을 위해 감정 분석 결과를 저장합니다"
    checked={saveEmotionData}
    onChange={setSaveEmotionData}
  />
</PrivacySettings>
```

---

## 9. 성능 최적화 UX

### 9.1 지연 로딩

```tsx
// 컴포넌트 lazy loading
const AIChat = lazy(() => import('./components/AIChat'));
const VADMonitor = lazy(() => import('./components/VAD'));

<Suspense fallback={<Skeleton />}>
  <AIChat />
</Suspense>

// 이미지 lazy loading
<img
  src={imageSrc}
  loading="lazy"
  alt="..."
/>
```

### 9.2 낙관적 UI

```tsx
// 즉각적인 피드백, 백그라운드 처리
const handleLike = async () => {
  // 1. UI 즉시 업데이트
  setIsLiked(true);

  try {
    // 2. 서버 요청 (백그라운드)
    await api.like(messageId);
  } catch (error) {
    // 3. 실패 시 롤백
    setIsLiked(false);
    showError('좋아요 실패');
  }
};
```

### 9.3 ��프라인 지원

```tsx
// 온라인/오프라인 감지
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// 오프라인 배너
{!isOnline && (
  <div className="offline-banner bg-yellow-500 text-white p-2 text-center">
    ⚠️ 인터넷 연결이 끊겼습니다. 연결을 확인해주세요.
  </div>
)}
```

### 9.4 프로그레시브 로딩

```tsx
// 점진적 향상
<div className="progressive-content">
  {/* 1단계: 즉시 표시 */}
  <ContentPlaceholder />

  {/* 2단계: 기본 데이터 로드 */}
  {basicDataLoaded && <BasicContent />}

  {/* 3단계: 상세 데이터 로드 */}
  {detailedDataLoaded && <DetailedContent />}

  {/* 4단계: 추가 기능 */}
  {enhancedDataLoaded && <EnhancedFeatures />}
</div>
```

---

## 10. 구현 우선순위

### Phase 1: 긴급 (1-2주)

#### 필수 개선사항

1. **접근성 기본 준수**
   - [ ] 색상 대비 개선 (WCAG AA)
   - [ ] 키보드 내비게이션 지원
   - [ ] Focus indicator 개선
   - [ ] ARIA 레이블 추가

2. **에러 처리 개선**
   - [ ] 카메라/마이크 권한 에러 UX
   - [ ] 친절한 에러 메시지
   - [ ] 복구 액션 제공
   - [ ] 에러 로깅

3. **로딩 상태 개선**
   - [ ] 스켈레톤 UI
   - [ ] 프로그레스 인디케이터
   - [ ] 예상 시간 표시
   - [ ] 단계별 피드백

4. **모바일 반응형**
   - [ ] 터치 타겟 크기 44px
   - [ ] 스와이프 제스처
   - [ ] 모바일 레이아웃
   - [ ] 하단 고정 컨트롤

### Phase 2: 중요 (3-4주)

#### 사용자 경험 향상

1. **감정 디자인 적용**
   - [ ] 따뜻한 색상 팔레트
   - [ ] 격려 메시지
   - [ ] 감정 반영 UI
   - [ ] 공감 표현

2. **애니메이션 추가**
   - [ ] 부드러운 전환
   - [ ] 마이크로 인터랙션
   - [ ] 성공/에러 피드백
   - [ ] 로딩 애니메이션

3. **컴포넌트 개선**
   - [ ] VideoFeed 권한 플로우
   - [ ] EmotionCard 히스토리
   - [ ] VADMonitor 시각화
   - [ ] AIChat 타이핑 인디케이터

4. **온보딩 플로우**
   - [ ] 3단계 온보딩
   - [ ] 권한 안내
   - [ ] 사용 가이드
   - [ ] 디바이스 테스트

### Phase 3: 권장 (5-6주)

#### 고급 기능

1. **다크 모드**
   - [ ] 색상 시스템 확장
   - [ ] 자동/수동 전환
   - [ ] 시스템 설정 연동
   - [ ] 눈의 피로 감소

2. **성능 최적화**
   - [ ] Lazy loading
   - [ ] 이미지 최적화
   - [ ] 코드 스플리팅
   - [ ] 캐싱 전략

3. **고급 인터랙션**
   - [ ] 드래그 앤 드롭
   - [ ] 제스처 컨트롤
   - [ ] 단축키 지원
   - [ ] 음성 명령

4. **개인화**
   - [ ] 테마 커스터마이징
   - [ ] 폰트 크기 조절
   - [ ] 레이아웃 선호도
   - [ ] 언어 설정

### Phase 4: 선택 (장기)

#### 추가 개선

1. **고급 분석**
   - [ ] 사용자 행동 분석
   - [ ] A/B 테스트
   - [ ] 성능 모니터링
   - [ ] 에러 추적

2. **협업 기능**
   - [ ] 상담사 메모
   - [ ] 세션 공유
   - [ ] 리포트 내보내기
   - [ ] 캘린더 통합

3. **접근성 고급**
   - [ ] 음성 내비게이션
   - [ ] 고대비 모드
   - [ ] 텍스트 음성 변환
   - [ ] 자막 커스터마이징

4. **PWA 기능**
   - [ ] 오프라인 모드
   - [ ] 푸시 알림
   - [ ] 홈 화면 추가
   - [ ] 백그라운드 동기화

---

## 부록

### A. 체크리스트

#### 접근성 체크리스트

- [ ] 색상 대비 4.5:1 이상
- [ ] 키보드로 모든 기능 접근 가능
- [ ] Focus indicator 명확함
- [ ] ARIA 레이블 적절히 사용
- [ ] 시맨틱 HTML 사용
- [ ] 이미지 alt 텍스트 제공
- [ ] 폼 레이블 연결
- [ ] 에러 메시지 명확함
- [ ] 터치 타겟 44px 이상
- [ ] prefers-reduced-motion 지원

#### 성능 체크리스트

- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.8s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] 이미지 최적화 (WebP, lazy loading)
- [ ] 코드 스플리팅
- [ ] CSS/JS 압축
- [ ] 캐싱 전략
- [ ] CDN 사용

#### UX 체크리스트

- [ ] 로딩 상태 명확함
- [ ] 에러 복구 가능
- [ ] 성공 피드백 제공
- [ ] 진행 상황 표시
- [ ] 취소/되돌리기 가능
- [ ] 도움말 접근 쉬움
- [ ] 일관된 네이밍
- [ ] 예측 가능한 동작
- [ ] 단계별 안내
- [ ] 확인 절차

### B. 리소스

#### 디자인 도구
- [Figma](https://figma.com) - UI 디자인
- [ColorBox](https://colorbox.io) - 색상 팔레트
- [Type Scale](https://typescale.com) - 타이포그래피
- [Neumorphism](https://neumorphism.io) - 그림자 생성

#### 접근성 도구
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

#### 아이콘/일러스트
- [Heroicons](https://heroicons.com)
- [Lucide Icons](https://lucide.dev)
- [unDraw](https://undraw.co)
- [Storyset](https://storyset.com)

#### 애니메이션
- [Framer Motion](https://www.framer.com/motion/)
- [React Spring](https://react-spring.io)
- [Lottie](https://lottiefiles.com)

### C. 참고 문서

- [Material Design Guidelines](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inclusive Components](https://inclusive-components.design/)

---

**문서 끝**

> 이 가이드라인은 지속적으로 업데이트됩니다.
> 피드백 및 제안: [GitHub Issues](https://github.com/KUS-CapstoneDesign-II/BeMoreFrontend/issues)

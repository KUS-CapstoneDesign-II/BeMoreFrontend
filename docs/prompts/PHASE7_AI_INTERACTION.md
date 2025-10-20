# Phase 7: Real-time AI Interaction

## 🎯 목표

실제로 AI가 실시간으로 응답하고 감정 기반 피드백을 제공하는 완전한 상호작용 시스템 구현

---

## 📋 구현 체크리스트

### 1. Enhanced AIChat Component

**파일**: `src/components/AIChat/AIChat.tsx` (기존 파일 대폭 개선)

```typescript
// UI 레이아웃
┌─────────────────────────────────────┐
│ 🤖 AI 상담사  [•]                   │
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐   │
│ │ AI: 안녕하세요! 오늘 기분은... │   │
│ │     [좋아요] [북마크] [복사]   │   │
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │        User: 요즘 힘들어요    │   │
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ AI: ● ● ● (typing...)         │   │
│ └───────────────────────────────┘   │
│                                     │
│ [ Scroll to bottom ↓ ]             │
├─────────────────────────────────────┤
│ 💬 메시지를 입력하세요...  [📎] [🎤] │
└─────────────────────────────────────┘

// 기능
- 메시지 히스토리 (무한 스크롤)
- 타이핑 인디케이터
- 메시지 액션 (좋아요, 북마크, 복사)
- 자동 스크롤 (새 메시지)
- 음성 입력 (STT)
- 파일 첨부 (이미지)
- 메시지 삭제
```

---

### 2. Chat Message Component

**파일**: `src/components/AIChat/ChatMessage.tsx`

```typescript
interface ChatMessageProps {
  message: Message;
  isUser: boolean;
  onLike?: () => void;
  onBookmark?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
}

interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  emotion?: EmotionType;
  isLiked: boolean;
  isBookmarked: boolean;
  attachments?: Attachment[];
}

// UI 요구사항
┌─────────────────────────────────────┐
│ [Avatar] AI 상담사                   │
│                                     │
│ 오늘 기분이 어떠신가요?              │
│ 편하게 이야기해주세요.               │
│                                     │
│ 14:30  [❤️ 3] [🔖] [📋]             │
└─────────────────────────────────────┘

// 디자인
- User 메시지: 오른쪽 정렬, primary 색상
- AI 메시지: 왼쪽 정렬, gray 배경
- Timestamp: 메시지 하단
- Action buttons: Hover 시 표시
- Dark mode 지원
```

---

### 3. Typing Indicator Component

**파일**: `src/components/AIChat/TypingIndicator.tsx`

```typescript
// UI 요구사항
<div className="flex items-center space-x-2">
  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
</div>

// 기능
- AI가 응답 준비 중일 때 표시
- 애니메이션 (bouncing dots)
- 응답 도착 시 자동 제거
```

---

### 4. Message Actions Component

**파일**: `src/components/AIChat/MessageActions.tsx`

```typescript
// UI 요구사항
<div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
  <button onClick={onLike} aria-label="좋아요">
    {isLiked ? '❤️' : '🤍'}
  </button>
  <button onClick={onBookmark} aria-label="북마크">
    {isBookmarked ? '🔖' : '📑'}
  </button>
  <button onClick={onCopy} aria-label="복사">
    📋
  </button>
  {isUser && (
    <button onClick={onDelete} aria-label="삭제">
      🗑️
    </button>
  )}
</div>

// 기능
- 좋아요: 메시지에 좋아요 표시
- 북마크: 메시지 북마크 (나중에 보기)
- 복사: 메시지 내용 클립보드 복사
- 삭제: 사용자 메시지만 삭제 가능
```

---

### 5. Emotion Feedback System

**파일**: `src/components/Feedback/EmotionFeedback.tsx`

```typescript
// UI 레이아웃
┌─────────────────────────────────────┐
│ 💡 실시간 피드백                     │
├─────────────────────────────────────┤
│ 현재 감정: 😰 불안                   │
│                                     │
│ 불안감을 느끼시는군요. 괜찮아요.     │
│ 천천히 심호흡을 해보시겠어요?        │
│                                     │
│ [호흡 가이드 시작]                  │
└─────────────────────────────────────┘

// 감정별 피드백 메시지
const emotionFeedback: Record<EmotionType, {
  message: string;
  suggestion: string;
  action?: string;
}> = {
  happy: {
    message: '좋은 감정이 느껴지네요!',
    suggestion: '이 긍정적인 감정을 유지하세요.',
  },
  sad: {
    message: '슬픔을 느끼시는군요.',
    suggestion: '슬픔도 자연스러운 감정이에요. 천천히 이야기해주세요.',
  },
  anxious: {
    message: '불안감을 느끼시는군요.',
    suggestion: '천천히 심호흡을 해보시겠어요?',
    action: '호흡 가이드',
  },
  angry: {
    message: '화가 나셨나 봐요.',
    suggestion: '감정을 표현하는 것은 좋은 일이에요.',
  },
  // ... other emotions
};

// 기능
- 감정 변화 감지 (WebSocket emotion_update)
- 실시간 피드백 메시지 표시
- 감정별 맞춤 제안
- 액션 버튼 (호흡 가이드 등)
```

---

### 6. Breathing Guide Component

**파일**: `src/components/Feedback/BreathingGuide.tsx`

```typescript
// UI 레이아웃
┌─────────────────────────────────────┐
│ 🫁 호흡 가이드                       │
├─────────────────────────────────────┤
│      ╱╲                             │
│     ╱  ╲  들이마시기 (4초)          │
│    ╱    ╲                           │
│   ╱      ╲                          │
│  ╱________╲                         │
│            ╲                        │
│             ╲  내쉬기 (4초)         │
│              ╲                      │
│                                     │
│  [반복: 3/5]                        │
│                                     │
│  [시작]  [일시정지]  [종료]         │
└─────────────────────────────────────┘

// 호흡 패턴
const breathingCycle = {
  inhale: 4000,    // 4초 들이마시기
  hold: 2000,      // 2초 멈추기
  exhale: 4000,    // 4초 내쉬기
  rest: 2000,      // 2초 휴식
};

// 기능
- 애니메이션 원 (확대/축소)
- 음성 가이드 (선택 사항)
- 진행 상황 표시
- 일시정지/재개
- 완료 시 축하 메시지
```

---

### 7. CBT Suggestion Component

**파일**: `src/components/Feedback/CBTSuggestion.tsx`

```typescript
// CBT (Cognitive Behavioral Therapy) 기법
┌─────────────────────────────────────┐
│ 🧠 생각 점검                         │
├─────────────────────────────────────┤
│ 현재 생각: "나는 못해"              │
│                                     │
│ 이 생각을 검토해볼까요?              │
│                                     │
│ 1. 증거는 무엇인가요?                │
│    [ 입력란 ]                        │
│                                     │
│ 2. 반대 증거는 무엇인가요?           │
│    [ 입력란 ]                        │
│                                     │
│ 3. 더 현실적인 생각은?               │
│    [ 입력란 ]                        │
│                                     │
│ [저장]  [건너뛰기]                  │
└─────────────────────────────────────┘

// 기능
- 부정적 생각 감지
- CBT 워크시트 제공
- 답변 저장 (히스토리)
- 진행 상황 추적
```

---

### 8. Crisis Detection System

**파일**: `src/components/Safety/CrisisDetection.tsx`

```typescript
// 위기 상황 키워드
const crisisKeywords = [
  '자해', '자살', '죽고 싶다', '사라지고 싶다',
  // ... more keywords
];

// 위기 레벨
type CrisisLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

// UI (Critical 레벨)
┌─────────────────────────────────────┐
│ 🚨 긴급 상황 감지                    │
├─────────────────────────────────────┤
│ 지금 많이 힘드신 것 같아요.          │
│ 전문가의 도움이 필요할 수 있어요.    │
│                                     │
│ [자살예방 상담전화]                  │
│ ☎️ 1393 (24시간 무료)               │
│                                     │
│ [정신건강 위기상담]                  │
│ ☎️ 1577-0199                        │
│                                     │
│ [응급 상담 요청]                     │
│                                     │
│ "저는 괜찮아요" 버튼                 │
└─────────────────────────────────────┘

// 기능
- 키워드 감지 (실시간)
- 위기 레벨 평가
- 긴급 연락처 제공
- 전문가 연결 요청
- 로그 저장 (관리자용)
```

---

### 9. AI Chat Hook

**파일**: `src/hooks/useAIChat.ts`

```typescript
interface UseAIChatReturn {
  messages: Message[];
  isTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  likeMessage: (messageId: string) => Promise<void>;
  bookmarkMessage: (messageId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMore: boolean;
}

// 기능
- 메시지 전송 (WebSocket)
- 메시지 히스토리 로드 (REST API)
- 무한 스크롤
- 메시지 액션 (좋아요, 북마크, 삭제)
- 타이핑 상태 관리
```

---

### 10. API Service

**파일**: `src/services/aiAPI.ts`

```typescript
// API 엔드포인트
POST /api/chat/message
  Body: {
    sessionId: string,
    content: string,
    emotion?: EmotionType,
    attachments?: File[]
  }
  Response: {
    messageId: string,
    aiResponse: string,
    emotion: EmotionType
  }

GET /api/chat/messages/:sessionId
  Query: { page, limit, before }
  Response: {
    messages: Message[],
    hasMore: boolean
  }

POST /api/chat/message/:messageId/like
  Response: { isLiked: boolean }

POST /api/chat/message/:messageId/bookmark
  Response: { isBookmarked: boolean }

DELETE /api/chat/message/:messageId
  Response: { message: "삭제 성공" }

// WebSocket Events
client -> server: 'chat:message' { content, sessionId }
server -> client: 'chat:typing' { isTyping: boolean }
server -> client: 'chat:message' { message: Message }
server -> client: 'chat:emotion' { emotion: EmotionType, confidence: number }
```

---

## 🎨 디자인 가이드라인

### 메시지 버블
```css
/* User message */
.message-user {
  @apply bg-gradient-to-r from-primary-500 to-primary-600;
  @apply text-white rounded-2xl rounded-tr-sm;
  @apply p-3 max-w-[80%] ml-auto;
}

/* AI message */
.message-ai {
  @apply bg-gray-100 dark:bg-gray-800;
  @apply text-gray-900 dark:text-gray-100;
  @apply rounded-2xl rounded-tl-sm;
  @apply p-3 max-w-[80%] mr-auto;
}
```

### 애니메이션
- 메시지 등장: slide-in-up
- 타이핑: pulse dots
- 호흡 가이드: scale breathing circle

---

## 🧪 테스트 시나리오

### 1. 메시지 전송
1. 메시지 입력
2. 전송 버튼 클릭
3. 메시지 전송 확인
4. AI 응답 대기 (타이핑 인디케이터)
5. AI 응답 수신

### 2. 감정 피드백
1. 세션 중 감정 변화
2. 실시간 피드백 표시
3. 제안 액션 (호흡 가이드)
4. 호흡 가이드 실행

### 3. 위기 감지
1. 위기 키워드 입력
2. 위기 모달 표시
3. 긴급 연락처 제공
4. 관리자 알림

---

## 📦 필요한 Dependencies

```bash
npm install react-markdown       # 마크다운 렌더링
npm install framer-motion       # 애니메이션
npm install react-dropzone      # 파일 업로드
```

---

## ✅ 완료 기준

- [ ] 메시지 전송/수신 정상 작동
- [ ] 타이핑 인디케이터 표시
- [ ] 메시지 액션 (좋아요, 북마크, 복사, 삭제) 작동
- [ ] 무한 스크롤 정상 작동
- [ ] 실시간 감정 피드백 작동
- [ ] 호흡 가이드 애니메이션
- [ ] CBT 제안 시스템 작동
- [ ] 위기 감지 및 개입
- [ ] Dark mode 지원
- [ ] 모바일 반응형
- [ ] 접근성 (WCAG 2.1 AA)
- [ ] TypeScript 타입 안전
- [ ] Build 에러 없음

---

## 🚀 실행 명령어

```bash
# Phase 7 시작
"Phase 7 구현을 시작합니다. PHASE7_AI_INTERACTION.md의 모든 요구사항을 순서대로 구현해주세요."

# 완료 후
npm run build
npm run preview
```

---

## 📝 주의사항

1. **실시간성**
   - WebSocket 연결 안정성
   - 메시지 전송 실패 처리
   - 재연결 로직

2. **안전**
   - 위기 상황 감지 정확도
   - 긴급 연락처 최신 유지
   - 관리자 알림 시스템

3. **성능**
   - 메시지 가상 스크롤 (react-window)
   - 이미지 최적화
   - 메모리 누수 방지

4. **사용자 경험**
   - 로딩 상태 명확히
   - 에러 메시지 친화적
   - 오프라인 상태 안내

---

## 🎉 완료 시 다음 단계

Phase 7 완료 후 → **Phase 8: Settings & Final Polish** 진행

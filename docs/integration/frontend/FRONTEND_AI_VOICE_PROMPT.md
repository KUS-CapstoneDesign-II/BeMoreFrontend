# 🎤 AI 음성 상담 프론트엔드 통합 - Claude 실행 프롬프트

**작성일**: 2025-01-14
**대상**: Frontend 개발자 (React + TypeScript)
**백엔드 상태**: ✅ 100% 완료 (Gemini AI, WebSocket 스트리밍)
**사용 방법**: 아래 프롬프트를 Claude Code에 복사-붙여넣기

---

## 📋 복사하여 Claude Code에 붙여넣기

```
당신은 React + TypeScript 프론트엔드 개발자입니다. BeMore AI 심리 상담 시스템에 AI 음성 상담 UI를 통합해야 합니다.

## 프로젝트 컨텍스트

BeMore는 실시간 얼굴 감정 인식 + AI 음성 상담을 제공하는 웹 애플리케이션입니다.

**기술 스택**:
- Frontend: React 19.1 + TypeScript 5.9 + Vite 5.4
- State: React Context API
- Styling: Tailwind CSS + CSS Modules
- AI: Gemini 1.5 Pro (백엔드 처리)

**현재 상황**:
✅ 백엔드 AI 응답 기능 100% 완료
✅ WebSocket 연결 이미 설정됨 (`src/hooks/useWebSocket.ts`)
✅ 얼굴 감정 분석 작동 중 (`src/contexts/SessionContext.tsx`)
✅ 세션 관리 완료 (`src/contexts/SessionContext.tsx`)
❌ **AI 응답 UI만 추가 필요** ← 이 작업

**백엔드 동작 방식** (이미 구현됨):
1. 프론트엔드가 `request_ai_response` 메시지 전송
2. 백엔드가 Gemini API 호출 → 스트리밍 응답 생성
3. 응답을 실시간 청크로 전송 (`ai_stream_chunk`)
4. 프론트엔드가 텍스트 표시 + TTS 음성 재생

---

## 🎯 구현 목표

다음 파일들을 생성/수정해주세요:

### 1. 타입 정의 (`src/types/ai-chat.ts`) - 신규 생성
- 8개 감정 타입 정의
- WebSocket 메시지 타입
- ChatMessage 인터페이스

### 2. Custom Hook (`src/hooks/useAIVoiceChat.ts`) - 신규 생성
- WebSocket 메시지 수신/처리
- 스트리밍 응답 실시간 관리
- AI 요청 함수 제공
- TTS 콜백 지원

### 3. UI 컴포넌트 (`src/components/AIChat/AIVoiceChat.tsx`) - 신규 생성
- 대화 내역 표시 (사용자 + AI)
- 스트리밍 응답 타이핑 효과
- 메시지 입력 폼
- 에러 메시지 표시
- 현재 감정 표시

### 4. 스타일 (`src/components/AIChat/AIVoiceChat.css`) - 신규 생성
- Tailwind 기반 스타일링
- 스트리밍 애니메이션
- 반응형 디자인 (모바일 first)
- 다크모드 지원

### 5. App.tsx 통합 - 기존 파일 수정
- AIVoiceChat 컴포넌트 임포트
- 세션 상태와 연결
- WebSocket props 전달

---

## 📡 WebSocket API 스펙 (백엔드 완성)

### Endpoint
```typescript
// 기존 WebSocket 재사용
const { channels, sendToSession } = useWebSocket({
  sessionId,
  // ... 기존 handlers
});

// session 채널 사용
```

### Request (Frontend → Backend)

**메시지 타입**: `request_ai_response`

```typescript
interface AIRequestMessage {
  type: 'request_ai_response';
  data: {
    message: string;           // 사용자 메시지 (1~2000자)
    emotion: Emotion | null;   // 8개 감정 중 하나 또는 null
  };
}
```

**지원 감정 (8가지)**:
- `happy` (행복)
- `sad` (슬픔)
- `angry` (분노)
- `anxious` (불안)
- `neutral` (중립)
- `surprised` (놀람)
- `disgusted` (혐오)
- `fearful` (두려움)

**전송 예제**:
```typescript
sendToSession({
  type: 'request_ai_response',
  data: {
    message: '요즘 회사에서 스트레스를 많이 받아요',
    emotion: 'anxious'
  }
});
```

---

### Response (Backend → Frontend) - 3단계 스트리밍

#### ① 스트리밍 시작
```typescript
{
  type: 'ai_stream_begin',
  data: {}
}
```

**프론트엔드 처리**:
- 로딩 UI 표시
- 응답 버퍼 초기화
- 입력 폼 비활성화

#### ② 응답 청크 (여러 번 전송)
```typescript
{
  type: 'ai_stream_chunk',
  data: {
    chunk: string  // ⚠️ 필드명 "chunk" 필수 (text 아님!)
  }
}
```

**전송 빈도**: 평균 50-100ms 간격

**프론트엔드 처리**:
- 텍스트 누적 표시 (타이핑 효과)
- TTS 엔진에 청크 전달 (선택)
- 실시간 UI 업데이트

#### ③ 스트리밍 완료
```typescript
{
  type: 'ai_stream_complete',
  data: {}
}
```

**프론트엔드 처리**:
- 로딩 UI 숨김
- 최종 메시지 확정
- 입력 폼 재활성화

#### ④ 에러 처리
```typescript
{
  type: 'ai_stream_error',
  data: {
    error: string  // 에러 메시지 (한국어)
  }
}
```

**에러 유형**:
- "메시지가 비어있습니다"
- "메시지가 너무 깁니다 (최대 2000자)"
- "AI 응답 시간 초과"
- "AI 서비스가 일시적으로 사용할 수 없습니다"

---

## 🔧 완전한 구현 코드

### 1. 타입 정의 (`src/types/ai-chat.ts`)

```typescript
/**
 * AI 음성 상담 타입 정의
 */

// 감정 타입 (8가지)
export type Emotion =
  | 'happy'      // 행복
  | 'sad'        // 슬픔
  | 'angry'      // 분노
  | 'anxious'    // 불안
  | 'neutral'    // 중립
  | 'surprised'  // 놀람
  | 'disgusted'  // 혐오
  | 'fearful';   // 두려움

// 대화 메시지
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: Emotion;
  timestamp: number;
  isStreaming?: boolean;
}

// WebSocket 메시지 타입
export type WSAIMessage =
  | { type: 'request_ai_response'; data: { message: string; emotion: Emotion | null } }
  | { type: 'ai_stream_begin'; data: Record<string, never> }
  | { type: 'ai_stream_chunk'; data: { chunk: string } }
  | { type: 'ai_stream_complete'; data: Record<string, never> }
  | { type: 'ai_stream_error'; data: { error: string } };

// Hook Props
export interface UseAIVoiceChatProps {
  sessionId: string;
  onSessionMessage: (message: { type: string; data: unknown }) => void;
  sendToSession: (message: { type: string; data: unknown }) => void;
  onError?: (error: string) => void;
  onChunk?: (chunk: string) => void;
}

// Hook Return
export interface UseAIVoiceChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentResponse: string;
  requestAIResponse: (message: string, emotion: Emotion | null) => void;
  clearMessages: () => void;
}
```

---

### 2. Custom Hook (`src/hooks/useAIVoiceChat.ts`)

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ChatMessage,
  Emotion,
  UseAIVoiceChatProps,
  UseAIVoiceChatReturn
} from '../types/ai-chat';

/**
 * AI 음성 상담 Hook
 *
 * WebSocket을 통한 AI 응답 스트리밍 관리
 */
export function useAIVoiceChat({
  sessionId,
  sendToSession,
  onError,
  onChunk
}: UseAIVoiceChatProps): UseAIVoiceChatReturn {
  // 대화 내역
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 스트리밍 상태
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  // 현재 메시지 ID 추적
  const currentMessageIdRef = useRef<string>('');

  /**
   * WebSocket 메시지 수신 핸들러
   * App.tsx의 onSessionMessage에 등록
   */
  const handleSessionMessage = useCallback(
    (message: { type: string; data: unknown }) => {
      switch (message.type) {
        case 'ai_stream_begin': {
          // 스트리밍 시작
          setIsStreaming(true);
          setCurrentResponse('');
          currentMessageIdRef.current = `ai_${Date.now()}`;

          if (import.meta.env.DEV) {
            console.log('[AI Stream] Begin');
          }
          break;
        }

        case 'ai_stream_chunk': {
          // 청크 수신
          const data = message.data as { chunk?: string };
          const chunk = data.chunk || '';

          setCurrentResponse((prev) => prev + chunk);

          // TTS 연동 콜백
          if (onChunk) {
            onChunk(chunk);
          }

          if (import.meta.env.DEV) {
            console.log('[AI Stream] Chunk:', chunk);
          }
          break;
        }

        case 'ai_stream_complete': {
          // 스트리밍 완료
          setIsStreaming(false);

          // 최종 메시지 저장
          setMessages((prev) => [
            ...prev,
            {
              id: currentMessageIdRef.current,
              role: 'assistant',
              content: currentResponse,
              timestamp: Date.now()
            }
          ]);

          setCurrentResponse('');

          if (import.meta.env.DEV) {
            console.log('[AI Stream] Complete');
          }
          break;
        }

        case 'ai_stream_error': {
          // 에러 처리
          const data = message.data as { error?: string };
          const errorMessage = data.error || 'AI 응답 생성 중 오류가 발생했습니다';

          setIsStreaming(false);
          setCurrentResponse('');

          if (onError) {
            onError(errorMessage);
          }

          console.error('[AI Stream] Error:', errorMessage);
          break;
        }

        default:
          // 다른 메시지 타입 무시
          break;
      }
    },
    [currentResponse, onChunk, onError]
  );

  /**
   * AI 응답 요청
   */
  const requestAIResponse = useCallback(
    (userMessage: string, emotion: Emotion | null = null) => {
      // 입력 검증
      const trimmedMessage = userMessage.trim();

      if (!trimmedMessage) {
        if (onError) {
          onError('메시지를 입력해주세요');
        }
        return;
      }

      if (trimmedMessage.length > 2000) {
        if (onError) {
          onError('메시지가 너무 깁니다 (최대 2000자)');
        }
        return;
      }

      // 사용자 메시지 추가
      const userMsgId = `user_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          content: trimmedMessage,
          emotion: emotion || undefined,
          timestamp: Date.now()
        }
      ]);

      // AI 요청 전송
      sendToSession({
        type: 'request_ai_response',
        data: {
          message: trimmedMessage,
          emotion
        }
      });

      if (import.meta.env.DEV) {
        console.log('[AI Request]', { message: trimmedMessage, emotion });
      }
    },
    [sendToSession, onError]
  );

  /**
   * 대화 초기화
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentResponse('');
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    currentResponse,
    requestAIResponse,
    clearMessages,
    // handleSessionMessage를 외부에서 등록할 수 있도록 export
    handleSessionMessage
  };
}
```

---

### 3. UI 컴포넌트 (`src/components/AIChat/AIVoiceChat.tsx`)

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useAIVoiceChat } from '../../hooks/useAIVoiceChat';
import type { Emotion } from '../../types/ai-chat';
import './AIVoiceChat.css';

interface AIVoiceChatProps {
  sessionId: string;
  sendToSession: (message: { type: string; data: unknown }) => void;
  currentEmotion: Emotion | null;
  onSessionMessage: (message: { type: string; data: unknown }) => void;
}

export function AIVoiceChat({
  sessionId,
  sendToSession,
  currentEmotion,
  onSessionMessage
}: AIVoiceChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    currentResponse,
    requestAIResponse,
    clearMessages,
    handleSessionMessage
  } = useAIVoiceChat({
    sessionId,
    sendToSession,
    onError: setError,
    onChunk: undefined // TTS 연동 시 추가
  });

  // WebSocket 메시지 핸들러 등록
  useEffect(() => {
    onSessionMessage(handleSessionMessage);
  }, [onSessionMessage, handleSessionMessage]);

  // 자동 스크롤 (최신 메시지)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  // 메시지 전송
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isStreaming) {
      return;
    }

    requestAIResponse(inputMessage, currentEmotion);
    setInputMessage('');
    setError(null);
  };

  // Enter 키 전송
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // 감정 한글 레이블
  const emotionLabels: Record<Emotion, string> = {
    happy: '행복',
    sad: '슬픔',
    angry: '분노',
    anxious: '불안',
    neutral: '중립',
    surprised: '놀람',
    disgusted: '혐오',
    fearful: '두려움'
  };

  return (
    <div className="ai-voice-chat">
      {/* 헤더 */}
      <div className="chat-header">
        <h2 className="chat-title">AI 음성 상담</h2>
        {currentEmotion && (
          <div className="current-emotion">
            현재 감정: <strong>{emotionLabels[currentEmotion]}</strong>
          </div>
        )}
      </div>

      {/* 대화 내역 */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>안녕하세요! 무엇을 도와드릴까요?</p>
            <p className="text-sm text-gray-500">
              편안하게 이야기를 나눠보세요
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message message-${msg.role}`}
            data-emotion={msg.emotion}
          >
            <div className="message-content">{msg.content}</div>
            <div className="message-meta">
              {msg.emotion && (
                <span className="emotion-badge">
                  {emotionLabels[msg.emotion]}
                </span>
              )}
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}

        {/* 스트리밍 중인 응답 */}
        {isStreaming && currentResponse && (
          <div className="message message-assistant streaming">
            <div className="message-content">
              {currentResponse}
              <span className="cursor">▋</span>
            </div>
            <div className="message-meta">
              <span className="streaming-indicator">응답 생성 중...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button
            onClick={() => setError(null)}
            className="error-close"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
      )}

      {/* 입력 폼 */}
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
          disabled={isStreaming}
          maxLength={2000}
          rows={1}
          className="chat-input"
        />

        <div className="input-footer">
          <span className="char-count">
            {inputMessage.length} / 2000
          </span>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isStreaming}
            className="send-button"
          >
            {isStreaming ? '전송 중...' : '전송'}
          </button>
        </div>
      </form>

      {/* 개발 디버그 (DEV 모드만) */}
      {import.meta.env.DEV && (
        <div className="debug-panel">
          <details>
            <summary>디버그 정보</summary>
            <ul>
              <li>세션 ID: {sessionId}</li>
              <li>메시지 수: {messages.length}</li>
              <li>스트리밍: {isStreaming ? 'Yes' : 'No'}</li>
              <li>현재 감정: {currentEmotion || 'None'}</li>
            </ul>
            <button onClick={clearMessages} className="debug-button">
              대화 초기화
            </button>
          </details>
        </div>
      )}
    </div>
  );
}
```

---

### 4. 스타일 (`src/components/AIChat/AIVoiceChat.css`)

```css
/* AI Voice Chat 스타일 */

.ai-voice-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: var(--color-background, #ffffff);
  border-radius: 12px;
  overflow: hidden;
}

/* 헤더 */
.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.current-emotion {
  font-size: 14px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

/* 대화 내역 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--color-background-alt, #f9fafb);
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
}

.empty-state p {
  margin: 8px 0;
}

/* 메시지 */
.message {
  padding: 12px 16px;
  border-radius: 16px;
  max-width: 70%;
  word-wrap: break-word;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 사용자 메시지 */
.message-user {
  align-self: flex-end;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

/* AI 메시지 */
.message-assistant {
  align-self: flex-start;
  background: white;
  color: #2d3748;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 스트리밍 효과 */
.message.streaming {
  background: #e6fffa;
  border: 2px dashed #38b2ac;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.message.streaming .cursor {
  display: inline-block;
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* 메시지 메타 정보 */
.message-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.75;
}

.emotion-badge {
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-weight: 500;
}

.streaming-indicator {
  font-style: italic;
  color: #38b2ac;
}

/* 에러 배너 */
.error-banner {
  background: #fed7d7;
  border: 1px solid #fc8181;
  padding: 12px 16px;
  margin: 0 20px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-icon {
  font-size: 20px;
}

.error-text {
  flex: 1;
  color: #742a2a;
  font-size: 14px;
}

.error-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #fc8181;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-close:hover {
  color: #e53e3e;
}

/* 입력 폼 */
.chat-input-form {
  padding: 20px;
  border-top: 1px solid #e2e8f0;
  background: white;
}

.chat-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #cbd5e0;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: all 0.2s;
  min-height: 44px;
  max-height: 120px;
}

.chat-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-input:disabled {
  background: #f7fafc;
  cursor: not-allowed;
  opacity: 0.6;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.char-count {
  font-size: 12px;
  color: #a0aec0;
}

.send-button {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 디버그 패널 */
.debug-panel {
  padding: 12px 20px;
  background: #f7fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #718096;
}

.debug-panel details {
  cursor: pointer;
}

.debug-panel summary {
  font-weight: 600;
  margin-bottom: 8px;
}

.debug-panel ul {
  list-style: none;
  padding: 0;
  margin: 8px 0;
}

.debug-panel li {
  padding: 4px 0;
}

.debug-button {
  margin-top: 8px;
  padding: 6px 12px;
  background: #fc8181;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

/* 반응형 (모바일) */
@media (max-width: 768px) {
  .message {
    max-width: 85%;
  }

  .chat-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .current-emotion {
    font-size: 12px;
  }
}

/* 다크모드 지원 */
@media (prefers-color-scheme: dark) {
  .ai-voice-chat {
    background: #1a202c;
  }

  .chat-messages {
    background: #2d3748;
  }

  .message-assistant {
    background: #4a5568;
    color: #e2e8f0;
    border-color: #4a5568;
  }

  .chat-input-form {
    background: #2d3748;
    border-top-color: #4a5568;
  }

  .chat-input {
    background: #1a202c;
    color: #e2e8f0;
    border-color: #4a5568;
  }

  .chat-input:focus {
    border-color: #667eea;
  }
}
```

---

### 5. App.tsx 통합

**기존 파일에 추가할 코드**:

```typescript
// 임포트 추가
import { AIVoiceChat } from './components/AIChat/AIVoiceChat';

// App 컴포넌트 내부 (return 전)
const [showAIChat, setShowAIChat] = useState(false);

// JSX에 추가 (적절한 위치에)
{sessionId && showAIChat && (
  <div className="ai-chat-container">
    <AIVoiceChat
      sessionId={sessionId}
      sendToSession={sendToSession}
      currentEmotion={currentEmotion}
      onSessionMessage={handleSessionMessage}  // 기존 핸들러 재사용
    />
  </div>
)}

// AI 채팅 토글 버튼 (예: 세션 시작 후 표시)
{sessionId && !showAIChat && (
  <button
    onClick={() => setShowAIChat(true)}
    className="ai-chat-toggle"
  >
    💬 AI 상담 시작
  </button>
)}
```

---

## ✅ 테스트 시나리오

구현 후 다음을 테스트해주세요:

### 시나리오 1: 기본 대화
1. 세션 시작
2. "AI 상담 시작" 버튼 클릭
3. 메시지 입력: "안녕하세요"
4. 전송 클릭
5. ✅ AI 응답 스트리밍 확인 (타이핑 효과)
6. ✅ 최종 메시지가 대화 내역에 추가

### 시나리오 2: 감정 기반 응답
1. 얼굴 표정 변경 (예: 슬픈 표정)
2. 감정 표시 확인: "현재 감정: 슬픔"
3. 메시지: "요즘 우울해요"
4. ✅ AI 응답 톤 확인 (공감적, 위로하는 톤)

### 시나리오 3: 에러 처리
1. 빈 메시지 전송 → ✅ "메시지를 입력해주세요" 에러
2. 2001자 메시지 → ✅ "메시지가 너무 깁니다" 에러
3. WebSocket 연결 끊김 → ✅ 재연결 시도

### 시나리오 4: Enter 키 전송
1. 메시지 입력
2. Enter 키 → ✅ 전송
3. Shift + Enter → ✅ 줄바꿈

---

## ⚠️ 주의사항

### 1. 필드명 엄수
```typescript
// ✅ 올바른 필드명
{ type: 'ai_stream_chunk', data: { chunk: "텍스트" } }

// ❌ 잘못된 필드명 (파싱 실패!)
{ type: 'ai_stream_chunk', data: { text: "텍스트" } }
```

### 2. WebSocket 재사용
- 기존 세션용 WebSocket을 **재사용**하세요
- 새로운 연결을 만들지 마세요
- `sendToSession` 함수 사용

### 3. 감정 타입
8개 감정 모두 지원:
- `happy`, `sad`, `angry`, `anxious`
- `neutral`, `surprised`, `disgusted`, `fearful`

### 4. 메시지 검증
전송 전 필수 검증:
- 빈 메시지: `!message.trim()`
- 길이 제한: `message.length > 2000`

### 5. 성능 최적화
```typescript
// 메시지 개수 제한 (메모리 관리)
const MAX_MESSAGES = 50;

setMessages((prev) => {
  const newMessages = [...prev, newMessage];
  if (newMessages.length > MAX_MESSAGES) {
    return newMessages.slice(-MAX_MESSAGES);
  }
  return newMessages;
});
```

---

## 🔍 트러블슈팅

### Q1: AI 응답이 오지 않음
**확인 사항**:
1. 개발자 도구 → Network → WS 탭
2. `request_ai_response` 메시지가 전송되는지
3. 백엔드 응답 확인

**해결**:
```typescript
// WebSocket 상태 확인
console.log('WS Channels:', channels);
console.log('Send Function:', sendToSession);
```

### Q2: 스트리밍이 중간에 멈춤
**원인**: WebSocket 연결 끊김

**해결**:
- 백엔드 로그 확인
- WebSocket heartbeat 설정 확인
- 타임아웃 설정 확인 (45초)

### Q3: 타이핑 효과가 작동 안 함
**원인**: CSS 애니메이션 미적용

**해결**:
```css
/* AIVoiceChat.css 파일 확인 */
.message.streaming .cursor {
  animation: blink 1s infinite;
}
```

### Q4: Enter 키가 작동 안 함
**원인**: `onKeyDown` 핸들러 누락

**해결**:
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage(e);
  }
};
```

---

## 📊 성능 요구사항

- **UI 응답성**: 60 FPS 유지
- **메모리**: < 100MB (50개 메시지 기준)
- **스트리밍 지연**: < 100ms per chunk
- **초기 로딩**: < 1초

---

## 📝 체크리스트

**구현 전**:
- [ ] 백엔드 서버 실행 확인
- [ ] 기존 WebSocket 연결 확인
- [ ] 감정 분석 데이터 위치 확인

**구현 중**:
- [ ] `src/types/ai-chat.ts` 생성
- [ ] `src/hooks/useAIVoiceChat.ts` 생성
- [ ] `src/components/AIChat/AIVoiceChat.tsx` 생성
- [ ] `src/components/AIChat/AIVoiceChat.css` 생성
- [ ] `src/App.tsx` 통합

**테스트**:
- [ ] 기본 대화 테스트
- [ ] 감정 기반 응답 테스트
- [ ] 에러 시나리오 테스트
- [ ] Enter 키 전송 테스트
- [ ] 모바일 반응형 테스트

**배포 전**:
- [ ] 프로덕션 빌드 (`npm run build`)
- [ ] TypeScript 타입 체크 (`npm run typecheck`)
- [ ] ESLint 검사 (`npm run lint`)
- [ ] 크로스 브라우저 테스트

---

## 📚 참고 문서

- [React Hooks 공식 문서](https://react.dev/reference/react)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**구현 예상 시간**: 2-3시간
**난이도**: 중간
**우선순위**: 🔴 High (핵심 기능)

이 프롬프트를 Claude Code에 복사-붙여넣기하면 즉시 구현을 시작할 수 있습니다!
```

---

## 🎯 사용 방법

1. **위 전체 내용을 복사**
2. **Claude Code 열기**
3. **붙여넣기**
4. **Enter**

Claude Code가 자동으로:
- 필요한 파일 생성
- 타입 정의 작성
- Custom Hook 구현
- UI 컴포넌트 작성
- 스타일 작성
- App.tsx 통합

을 수행합니다.

---

## 📧 프론트엔드 팀 전달 메시지

```
안녕하세요 프론트엔드 팀!

백엔드 AI 음성 상담 기능이 완성되었습니다.
프론트엔드에서 UI만 추가하시면 즉시 작동합니다.

📄 실행 가이드: docs/integration/frontend/FRONTEND_AI_VOICE_PROMPT.md

이 파일을 Claude Code에 복사-붙여넣기만 하시면
2-3시간 안에 모든 코드가 자동 생성됩니다.

구현 내용:
- ✅ 타입 정의 (8개 감정)
- ✅ Custom Hook (WebSocket 통합)
- ✅ UI 컴포넌트 (대화 내역 + 입력 폼)
- ✅ 스타일 (반응형 + 다크모드)
- ✅ 에러 핸들링

구현 후 통합 테스트를 함께 진행하겠습니다!

감사합니다 😊
```

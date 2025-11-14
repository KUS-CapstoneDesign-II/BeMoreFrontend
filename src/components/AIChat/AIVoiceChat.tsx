import { useState, useRef, useEffect } from 'react';
import { useAIVoiceChat } from '../../hooks/useAIVoiceChat';
import type { WSMessage } from '../../types';
import type { Emotion } from '../../types/ai-chat';
import './AIVoiceChat.css';

interface AIVoiceChatProps {
  sessionId: string;
  sendToSession: (message: WSMessage) => void;
  currentEmotion: Emotion | null;
  onSessionMessage: (callback: (message: WSMessage) => void) => void;
}

/**
 * AI 음성 상담 컴포넌트
 *
 * 실시간 AI 응답 스트리밍과 대화 내역 표시
 */
export function AIVoiceChat({
  sessionId,
  sendToSession,
  currentEmotion,
  onSessionMessage
}: AIVoiceChatProps) {
  // Custom Hook
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
    onError: (error) => setError(error),
    onChunk: (chunk) => {
      if (import.meta.env.DEV) {
        console.log('[TTS Ready]', chunk);
      }
    }
  });

  // 로컬 상태
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 메시지 스크롤 참조
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket 메시지 핸들러 등록
  useEffect(() => {
    onSessionMessage(handleSessionMessage);
  }, [onSessionMessage, handleSessionMessage]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    requestAIResponse(input, currentEmotion);
    setInput('');
    setError(null);
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // 감정 라벨
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
      {/* Header */}
      <div className="ai-chat-header">
        <h2>AI 음성 상담</h2>
        <button onClick={clearMessages} className="clear-btn" title="대화 초기화">
          🗑️
        </button>
      </div>

      {/* Messages */}
      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-chat-empty">
            <p>안녕하세요! 무엇을 도와드릴까요?</p>
            <p className="ai-chat-hint">음성으로 말하거나 텍스트를 입력해보세요</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`ai-message ai-message-${msg.role}`}>
            {/* 사용자 메시지 */}
            {msg.role === 'user' && (
              <>
                <div className="ai-message-header">
                  <span className="ai-message-role">You</span>
                  {msg.emotion && (
                    <span className={`ai-emotion-badge ai-emotion-${msg.emotion}`}>
                      {emotionLabels[msg.emotion]}
                    </span>
                  )}
                </div>
                <div className="ai-message-content">{msg.content}</div>
              </>
            )}

            {/* AI 메시지 */}
            {msg.role === 'assistant' && (
              <>
                <div className="ai-message-header">
                  <span className="ai-message-role">AI Counselor</span>
                </div>
                <div className="ai-message-content">{msg.content}</div>
              </>
            )}
          </div>
        ))}

        {/* 스트리밍 중 메시지 */}
        {isStreaming && currentResponse && (
          <div className="ai-message ai-message-assistant ai-message-streaming">
            <div className="ai-message-header">
              <span className="ai-message-role">AI Counselor</span>
              <span className="ai-streaming-indicator">
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
              </span>
            </div>
            <div className="ai-message-content ai-typing-effect">{currentResponse}</div>
          </div>
        )}

        {/* 스트리밍 시작 표시 */}
        {isStreaming && !currentResponse && (
          <div className="ai-message ai-message-assistant ai-message-streaming">
            <div className="ai-message-header">
              <span className="ai-message-role">AI Counselor</span>
              <span className="ai-streaming-indicator">
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
              </span>
            </div>
            <div className="ai-message-content">
              <span className="ai-thinking">생각 중...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="ai-chat-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="ai-error-close">
            ✕
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="ai-chat-input-form">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
          className="ai-chat-textarea"
          rows={2}
          disabled={isStreaming}
        />
        <button type="submit" className="ai-chat-send-btn" disabled={isStreaming || !input.trim()}>
          전송
        </button>
      </form>

      {/* Debug Panel (개발 모드) */}
      {import.meta.env.DEV && (
        <div className="ai-debug-panel">
          <details>
            <summary>Debug Info</summary>
            <div className="ai-debug-content">
              <p>
                <strong>Session ID:</strong> {sessionId}
              </p>
              <p>
                <strong>Current Emotion:</strong> {currentEmotion || 'null'}
              </p>
              <p>
                <strong>Is Streaming:</strong> {isStreaming ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Messages:</strong> {messages.length}
              </p>
              <p>
                <strong>Current Response Length:</strong> {currentResponse.length}
              </p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

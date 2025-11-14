import { useState, useCallback, useRef } from 'react';
import type { WSMessage } from '../types';
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
  sessionId: _sessionId, // eslint-disable-line @typescript-eslint/no-unused-vars
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
    (message: WSMessage) => {
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
    handleSessionMessage
  };
}

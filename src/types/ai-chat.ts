/**
 * AI 음성 상담 타입 정의
 */

// 감정 타입 (8가지)
export type Emotion =
  | 'happy' // 행복
  | 'sad' // 슬픔
  | 'angry' // 분노
  | 'anxious' // 불안
  | 'neutral' // 중립
  | 'surprised' // 놀람
  | 'disgusted' // 혐오
  | 'fearful'; // 두려움

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

import type { WSMessage } from './index';

// Hook Props
export interface UseAIVoiceChatProps {
  sessionId: string;
  sendToSession: (message: WSMessage) => void;
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
  handleSessionMessage: (message: WSMessage) => void;
}

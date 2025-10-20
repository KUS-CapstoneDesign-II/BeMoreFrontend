import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

interface AIChatProps {
  onNewMessage?: (message: string) => void;
  className?: string;
}

/**
 * AIChat 컴포넌트
 *
 * AI 대화 인터페이스와 TTS 기능을 제공합니다.
 */
export function AIChat({ className = '' }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Web Speech API 초기화
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // 메시지 추가
  const addMessage = (role: 'user' | 'ai', content: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);

    // AI 메시지일 경우 TTS 재생
    if (role === 'ai' && synthRef.current) {
      speakText(content);
    }

    // 스크롤을 맨 아래로
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // TTS로 텍스트 읽기
  const speakText = (text: string) => {
    if (!synthRef.current) return;

    // 이전 TTS 중지
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // TTS 중지
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // 외부에서 AI 메시지 추가 (WebSocket으로 받을 때)
  useEffect(() => {
    // 이 부분은 실제로 WebSocket 메시지 수신 시 호출됩니다
    // addMessage를 export하여 외부에서 사용할 수 있도록 했습니다
  }, []);

  // 컴포넌트 외부에서 사용할 수 있도록 export (React.forwardRef나 useImperativeHandle로 개선 가능)
  (AIChat as any).addMessage = addMessage;

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">AI 상담사</h3>
            <div className="text-xs text-gray-500">
              {isSpeaking ? '🔊 말하는 중...' : '💬 대화 가능'}
            </div>
          </div>
        </div>

        {/* TTS 제어 */}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
          >
            중지
          </button>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>AI와 대화를 시작하세요</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] px-3 py-2 rounded-lg text-sm
                  ${message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }
                `}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 (실제로는 음성 입력만 사용) */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          🎤 음성으로 대화하세요
        </div>
      </div>
    </div>
  );
}

// AIChat 컴포넌트에 메시지 추가 메서드 노출 (외부에서 사용)
export type AIChatHandle = {
  addMessage: (role: 'user' | 'ai', content: string) => void;
  stopSpeaking: () => void;
};

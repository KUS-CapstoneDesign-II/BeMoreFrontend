import { useState, useEffect } from 'react';
import { VideoFeed } from './components/VideoFeed';
import { STTSubtitle } from './components/STT';
import { EmotionCard } from './components/Emotion';
import { VADMonitor } from './components/VAD';
import { AIChat } from './components/AIChat';
import { SessionControls } from './components/Session';
import { sessionAPI } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import type { EmotionType, VADMetrics, SessionStatus } from './types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
const DEMO_MODE = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

function App() {
  // 세션 상태
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ended');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 데이터 상태
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType | null>(DEMO_MODE ? 'happy' : null);
  const [sttText, setSttText] = useState(DEMO_MODE ? '안녕하세요! BeMore 심리 상담 시스템입니다.' : '');
  const [vadMetrics, setVadMetrics] = useState<VADMetrics | null>(null);

  // WebSocket 연결
  const { isConnected: wsConnected, connectionStatus, connect: connectWS, disconnect: disconnectWS } = useWebSocket({
    onVoiceMessage: (message) => {
      console.log('🎤 Voice message:', message);
      if (message.type === 'stt_received') {
        setSttText(message.data?.text || '');
      }
      if (message.type === 'vad_analysis' || message.type === 'vad_realtime') {
        setVadMetrics(message.data as VADMetrics);
      }
    },
    onLandmarksMessage: (message) => {
      console.log('👤 Landmarks message:', message);
      if (message.type === 'emotion_update') {
        setCurrentEmotion(message.data?.emotion as EmotionType);
      }
    },
    onSessionMessage: (message) => {
      console.log('📊 Session message:', message);
      if (message.type === 'status_update') {
        // 세션 상태 업데이트 처리
      }
    },
  });

  // 세션 시작
  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. 세션 시작 API 호출
      const response = await sessionAPI.start('frontend_user_001', 'ai_counselor_001');
      setSessionId(response.sessionId);
      setSessionStatus('active');

      // 2. WebSocket 연결
      connectWS({
        landmarks: `${WS_URL}/ws/landmarks/${response.sessionId}`,
        voice: `${WS_URL}/ws/voice/${response.sessionId}`,
        session: `${WS_URL}/ws/session/${response.sessionId}`,
      });

      console.log('✅ 세션 시작:', response.sessionId);
    } catch (err) {
      console.error('❌ 세션 시작 실패:', err);
      setError(err instanceof Error ? err.message : '세션 시작 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // 세션 일시정지
  const handlePauseSession = async () => {
    if (!sessionId) return;

    try {
      await sessionAPI.pause(sessionId);
      setSessionStatus('paused');
      console.log('⏸️ 세션 일시정지');
    } catch (err) {
      console.error('❌ 일시정지 실패:', err);
      setError(err instanceof Error ? err.message : '일시정지 실패');
    }
  };

  // 세션 재개
  const handleResumeSession = async () => {
    if (!sessionId) return;

    try {
      await sessionAPI.resume(sessionId);
      setSessionStatus('active');
      console.log('▶️ 세션 재개');
    } catch (err) {
      console.error('❌ 재개 실패:', err);
      setError(err instanceof Error ? err.message : '재개 실패');
    }
  };

  // 세션 종료
  const handleEndSession = async () => {
    if (!sessionId) return;

    try {
      await sessionAPI.end(sessionId);
      setSessionStatus('ended');
      disconnectWS();
      setSessionId(null);
      console.log('⏹️ 세션 종료');
    } catch (err) {
      console.error('❌ 종료 실패:', err);
      setError(err instanceof Error ? err.message : '종료 실패');
    }
  };

  // 데모용 VAD 메트릭
  const demoVADMetrics: VADMetrics = {
    speechRatio: 0.65,
    pauseRatio: 0.35,
    averagePauseDuration: 1500,
    longestPause: 3000,
    speechBurstCount: 12,
    averageSpeechBurst: 2500,
    pauseCount: 8,
    summary: '정상적인 발화 패턴입니다. 적절한 침묵과 발화 비율을 유지하고 있습니다.'
  };

  // 컴포넌트 언마운트 시 세션 종료
  useEffect(() => {
    return () => {
      if (sessionId) {
        disconnectWS();
      }
    };
  }, [sessionId, disconnectWS]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">BeMore</h1>
              <p className="text-xs sm:text-sm text-gray-500">AI 심리 상담 시스템</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* 세션 시작 버튼 */}
              {!sessionId && (
                <button
                  onClick={handleStartSession}
                  disabled={isLoading}
                  className="px-4 py-2 min-h-[44px] bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg shadow-soft hover:shadow-soft-lg transition-all text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 active:scale-95 transform disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="세션 시작"
                >
                  {isLoading ? '시작 중...' : '세션 시작'}
                </button>
              )}
              {/* 세션 ID */}
              {sessionId && (
                <div className="hidden sm:block text-xs sm:text-sm text-gray-500">
                  세션 ID: <span className="font-mono text-gray-700">{sessionId.slice(0, 20)}...</span>
                </div>
              )}
              {/* WebSocket 상태 */}
              {sessionId && (
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} aria-hidden="true"></div>
                  <span className="text-xs text-gray-500">{wsConnected ? '연결됨' : '연결 끊김'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 에러 메시지 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 왼쪽: 비디오 피드 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 비디오 */}
            <div className="bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-shadow duration-300 p-3 sm:p-4 animate-fade-in-up">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">실시간 영상</h2>
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <VideoFeed className="w-full h-full" />
                {sttText && <STTSubtitle text={sttText} />}
              </div>
            </div>

            {/* AI 채팅 - 모바일에서 숨김 */}
            <div className="hidden sm:block bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-shadow duration-300 p-3 sm:p-4 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">AI 대화</h2>
              <div className="h-80 sm:h-96">
                <AIChat />
              </div>
            </div>
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="space-y-4">
            {/* 감정 카드 */}
            <div className="bg-white rounded-xl shadow-soft p-3 sm:p-4 animate-slide-in-left">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">현재 감정</h2>
              <EmotionCard emotion={currentEmotion} confidence={0.85} />
            </div>

            {/* VAD 모니터 */}
            <div className="bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-shadow duration-300 p-3 sm:p-4 animate-slide-in-left" style={{animationDelay: '0.1s'}}>
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">음성 분석</h2>
              <VADMonitor metrics={DEMO_MODE ? demoVADMetrics : vadMetrics} />
            </div>

            {/* 시스템 정보 */}
            <div className="bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-shadow duration-300 p-3 sm:p-4 animate-slide-in-left" style={{animationDelay: '0.2s'}}>
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">시스템 상태</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">WebSocket</span>
                  <span className={`${wsConnected ? 'text-green-600' : 'text-red-600'} font-medium`}>
                    <span aria-hidden="true">● </span>
                    {wsConnected ? '연결됨' : '연결 끊김'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Landmarks</span>
                  <span className={`${connectionStatus.landmarks === 'connected' ? 'text-green-600' : 'text-gray-400'} font-medium`}>
                    <span aria-hidden="true">● </span>
                    {connectionStatus.landmarks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voice</span>
                  <span className={`${connectionStatus.voice === 'connected' ? 'text-green-600' : 'text-gray-400'} font-medium`}>
                    <span aria-hidden="true">● </span>
                    {connectionStatus.voice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Session</span>
                  <span className={`${connectionStatus.session === 'connected' ? 'text-green-600' : 'text-gray-400'} font-medium`}>
                    <span aria-hidden="true">● </span>
                    {connectionStatus.session}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 모바일 하단 고정 세션 컨트롤 */}
      {sessionId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:hidden shadow-lg z-20">
          <SessionControls
            status={sessionStatus}
            onPause={handlePauseSession}
            onResume={handleResumeSession}
            onEnd={handleEndSession}
          />
        </div>
      )}

      {/* 데스크톱 세션 컨트롤 */}
      {sessionId && (
        <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 pb-6 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
          <div className="bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-shadow duration-300 p-4">
            <SessionControls
              status={sessionStatus}
              onPause={handlePauseSession}
              onResume={handleResumeSession}
              onEnd={handleEndSession}
            />
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="mt-8 sm:mt-12 py-4 sm:py-6 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-gray-500">
          <p>BeMore - AI 기반 심리 상담 시스템</p>
          <p className="mt-1">Powered by MediaPipe, Gemini AI, Web Speech API</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

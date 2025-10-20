import { useState } from 'react';
import { VideoFeed } from './components/VideoFeed';
import { STTSubtitle } from './components/STT';
import { EmotionCard } from './components/Emotion';
import { VADMonitor } from './components/VAD';
import { AIChat } from './components/AIChat';
import { SessionControls } from './components/Session';
import type { EmotionType, VADMetrics } from './types';

function App() {
  const [currentEmotion] = useState<EmotionType>('happy');
  const [sttText, setSttText] = useState('안녕하세요! BeMore 심리 상담 시스템입니다.');

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

  // STT 텍스트 변경 데모
  const changeSttText = () => {
    const texts = [
      '오늘 기분이 어떠세요?',
      '편안하게 말씀해주세요.',
      '잘 듣고 있습니다.',
      '계속 이야기해주세요.'
    ];
    setSttText(texts[Math.floor(Math.random() * texts.length)]);
  };

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
            <div className="hidden sm:block text-sm text-gray-500">
              세션 ID: <span className="font-mono text-gray-700">demo-session-001</span>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 왼쪽: 비디오 피드 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 비디오 */}
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">실시간 영상</h2>
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <VideoFeed className="w-full h-full" />
                <STTSubtitle text={sttText} />
              </div>
              <button
                onClick={changeSttText}
                className="mt-3 px-4 py-2 min-h-[44px] bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="STT 텍스트 변경"
              >
                STT 텍스트 변경
              </button>
            </div>

            {/* AI 채팅 - 모바일에서 숨김 */}
            <div className="hidden sm:block bg-white rounded-lg shadow-md p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">AI 대화</h2>
              <div className="h-80 sm:h-96">
                <AIChat />
              </div>
            </div>
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="space-y-4">
            {/* 감정 카드 */}
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">현재 감정</h2>
              <EmotionCard emotion={currentEmotion} confidence={0.85} />
            </div>

            {/* VAD 모니터 */}
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">음성 분석</h2>
              <VADMonitor metrics={demoVADMetrics} />
            </div>

            {/* 시스템 정보 */}
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">시스템 상태</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">WebSocket</span>
                  <span className="text-green-600 font-medium"><span aria-hidden="true">● </span>연결됨</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MediaPipe</span>
                  <span className="text-green-600 font-medium"><span aria-hidden="true">● </span>활성</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAD</span>
                  <span className="text-green-600 font-medium"><span aria-hidden="true">● </span>감지 중</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">STT</span>
                  <span className="text-green-600 font-medium"><span aria-hidden="true">● </span>준비됨</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 모바일 하단 고정 세션 컨트롤 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:hidden shadow-lg z-20">
        <SessionControls
          status="active"
          onPause={() => alert('일시정지')}
          onResume={() => alert('재개')}
          onEnd={() => alert('종료')}
        />
      </div>

      {/* 데스크톱 세션 컨트롤 */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <SessionControls
            status="active"
            onPause={() => alert('일시정지')}
            onResume={() => alert('재개')}
            onEnd={() => alert('종료')}
          />
        </div>
      </div>

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

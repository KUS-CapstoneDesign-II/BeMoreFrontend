import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { VideoFeed } from './components/VideoFeed';
import { STTSubtitle } from './components/STT';
import { EmotionCard } from './components/Emotion';
import { SessionControls } from './components/Session';
import { Onboarding } from './components/Onboarding';
// import { Landing } from './components/Landing/Landing';
import { SessionSummaryModal } from './components/Session/SessionSummaryModal';
import { SessionResult } from './components/Session/SessionResult';
import { Dashboard } from './pages/Home/Dashboard';
import { ResumePromptModal } from './components/Session/ResumePromptModal';
import { PrivacyPolicyModal, TermsOfServiceModal } from './components/Common/LegalModals';
import { ThemeToggle } from './components/ThemeToggle';
import { ConsentDialog } from './components/Common/ConsentDialog';
import { NetworkStatusBanner } from './components/Common/NetworkStatusBanner';
import { SessionTimer } from './components/Common/SessionTimer';
import { IdleTimeoutModal } from './components/Common/IdleTimeoutModal';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useConsent } from './contexts/ConsentContext';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { sessionAPI } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './contexts/ThemeContext';
import type { EmotionType, VADMetrics, SessionStatus } from './types';
import type { KeyboardShortcut } from './hooks/useKeyboardShortcuts';
import { AIChatSkeleton, VADMonitorSkeleton } from './components/Skeleton/Skeleton';
import { collectWebVitals, logPerformanceMetrics } from './utils/performance';
import { funnelEvent, markAndMeasure } from './utils/analytics_extra';
import { trackWebVitals } from './utils/analytics';
import { initAnalytics, trackPageView } from './utils/analytics';
import { initSentry } from './utils/sentry';

// Lazy load non-critical components
const AIChat = lazy(() => import('./components/AIChat').then(module => ({ default: module.AIChat })));
const VADMonitor = lazy(() => import('./components/VAD').then(module => ({ default: module.VADMonitor })));

const ONBOARDING_KEY = 'bemore_onboarding_completed';

const runtimeEnv = (window as unknown as { __ENV__?: { API_URL?: string; WS_URL?: string } }).__ENV__ || {};
const API_URL = (
  (runtimeEnv.API_URL as string) ||
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  'http://localhost:8000'
) as string;
const WS_URL = (() => {
  let url = (runtimeEnv.WS_URL as string) || (import.meta.env.VITE_WS_URL as string);
  if (!url) {
    url = API_URL.replace(/^http/, import.meta.env.PROD ? 'wss' : 'ws');
  }
  if (import.meta.env.PROD) {
    url = url.replace(/^ws:\/\//, 'wss://').replace(/^http:\/\//, 'wss://');
  }
  return url;
})() as string;
const DEMO_MODE = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

function App() {
  // Theme hook
  const { toggleTheme } = useTheme();
  const { consent, openDialog, isDialogOpen } = useConsent();

  // 온보딩 상태
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    return completed !== 'true';
  });

  // 키보드 단축키 도움말
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 세션 상태
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ended');
  const [sessionStartAt, setSessionStartAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [idlePromptOpen, setIdlePromptOpen] = useState(false);
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState(60);
  const [sidebarTab, setSidebarTab] = useState<'analyze'|'result'>('analyze');

  // 데이터 상태
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType | null>(DEMO_MODE ? 'happy' : null);
  const [sttText, setSttText] = useState(DEMO_MODE ? '안녕하세요! BeMore 심리 상담 시스템입니다.' : '');
  const [vadMetrics, setVadMetrics] = useState<VADMetrics | null>(null);

  // WebSocket 연결
  const { isConnected: wsConnected, connectionStatus, connect: connectWS, disconnect: disconnectWS, landmarksWs } = useWebSocket({
    onVoiceMessage: (message) => {
      console.log('🎤 Voice message:', message);
      if (message.type === 'stt_received') {
        const d = message.data as { text?: string };
        setSttText(d?.text ?? '');
      }
      if (message.type === 'vad_analysis' || message.type === 'vad_realtime') {
        setVadMetrics(message.data as VADMetrics);
      }
    },
    onLandmarksMessage: (message) => {
      console.log('👤 Landmarks message:', message);
      if (message.type === 'emotion_update') {
        const d = message.data as { emotion?: EmotionType };
        setCurrentEmotion(d?.emotion as EmotionType);
      }
    },
    onSessionMessage: (message) => {
      console.log('📊 Session message:', message);
      if (message.type === 'status_update') {
        // 세션 상태 업데이트 처리
      }
      // AI streaming events (example schema)
      if (message.type === 'ai_stream_begin') {
        window.dispatchEvent(new CustomEvent('ai:begin'));
      }
      if (message.type === 'ai_stream_chunk') {
        const d = message.data as { text?: string };
        window.dispatchEvent(new CustomEvent('ai:append', { detail: { chunk: d?.text ?? '' } }));
      }
      if (message.type === 'ai_stream_complete') {
        window.dispatchEvent(new CustomEvent('ai:complete'));
      }
      if (message.type === 'ai_stream_error') {
        const d = message.data as { error?: string };
        window.dispatchEvent(new CustomEvent('ai:fail', { detail: { error: d?.error ?? 'AI stream failed' } }));
      }
    },
    onStatusChange: (channel, status) => {
      console.log(`[App] ${channel} status changed to: ${status}`);
    },
  });

  // Ref to track current connection status (avoids closure issues in Promise polling)
  const connectionStatusRef = useRef(connectionStatus);
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  // 세션 시작
  const handleStartSession = async () => {
    // Super early log - if this doesn't appear, the function isn't being called
    console.log('\n\n🔴🔴🔴 [CRITICAL] handleStartSession() CALLED - ENTRY POINT 🔴🔴🔴');
    console.log('[CRITICAL] Function parameters - isLoading:', isLoading, 'sessionId:', sessionId);

    // 이미 진행 중인 경우 중복 실행 방지
    if (isLoading || sessionId) {
      console.error('⛔ [CRITICAL] Already loading or session exists, returning early');
      console.error('   isLoading:', isLoading, 'sessionId:', sessionId);
      return;
    }

    // Onboarding guard
    const completed = localStorage.getItem(ONBOARDING_KEY) === 'true';
    console.log('[CRITICAL] Onboarding check - localStorage key:', ONBOARDING_KEY, 'completed:', completed);
    if (!completed) {
      console.log('⚠️ [CRITICAL] Onboarding not completed, showing onboarding');
      setShowOnboarding(true);
      funnelEvent('onboarding_required');
      return;
    }
    console.log('✅ [CRITICAL] Onboarding check PASSED');
    setIsLoading(true);
    setError(null);
    console.log('✅ [CRITICAL] setIsLoading(true), now starting session...');

    try {
      console.log('\n📍 [CRITICAL] Step 1: Calling sessionAPI.start()...');
      // 1. 세션 시작 API 호출
      const response = await (markAndMeasure('StartSessionAPI', () => {}), sessionAPI.start('frontend_user_001', 'ai_counselor_001'));
      console.log('✅ [CRITICAL] sessionAPI.start() returned:', response.sessionId);

      const started = Date.now();
      localStorage.setItem('bemore_last_session', JSON.stringify({ sessionId: response.sessionId, started }));

      // 🔧 FIX: Set sessionId BEFORE calling connectWS()
      // This ensures isSessionActive = !!sessionId is true when WebSocket connects
      // and frame callbacks execute (prevents race condition)
      console.log('\n📍 [CRITICAL] Step 2: Setting session state BEFORE WebSocket connection...');
      setSessionId(response.sessionId);
      setSessionStatus('active');
      setSessionStartAt(started);
      console.log('✅ [CRITICAL] Session state updated - isSessionActive is now TRUE');

      console.log('📍 [CRITICAL] Step 2b: About to call connectWS()...');
      console.log('WS_URL:', WS_URL);

      // 2. WebSocket 연결 (완료될 때까지 기다림)
      const wsUrls = {
        landmarks: `${WS_URL}/ws/landmarks/${response.sessionId}`,
        voice: `${WS_URL}/ws/voice/${response.sessionId}`,
        session: `${WS_URL}/ws/session/${response.sessionId}`,
      };
      console.log('✅ [CRITICAL] wsUrls prepared:', wsUrls);
      console.log('🚀 [CRITICAL] Calling connectWS() NOW...');
      connectWS(wsUrls);
      console.log('✅ [CRITICAL] connectWS() returned');

      // 3. WebSocket 연결 완료를 기다림 (최대 5초)
      // Use a promise that resolves when WebSocket is connected
      // Using connectionStatusRef to avoid closure stale value issues
      console.log('⏳ [CRITICAL] Step 3: Now waiting for WebSocket connection...');
      await new Promise<void>((resolve, reject) => {
        console.log('[WebSocket] ⏳ Starting connection wait - current state:', connectionStatusRef.current);

        // If already connected, resolve immediately
        const currentStatus = connectionStatusRef.current;
        const allConnected = Object.values(currentStatus).every((s) => s === 'connected');
        if (allConnected) {
          console.log('[WebSocket] ✅ Already connected, resolving immediately');
          resolve();
          return;
        }

        let resolved = false;
         
        let timeout: ReturnType<typeof setTimeout> | undefined = undefined;
         
        let pollInterval: ReturnType<typeof setInterval> | undefined = undefined;

        const cleanup = () => {
          if (timeout !== undefined) clearTimeout(timeout);
          if (pollInterval !== undefined) clearInterval(pollInterval);
        };

        timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            console.error('❌ WebSocket connection timeout after 5s');
            console.error('   Current status:', connectionStatusRef.current);
            reject(new Error('WebSocket 연결 시간 초과'));
          }
        }, 5000);

        // Poll every 100ms to check connection status
        // Use ref to avoid stale closure values
        let pollCount = 0;
        pollInterval = setInterval(() => {
          // Skip if already resolved
          if (resolved) {
            cleanup();
            return;
          }

          const currentStatus = connectionStatusRef.current;
          const allConnected = Object.values(currentStatus).every((s) => s === 'connected');

          // Log every 10 polls (approx every 1 second)
          if (++pollCount % 10 === 0) {
            console.log(`[WebSocket] Poll #${pollCount} - Status:`, currentStatus);
          }

          if (allConnected && !resolved) {
            resolved = true;
            cleanup();
            console.log('[WebSocket] ✅ All channels connected:', currentStatus);
            resolve();
          }
        }, 100);
      });

      // 4. WebSocket 연결 확인 완료
      console.log('📍 [CRITICAL] Step 3: All WebSockets connected');
      console.log('✅ [CRITICAL] 세션 시작 완료:', response.sessionId);
      console.log('=== 🎯 [CRITICAL] handleStartSession() COMPLETED SUCCESSFULLY ===\n');
      funnelEvent('session_started');
    } catch (err) {
      console.error('\n❌ [CRITICAL] ERROR in handleStartSession():');
      console.error('Error object:', err);
      console.error('Error message:', err instanceof Error ? err.message : JSON.stringify(err));
      console.error('Stack:', err instanceof Error ? err.stack : 'no stack');
      setError(err instanceof Error ? err.message : '세션 시작 실패');
      funnelEvent('session_start_failed');
      console.log('=== 🎯 [CRITICAL] handleStartSession() FAILED ===\n');
    } finally {
      console.log('📍 [CRITICAL] Finally block: setIsLoading(false)');
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
    } catch (err) {
      // 백엔드 end 엔드포인트 실패 시 로그만 기록하고 계속 진행
      console.warn('⚠️ 세션 end API 실패:', err instanceof Error ? err.message : 'Unknown error');
    }

    // end API 성공/실패와 관계없이 항상 진행
    setSessionStatus('ended');
    disconnectWS();
    setSessionId(null);
    setSessionStartAt(null);
    console.log('⏹️ 세션 종료');
    funnelEvent('session_ended');
    setShowSummary(true);
    setSidebarTab('result');
  };

  // 온보딩 완료 처리
  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  // 온보딩 건너뛰기
  const handleOnboardingSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };
  // Resume prompt on return
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeSessionStartedAt, setResumeSessionStartedAt] = useState<number | undefined>();

  useEffect(() => {
    if (sessionId) return;
    try {
      const raw = localStorage.getItem('bemore_last_session');
      if (raw) {
        // 이전 세션이 있으면 자동으로 폐기 (재개 프롬프트 없음)
        console.log('🗑️ 이전 세션 자동 폐기');
        localStorage.removeItem('bemore_last_session');
      }
    } catch (error) {
      console.error('세션 복구 중 오류:', error);
      localStorage.removeItem('bemore_last_session');
    }
  }, [sessionId]);

  const resumeLastSession = () => {
    try {
      const raw = localStorage.getItem('bemore_last_session');
      if (!raw) {
        console.warn('⚠️ 재개할 세션 정보 없음');
        setShowResumePrompt(false);
        return;
      }

      const last = JSON.parse(raw) as { sessionId: string; started: number };

      // 유효성 검증
      if (!last.sessionId) {
        console.warn('⚠️ 세션 ID 없음');
        discardLastSession();
        return;
      }

      console.log('♻️ 세션 재개 시작:', last.sessionId);
      setSessionId(last.sessionId);
      setSessionStatus('active');
      setSessionStartAt(last.started);

      // WebSocket 재연결
      const wsResume = {
        landmarks: `${WS_URL}/ws/landmarks/${last.sessionId}`,
        voice: `${WS_URL}/ws/voice/${last.sessionId}`,
        session: `${WS_URL}/ws/session/${last.sessionId}`,
      };
      console.log('[WebSocket] 재연결 시도:', wsResume);
      connectWS(wsResume);

      setShowResumePrompt(false);
      setResumeSessionStartedAt(undefined);
    } catch (error) {
      console.error('❌ 세션 재개 실패:', error);
      setError('세션을 재개할 수 없습니다. 새로 시작해주세요.');
      discardLastSession();
    }
  };

  const discardLastSession = () => {
    console.log('🗑️ 이전 세션 폐기');
    localStorage.removeItem('bemore_last_session');
    setShowResumePrompt(false);
    setResumeSessionStartedAt(undefined);
  };

  // 키보드 단축키 설정
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '?',
      description: '키보드 단축키 도움말 표시',
      action: () => setShowShortcutsHelp((prev) => !prev),
    },
    {
      key: 't',
      ctrlKey: true,
      description: '테마 전환 (라이트/다크/시스템)',
      action: toggleTheme,
    },
    {
      key: 's',
      ctrlKey: true,
      description: '세션 시작/종료',
      action: () => {
        if (sessionId) {
          handleEndSession();
        } else {
          handleStartSession();
        }
      },
    },
    {
      key: 'p',
      ctrlKey: true,
      description: '세션 일시정지/재개',
      action: () => {
        if (!sessionId) return;
        if (sessionStatus === 'active') {
          handlePauseSession();
        } else if (sessionStatus === 'paused') {
          handleResumeSession();
        }
      },
    },
    {
      key: 'Escape',
      description: '모달 닫기',
      action: () => setShowShortcutsHelp(false),
    },
  ];

  useKeyboardShortcuts({ shortcuts, enabled: !showOnboarding });

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

  // 🔍 FIX: Only cleanup on unmount, not when sessionId changes
  // The issue was that cleanup was running every time sessionId changed,
  // causing premature WebSocket disconnection
  // Use a ref to track if we should cleanup
  const hasMountedRef = useRef(false);

  useEffect(() => {
    // Mark that component has mounted
    hasMountedRef.current = true;

    // Cleanup only on unmount
    return () => {
      console.log('[App.tsx] 🧹 Component unmount cleanup - disconnecting WebSocket');
      disconnectWS();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Idle timeout: show modal after inactivity; countdown to auto-end
  useIdleTimeout({
    idleMs: 5 * 60 * 1000,
    onIdle: () => {
      if (sessionStatus === 'active') {
        setIdleSecondsRemaining(60);
        setIdlePromptOpen(true);
      }
    },
  });

  useEffect(() => {
    if (!idlePromptOpen) return;
    const t = window.setInterval(() => {
      setIdleSecondsRemaining((s) => {
        if (s <= 1) {
          window.clearInterval(t);
          if (sessionId) handleEndSession();
          setIdlePromptOpen(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [idlePromptOpen]);

  // 성능 메트릭 수집 (개발 모드)
  useEffect(() => {
    collectWebVitals().then((m) => {
      if (import.meta.env.DEV) logPerformanceMetrics(m);
      trackWebVitals(m);
    });
  }, []);

  // Initialize analytics & sentry when consent available (respect DNT)
  useEffect(() => {
    const respectDNT = navigator.doNotTrack === '1' || (window as any).doNotTrack === '1' || (navigator as any).msDoNotTrack === '1';
    initAnalytics(consent, respectDNT);
    initSentry(consent, respectDNT);
    trackPageView(location.pathname + location.search);
  }, [consent]);

  // 첫 방문 시 동의 다이얼로그 표출
  useEffect(() => {
    if (!consent) {
      openDialog();
    }
  }, [consent, openDialog]);

  // 🔍 DIAGNOSTIC: Monitor when landmarksWs changes
  useEffect(() => {
    console.log('[App.tsx] 📡 landmarksWs changed! New value:', !!landmarksWs, 'readyState:', landmarksWs?.readyState);
    if (landmarksWs?.readyState === WebSocket.OPEN) {
      console.log('[App.tsx] ✅ landmarksWs is OPEN and ready!');
    }
  }, [landmarksWs]);

  return (
    <div id="main" className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* 랜딩 */}
      {!sessionId && !showOnboarding && (
        <div className="mb-4">
          <Dashboard />
        </div>
      )}

      {/* 온보딩 플로우 */}
      {showOnboarding && (
        <Onboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* 키보드 단축키 도움말 */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* 네트워크 상태 */}
      <NetworkStatusBanner />

      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">BeMore</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">AI 심리 상담 시스템</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Language and Theme */}
              <div className="hidden sm:flex items-center gap-2">
                <select
                  aria-label="언어 선택"
                  className="px-2 py-2 rounded border text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                  onChange={(e) => {
                    const val = e.target.value as 'ko'|'en';
                    try {
                      const current = JSON.parse(localStorage.getItem('bemore_settings_v1')||'{}') as Record<string, unknown>;
                      localStorage.setItem('bemore_settings_v1', JSON.stringify({ ...current, language: val }));
                    } catch {
                      // ignore
                    }
                    window.location.reload();
                  }}
                  value={(() => { try { return ((JSON.parse(localStorage.getItem('bemore_settings_v1')||'{}') as Record<string, unknown>).language as string) || 'ko'; } catch { return 'ko'; } })()}
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
                <ThemeToggle />
              </div>
              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-2 min-h-[36px] rounded-lg border text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
                aria-label="설정 열기"
              >설정</button>
              {/* Shortcuts Help Button */}
              <button
                onClick={() => setShowShortcutsHelp(true)}
                className="px-3 py-2 min-h-[36px] rounded-lg border text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
                aria-label="단축키 도움말 열기"
                title="키보드 단축키(?)"
              >?</button>
              {/* Session Timer */}
              <SessionTimer running={sessionStatus === 'active'} resetKey={sessionId} initialElapsedMs={sessionStartAt ? Date.now() - sessionStartAt : 0} />
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" role="alert">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 왼쪽: 비디오 피드 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 비디오 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/30 hover:shadow-soft-lg transition-all duration-300 p-3 sm:p-4 animate-fade-in-up">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">실시간 영상</h2>
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <VideoFeed
                  className="w-full h-full"
                  startTrigger={sessionId}
                  sessionId={sessionId}
                  landmarksWebSocket={landmarksWs}
                  onLandmarks={() => {
                    // Landmarks are sent directly via WebSocket in VideoFeed component
                    // when landmarksWebSocket is available and OPEN
                  }}
                />
                {sttText && <STTSubtitle text={sttText} />}
              </div>
            </div>

            {/* AI 채팅 - 모바일에서 숨김 */}
            <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/30 hover:shadow-soft-lg transition-all duration-300 p-3 sm:p-4 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">AI 대화</h2>
              <div className="h-80 sm:h-96">
                <Suspense fallback={<AIChatSkeleton />}>
                  <AIChat />
                </Suspense>
              </div>
            </div>
          </div>

          {/* 오른쪽: 사이드바 with Tabs */}
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/30 p-2">
              <div role="tablist" aria-label="분석 탭" className="flex gap-2">
                <button
                  role="tab"
                  aria-selected={sidebarTab==='analyze'}
                  className={`px-3 py-2 rounded-md text-sm ${sidebarTab==='analyze' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => setSidebarTab('analyze')}
                >분석</button>
                <button
                  role="tab"
                  aria-selected={sidebarTab==='result'}
                  className={`px-3 py-2 rounded-md text-sm ${sidebarTab==='result' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => setSidebarTab('result')}
                  disabled={sessionStatus!=='ended'}
                >결과</button>
              </div>
            </div>

            {sidebarTab === 'analyze' && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/30 p-3 sm:p-4 animate-slide-in-left">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">현재 감정</h2>
                  <EmotionCard emotion={currentEmotion} confidence={0.85} />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/30 hover:shadow-soft-lg transition-all duration-300 p-3 sm:p-4 animate-slide-in-left" style={{animationDelay: '0.1s'}}>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">음성 분석</h2>
                  <Suspense fallback={<VADMonitorSkeleton />}>
                    <VADMonitor metrics={DEMO_MODE ? demoVADMetrics : vadMetrics} />
                  </Suspense>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/30 hover:shadow-soft-lg transition-all duration-300 p-3 sm:p-4 animate-slide-in-left" style={{animationDelay: '0.2s'}}>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">시스템 상태</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">WebSocket</span>
                      <span className={`${wsConnected ? 'text-green-600' : 'text-red-600'} font-medium`}>
                        <span aria-hidden="true">● </span>
                        {wsConnected ? '연결됨' : '연결 끊김'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Landmarks</span>
                      <span className={`${connectionStatus.landmarks === 'connected' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'} font-medium`}>
                        <span aria-hidden="true">● </span>
                        {connectionStatus.landmarks}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Voice</span>
                      <span className={`${connectionStatus.voice === 'connected' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'} font-medium`}>
                        <span aria-hidden="true">● </span>
                        {connectionStatus.voice}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Session</span>
                      <span className={`${connectionStatus.session === 'connected' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'} font-medium`}>
                        <span aria-hidden="true">● </span>
                        {connectionStatus.session}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {sidebarTab === 'result' && (
              <div className="animate-slide-in-left" style={{animationDelay: '0.05s'}}>
                <SessionResult sessionId={(JSON.parse(localStorage.getItem('bemore_last_session')||'{}')?.sessionId) || sessionId || ''} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 모바일 하단 고정 세션 컨트롤 */}
      {sessionId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 sm:hidden shadow-lg z-20">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/30 hover:shadow-soft-lg transition-all duration-300 p-4">
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
      <footer className="mt-8 sm:mt-12 py-4 sm:py-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <p>BeMore - AI 기반 심리 상담 시스템</p>
          <p className="mt-1">Powered by MediaPipe, Gemini AI, Web Speech API</p>
          <div className="mt-2 space-x-4">
            <button className="underline" onClick={() => setShowPrivacy(true)}>개인정보 처리방침</button>
            <button className="underline" onClick={() => setShowTerms(true)}>이용약관</button>
          </div>
        </div>
      </footer>
      <ConsentDialog isOpen={isDialogOpen} onClose={() => { /* handled by context */ }} />
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <IdleTimeoutModal
        isOpen={idlePromptOpen}
        onContinue={() => setIdlePromptOpen(false)}
        onEnd={() => { if (sessionId) handleEndSession(); setIdlePromptOpen(false); }}
        secondsRemaining={idleSecondsRemaining}
      />
      <SessionSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onSubmitFeedback={async (rating, note) => {
          if (!sessionId) {
            throw new Error('세션 ID가 없습니다.');
          }
          try {
            console.log('📝 세션 피드백 제출 시작:', { rating, note, sessionId });
            const result = await sessionAPI.submitFeedback(sessionId, { rating, note });
            console.log('✅ 피드백 제출 성공:', result);
          } catch (err) {
            console.error('❌ 피드백 제출 실패:', err);
            throw err instanceof Error ? err : new Error('피드백 제출에 실패했습니다.');
          }
        }}
        durationLabel={sessionStartAt ? (() => {
          const ms = Date.now() - sessionStartAt;
          const s = Math.floor(ms / 1000);
          const m = Math.floor(s / 60);
          const h = Math.floor(m / 60);
          const mm = String(m % 60).padStart(2, '0');
          const ss = String(s % 60).padStart(2, '0');
          return h > 0 ? `${String(h).padStart(2,'0')}:${mm}:${ss}` : `${mm}:${ss}`;
        })() : '00:00'}
      />
      <ResumePromptModal isOpen={showResumePrompt} onResume={resumeLastSession} onDiscard={discardLastSession} sessionStartedAt={resumeSessionStartedAt} />
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <TermsOfServiceModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { useSettings } from '../../contexts/SettingsContext';
import { LoadingState, ErrorState, EmptyState } from '../../components/Common/States';

interface DashboardProps {
  onResumeSession?: () => void;
  onStartSession?: () => void;
}

export function Dashboard({ onResumeSession, onStartSession }: DashboardProps) {
  const navigate = useNavigate();
  const { apiStatus, apiError, retryApiSync } = useSettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLastSession, setHasLastSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await dashboardAPI.summary();
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : '로드 실패');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Check if there's a last session to resume
  useEffect(() => {
    try {
      const lastSession = localStorage.getItem('bemore_last_session');
      if (lastSession) {
        const parsed = JSON.parse(lastSession);
        if (parsed?.sessionId) {
          setHasLastSession(true);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  if (loading) return <LoadingState text="대시보드를 불러오는 중..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const today = data?.todayAvg || {};
  const trend = data?.trend?.dayOverDay || {};
  const recs: any[] = data?.recommendations || [];
  const recent: any[] = data?.recentSessions || [];

  return (
    <div className="space-y-4">
      {/* API Error Banner - Show connection issues */}
      {apiStatus === 'error' && apiError && (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-600 dark:to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-2 flex items-center">
                🔒 서버 연결 오류
              </h2>
              <p className="text-sm opacity-90 mb-4">
                {apiError.includes('CORS')
                  ? '백엔드 서버의 CORS 설정이 필요합니다.'
                  : '서버와의 연결이 끊어졌습니다. 인터넷 연결을 확인해주세요.'}
              </p>
              {apiError && (
                <p className="text-xs opacity-75 font-mono mb-4 bg-black bg-opacity-20 p-2 rounded">
                  {apiError}
                </p>
              )}
            </div>
            <button
              onClick={retryApiSync}
              className="ml-4 px-4 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap flex-shrink-0"
            >
              🔄 재시도
            </button>
          </div>
        </div>
      )}

      {/* Resume Last Session Banner - Show if last session exists */}
      {hasLastSession && onResumeSession && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">마지막 세션 재개</h2>
          <p className="text-sm opacity-90 mb-4">진행 중이던 상담 세션을 계속하실 수 있습니다</p>
          <button
            onClick={onResumeSession}
            className="px-6 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            🔄 세션 계속하기 →
          </button>
        </div>
      )}

      {/* Call-to-Action Banner */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">심리 상담 세션 시작하기</h2>
        <p className="text-sm opacity-90 mb-4">AI 심리 상담사와 함께 당신의 감정을 나누어 보세요</p>
        <button
          onClick={onStartSession || (() => navigate('/session'))}
          className="px-6 py-2 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          세션 시작 →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="text-xs text-gray-500">오늘 평균 VAD</div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] text-gray-500">V</div>
              <div className="text-lg font-semibold">{today.valence?.toFixed?.(2) ?? '-'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">A</div>
              <div className="text-lg font-semibold">{today.arousal?.toFixed?.(2) ?? '-'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">D</div>
              <div className="text-lg font-semibold">{today.dominance?.toFixed?.(2) ?? '-'}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="text-xs text-gray-500">전일 대비 변화</div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] text-gray-500">ΔV</div>
              <div className={`text-lg font-semibold ${trend.valence > 0 ? 'text-green-600' : trend.valence < 0 ? 'text-red-600' : ''}`}>{trend.valence?.toFixed?.(2) ?? '-'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">ΔA</div>
              <div className={`text-lg font-semibold ${trend.arousal > 0 ? 'text-green-600' : trend.arousal < 0 ? 'text-red-600' : ''}`}>{trend.arousal?.toFixed?.(2) ?? '-'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">ΔD</div>
              <div className={`text-lg font-semibold ${trend.dominance > 0 ? 'text-green-600' : trend.dominance < 0 ? 'text-red-600' : ''}`}>{trend.dominance?.toFixed?.(2) ?? '-'}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="text-xs text-gray-500">추천 행동</div>
          <ul className="mt-3 space-y-2 text-sm">
            {recs.length === 0 && <li>추천 없음</li>}
            {recs.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-gray-500 text-xs">{r.desc}</div>
                </div>
                <button className="px-2 py-1 text-xs rounded-md bg-primary-600 text-white hover:bg-primary-700">{r.cta || '진행'}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="text-xs text-gray-500 mb-2">최근 세션</div>
        {recent.length === 0 && <EmptyState title="최근 세션이 없습니다" desc="세션을 종료하면 이곳에 표시됩니다" />}
        <ul className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
          {recent.map((s) => (
            <li key={s.reportId} className="py-2 flex justify-between">
              <span className="font-mono text-xs">{s.sessionId}</span>
              <span className="text-gray-500">{new Date(s.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}



import { useEffect, useState } from 'react';
import { sessionAPI } from '../../services/api';

interface RecentSessionSummary {
  id: string;
  startedAt: string;
  durationMs: number;
}

export default function HistoryPage() {
  const [items, setItems] = useState<RecentSessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Placeholder: replace with real endpoint when backend ready
        const stats = await sessionAPI.getStats();
        const recent: RecentSessionSummary[] = (stats.recentSessions || []).map((s: any) => ({
          id: s.id,
          startedAt: s.startedAt,
          durationMs: s.durationMs,
        }));
        setItems(recent);
      } catch (e: any) {
        setError(e?.message || '히스토리를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">최근 세션 기록</h1>
        {loading && <div>불러오는 중...</div>}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-3 text-sm">{error}</div>
        )}
        {!loading && !error && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-xl shadow-soft">
            {items?.length ? items.map((s) => (
              <li key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">세션 ID: <span className="font-mono">{s.id.slice(0, 10)}...</span></div>
                  <div className="text-xs text-gray-500">시작: {new Date(s.startedAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {(Math.floor(s.durationMs/60000))}분 {Math.round((s.durationMs%60000)/1000)}초
                </div>
              </li>
            )) : (
              <li className="p-6 text-sm text-gray-500">기록이 없습니다.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}



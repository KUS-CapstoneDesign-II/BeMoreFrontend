import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../services/api';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <div className="p-4 text-sm text-gray-600">대시보드 불러오는 중…</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;

  const today = data?.todayAvg || {};
  const trend = data?.trend?.dayOverDay || {};
  const recs: any[] = data?.recommendations || [];
  const recent: any[] = data?.recentSessions || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="text-xs text-gray-500">오늘 평균 VAD</div>
          <div className="mt-2 text-sm">Valence: {today.valence?.toFixed?.(2) ?? '-'}</div>
          <div className="text-sm">Arousal: {today.arousal?.toFixed?.(2) ?? '-'}</div>
          <div className="text-sm">Dominance: {today.dominance?.toFixed?.(2) ?? '-'}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="text-xs text-gray-500">전일 대비 변화</div>
          <div className="mt-2 text-sm">ΔV: {trend.valence?.toFixed?.(2) ?? '-'}</div>
          <div className="text-sm">ΔA: {trend.arousal?.toFixed?.(2) ?? '-'}</div>
          <div className="text-sm">ΔD: {trend.dominance?.toFixed?.(2) ?? '-'}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="text-xs text-gray-500">추천 행동</div>
          <ul className="mt-2 space-y-1 text-sm">
            {recs.length === 0 && <li>추천 없음</li>}
            {recs.map((r) => <li key={r.id}><span className="font-medium">{r.title}</span> — {r.desc}</li>)}
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="text-xs text-gray-500 mb-2">최근 세션</div>
        <ul className="text-sm">
          {recent.length === 0 && <li>최근 세션이 없습니다</li>}
          {recent.map((s) => (
            <li key={s.reportId} className="py-1 flex justify-between">
              <span>{s.sessionId}</span>
              <span className="text-gray-500">{new Date(s.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}



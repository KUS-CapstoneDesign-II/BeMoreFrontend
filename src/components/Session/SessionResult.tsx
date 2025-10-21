import { useEffect, useState } from 'react';
import { sessionAPI } from '../../services/api';
import { VADTimeline } from '../Charts/VADTimeline';

interface Props {
  sessionId: string;
}

export function SessionResult({ sessionId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<{x:number; label?:string; color?:string}[]>([]);
  const [autoMarkers, setAutoMarkers] = useState<{x:number; label?:string; color?:string}[]>([]);
  const [selected, setSelected] = useState<{x:number; valence?:number|null; arousal?:number|null; dominance?:number|null} | null>(null);
  const [tab, setTab] = useState<'summary'|'details'|'pdf'>('summary');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await sessionAPI.getSummary(sessionId);
        if (mounted) setSummary(data);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load summary');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [sessionId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const report = await sessionAPI.getReport(sessionId);
        if (mounted) {
          setTimeline(report?.vadTimeline || []);
          // naive auto-markers: big valence delta, low arousal windows
          const tl = report?.vadTimeline || [];
          const mks: {x:number; label?:string; color?:string}[] = [];
          for (let i = 1; i < tl.length; i++) {
            const prev = tl[i-1];
            const cur = tl[i];
            const t = typeof cur.t === 'number' ? cur.t : (typeof cur.timestamp === 'number' ? cur.timestamp : i);
            if (typeof prev?.valence === 'number' && typeof cur?.valence === 'number') {
              const dv = Math.abs(cur.valence - prev.valence);
              if (dv > 0.5) mks.push({ x: t, label: '급변', color: '#ef4444' });
            }
            if (typeof cur?.arousal === 'number' && cur.arousal < -0.5) {
              mks.push({ x: t, label: '저각성', color: '#3b82f6' });
            }
          }
          setAutoMarkers(mks);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [sessionId]);

  const handleDownloadPdf = async () => {
    try {
      const blob = await sessionAPI.downloadPdf(sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bemore-report-${sessionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">결과를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  const vad = summary?.vadVector || { valence: '-', arousal: '-', dominance: '-' };
  const keyObs: string[] = summary?.keyObservations || [];
  const domEmotion = summary?.dominantEmotion?.emotion || '-';
  const cbt = summary?.cbt || { totalDistortions: 0, mostCommon: null };
  const recommendations: string[] = summary?.recommendations || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">세션 결과</h2>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-1 inline-flex gap-1 text-sm">
        <button onClick={() => setTab('summary')} className={`px-3 py-1 rounded-md ${tab==='summary'?'bg-white dark:bg-gray-800 shadow':''}`}>요약</button>
        <button onClick={() => setTab('details')} className={`px-3 py-1 rounded-md ${tab==='details'?'bg-white dark:bg-gray-800 shadow':''}`}>세부</button>
        <button onClick={() => setTab('pdf')} className={`px-3 py-1 rounded-md ${tab==='pdf'?'bg-white dark:bg-gray-800 shadow':''}`}>PDF</button>
      </div>

      {tab === 'summary' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40">
              <div className="text-xs text-gray-500">Valence</div>
              <div className="text-xl font-bold">{vad.valence}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40">
              <div className="text-xs text-gray-500">Arousal</div>
              <div className="text-xl font-bold">{vad.arousal}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40">
              <div className="text-xs text-gray-500">Dominance</div>
              <div className="text-xl font-bold">{vad.dominance}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">지배적 감정</div>
            <div className="text-base font-medium">{domEmotion}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">핵심 관찰</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-200">
              {keyObs.length === 0 && <li>관찰 항목 없음</li>}
              {keyObs.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40">
              <div className="text-xs text-gray-500 mb-1">CBT 하이라이트</div>
              <div className="text-sm">왜곡 총계: <span className="font-medium">{cbt.totalDistortions}</span></div>
              <div className="text-sm">가장 흔한 왜곡: <span className="font-medium">{cbt.mostCommon || '-'}</span></div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40">
              <div className="text-xs text-gray-500 mb-2">다음 행동 제안</div>
              <div className="flex flex-wrap gap-2">
                {(recommendations && recommendations.length ? recommendations : ['4-6 호흡', '감사 저널', '1분 스트레칭']).slice(0,3).map((r, i) => (
                  <button key={i} className="px-3 py-2 text-xs rounded-md bg-primary-600 text-white hover:bg-primary-700">{r}</button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'details' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const last = timeline[timeline.length - 1];
                const t = typeof last?.t === 'number' ? last.t : (typeof last?.timestamp === 'number' ? last.timestamp : timeline.length);
                setBookmarks((b) => [...b, { x: t, label: '북마크', color: '#10b981' }]);
              }}
              className="px-3 py-2 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >현재 시점 북마크</button>
            <button
              onClick={() => setBookmarks([])}
              className="px-3 py-2 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >북마크 초기화</button>
          </div>
          {selected && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 text-sm">
              <div className="text-xs text-gray-500 mb-1">선택한 시점</div>
              <div>t: {selected.x}</div>
              <div>V: {typeof selected.valence === 'number' ? selected.valence.toFixed(2) : '-'}</div>
              <div>A: {typeof selected.arousal === 'number' ? selected.arousal.toFixed(2) : '-'}</div>
              <div>D: {typeof selected.dominance === 'number' ? selected.dominance.toFixed(2) : '-'}</div>
            </div>
          )}
          <VADTimeline data={timeline} markers={[...autoMarkers, ...bookmarks]} onSelectPoint={(p) => setSelected(p)} />
        </div>
      )}

      {tab === 'pdf' && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-300">세션 리포트를 PDF로 저장할 수 있어요.</p>
          <button
            onClick={handleDownloadPdf}
            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
          >PDF로 저장</button>
        </div>
      )}
    </div>
  );
}



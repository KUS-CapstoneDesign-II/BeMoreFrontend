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
        if (mounted) setTimeline(report?.vadTimeline || []);
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
        </>
      )}

      {tab === 'details' && (
        <VADTimeline data={timeline} />
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



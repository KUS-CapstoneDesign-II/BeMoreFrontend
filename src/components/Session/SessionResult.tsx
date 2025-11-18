import { useEffect, useState } from 'react';
import { sessionAPI } from '../../services/api';
import { VADTimeline } from '../Charts/VADTimeline';
import { LoadingState, ErrorState } from '../Common/States';
import { Button, Card, MetricCard, TagPill, FilterBar } from '../Common';
import { CBTAnalysisSection } from './CBTAnalysisSection';

import type { VADMetrics, SessionReport } from '../../types';

interface Props {
  sessionId: string;
  onLoadingChange?: (isLoading: boolean) => void;
  vadMetrics?: VADMetrics | null;
}

export function SessionResult({ sessionId, onLoadingChange, vadMetrics }: Props) {
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [timeline, setTimeline] = useState<Array<Record<string, unknown>>>([]);
  const [bookmarks, setBookmarks] = useState<{x:number; label?:string; color?:string}[]>([]);
  const [autoMarkers, setAutoMarkers] = useState<{x:number; label?:string; color?:string; type?:'spike'|'low'}[]>([]);
  const [selected, setSelected] = useState<{x:number; valence?:number|null; arousal?:number|null; dominance?:number|null} | null>(null);
  const [filter, setFilter] = useState<{ spike:boolean; low:boolean; bookmark:boolean }>({ spike: true, low: true, bookmark: true });
  const [tab, setTab] = useState<'summary'|'details'|'pdf'>('summary');
  const [report, setReport] = useState<SessionReport | null>(null);

  // 🔧 FIX: Fallback sessionId from localStorage if prop is null
  // When session ends, sessionId state in App becomes null before this component
  // loads, so we retrieve it from localStorage where it was saved
  const [effectiveSessionId, setEffectiveSessionId] = useState<string>(sessionId);

  // 🔧 FIX: Preserve vadMetrics in local state to handle async prop updates
  // Parent component passes vadMetrics as prop, but it might come after SessionResult renders
  // Store it locally so it persists even if prop becomes undefined later
  const [preservedVadMetrics, setPreservedVadMetrics] = useState<VADMetrics | null>(null);

  useEffect(() => {
    if (vadMetrics) {
      setPreservedVadMetrics(vadMetrics);
      if (import.meta.env.DEV) {
        console.log('🎤 SessionResult received VAD metrics:', {
          speechRatio: (vadMetrics.speechRatio * 100).toFixed(1) + '%',
          pauseRatio: (vadMetrics.pauseRatio * 100).toFixed(1) + '%',
          speechBurstCount: vadMetrics.speechBurstCount,
        });
      }
    }
  }, [vadMetrics]);

  // 🔧 FIX: Load sessionId and VAD metrics from localStorage if prop is not provided
  // When session ends, the parent component sets sessionId to null immediately
  // We need to retrieve both from localStorage where they were saved
  useEffect(() => {
    if (!sessionId) {
      try {
        const lastSession = JSON.parse(localStorage.getItem('bemore_last_session') || '{}');
        if (lastSession.sessionId) {
          setEffectiveSessionId(lastSession.sessionId);
          if (import.meta.env.DEV) {
            console.log('📋 Loaded sessionId from localStorage:', lastSession.sessionId);
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to load sessionId from localStorage:', error);
        }
      }
    } else {
      setEffectiveSessionId(sessionId);
    }
  }, [sessionId]);

  // 🔧 FIX: Load VAD metrics from localStorage if prop is not provided
  // When session ends and WebSocket disconnects, the parent may not have vadMetrics to pass
  // Fallback to localStorage where we saved it during session end
  useEffect(() => {
    if (!preservedVadMetrics && !vadMetrics && effectiveSessionId) {
      try {
        const lastSession = JSON.parse(localStorage.getItem('bemore_last_session') || '{}');
        if (lastSession.vadMetrics) {
          setPreservedVadMetrics(lastSession.vadMetrics);
          if (import.meta.env.DEV) {
            console.log('🎤 Loaded VAD metrics from localStorage:', {
              speechRatio: (lastSession.vadMetrics.speechRatio * 100).toFixed(1) + '%',
              pauseRatio: (lastSession.vadMetrics.pauseRatio * 100).toFixed(1) + '%',
              speechBurstCount: lastSession.vadMetrics.speechBurstCount,
            });
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to load VAD metrics from localStorage:', error);
        }
      }
    }
  }, [effectiveSessionId, preservedVadMetrics, vadMetrics]);

  // 🔧 FIX: Loading state management - sync with both summary and report loading
  // This ensures UI doesn't show incomplete data while one API is still loading
  useEffect(() => {
    const isLoading = summaryLoading || reportLoading;
    setLoading(isLoading);
    if (import.meta.env.DEV) {
      console.log('📊 Loading state updated:', { summaryLoading, reportLoading, isLoading });
    }
  }, [summaryLoading, reportLoading]);

  // 🎬 로딩 상태 변경 알림
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    // effectiveSessionId가 없으면 API 호출 하지 않음
    if (!effectiveSessionId) {
      setSummary({});
      setSummaryLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const data = await sessionAPI.getSummary(effectiveSessionId);
        if (mounted) setSummary(data as Record<string, unknown>);
      } catch (e) {
        // 요약 데이터 실패 시 기본값으로 계속 진행
        // 개발 환경에서만 로그 출력
        if (import.meta.env.DEV) {
          console.warn('⚠️ Summary API failed, using default values:', e instanceof Error ? e.message : 'Unknown error');
        }
        if (mounted) setSummary({});
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [effectiveSessionId]);

  useEffect(() => {
    // effectiveSessionId가 없으면 API 호출 하지 않음
    if (!effectiveSessionId) {
      setTimeline([]);
      setAutoMarkers([]);
      setReportLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const reportData = await sessionAPI.getReport(effectiveSessionId);
        if (mounted) {
          setReport(reportData);
          setTimeline(reportData?.vadTimeline || []);
          // naive auto-markers: big valence delta, low arousal windows
          const tl = reportData?.vadTimeline || [];
          const mks: {x:number; label?:string; color?:string; type?:'spike'|'low'}[] = [];
          for (let i = 1; i < tl.length; i++) {
            const prev = tl[i-1];
            const cur = tl[i];
            if (!prev || !cur) continue;

            const t = typeof cur.t === 'number' ? cur.t : (typeof cur.timestamp === 'number' ? cur.timestamp : i);
            if (typeof prev.valence === 'number' && typeof cur.valence === 'number') {
              const dv = Math.abs(cur.valence - prev.valence);
              if (dv > 0.5) mks.push({ x: t, label: '급변', color: '#ef4444', type: 'spike' });
            }
            if (typeof cur.arousal === 'number' && cur.arousal < -0.5) {
              mks.push({ x: t, label: '저각성', color: '#3b82f6', type: 'low' });
            }
          }
          setAutoMarkers(mks);
        }
      } catch (e) {
        // 리포트 데이터 실패 시 무시하고 진행
        // 개발 환경에서만 로그 출력
        if (import.meta.env.DEV) {
          console.warn('⚠️ Report API failed, using empty timeline:', e instanceof Error ? e.message : 'Unknown error');
        }
        if (mounted) {
          setReport(null);
          setTimeline([]);
          setAutoMarkers([]);
        }
      } finally {
        if (mounted) setReportLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [effectiveSessionId]);

  const handleDownloadPdf = async () => {
    try {
      const blob = await sessionAPI.downloadPdf(effectiveSessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bemore-report-${effectiveSessionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to download PDF');
    }
  };

  if (loading) return <LoadingState text="결과를 불러오는 중..." />;

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  // 🔧 Calculate VAD averages from timeline data
  const calculateVadAverages = () => {
    if (!timeline || timeline.length === 0) {
      return { valence: '-', arousal: '-', dominance: '-' };
    }

    let valenceSum = 0, arousalSum = 0, dominanceSum = 0;
    let valenceCount = 0, arousalCount = 0, dominanceCount = 0;

    for (const point of timeline) {
      if (typeof point.valence === 'number') {
        valenceSum += point.valence;
        valenceCount++;
      }
      if (typeof point.arousal === 'number') {
        arousalSum += point.arousal;
        arousalCount++;
      }
      if (typeof point.dominance === 'number') {
        dominanceSum += point.dominance;
        dominanceCount++;
      }
    }

    return {
      valence: valenceCount > 0 ? (valenceSum / valenceCount).toFixed(2) : '-',
      arousal: arousalCount > 0 ? (arousalSum / arousalCount).toFixed(2) : '-',
      dominance: dominanceCount > 0 ? (dominanceSum / dominanceCount).toFixed(2) : '-'
    };
  };

  const vad = (summary?.vadVector as { valence?: string | number; arousal?: string | number; dominance?: string | number } | undefined)
    ?? calculateVadAverages();
  const keyObs: string[] = Array.isArray((summary as Record<string, unknown>)?.keyObservations)
    ? ((summary as Record<string, unknown>).keyObservations as string[])
    : [];
  const domEmotion = ((summary?.dominantEmotion as { emotion?: string } | undefined)?.emotion) || '-';

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">세션 결과</h2>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <div className="relative group">
            <TagPill
              active={tab === 'summary'}
              onClick={() => setTab('summary')}
              disabled={loading}
              title={loading ? '데이터를 로드하는 중입니다...' : ''}
              className={loading ? 'opacity-50 cursor-not-allowed' : ''}
            >
              📊 요약
            </TagPill>
            {loading && (
              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                세션 종료 후 사용 가능합니다
              </div>
            )}
          </div>
          <div className="relative group">
            <TagPill
              active={tab === 'details'}
              onClick={() => setTab('details')}
              disabled={loading}
              title={loading ? '데이터를 로드하는 중입니다...' : ''}
              className={loading ? 'opacity-50 cursor-not-allowed' : ''}
            >
              📈 세부
            </TagPill>
            {loading && (
              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                세션 종료 후 사용 가능합니다
              </div>
            )}
          </div>
          <div className="relative group">
            <TagPill
              active={tab === 'pdf'}
              onClick={() => setTab('pdf')}
              disabled={loading}
              title={loading ? '데이터를 로드하는 중입니다...' : ''}
              className={loading ? 'opacity-50 cursor-not-allowed' : ''}
            >
              📄 PDF
            </TagPill>
            {loading && (
              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                세션 종료 후 사용 가능합니다
              </div>
            )}
          </div>
        </div>
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

          {/* CBT 분석 결과 */}
          {report && report.cbtFindings && report.cbtFindings.length > 0 && (
            <CBTAnalysisSection cbtFindings={report.cbtFindings} />
          )}

          {/* 🎤 Speech Analysis (VAD Metrics) */}
          {preservedVadMetrics && (
            <Card className="p-6 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                🎤 음성 분석
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard
                  label="발화 비율"
                  value={`${(preservedVadMetrics.speechRatio * 100).toFixed(1)}%`}
                  color="blue"
                  icon="🗣️"
                />
                <MetricCard
                  label="침묵 비율"
                  value={`${(preservedVadMetrics.pauseRatio * 100).toFixed(1)}%`}
                  color="gray"
                  icon="🤐"
                />
                <MetricCard
                  label="평균 침묵"
                  value={`${(preservedVadMetrics.averagePauseDuration / 1000).toFixed(2)}s`}
                  color="violet"
                  icon="⏱️"
                />
                <MetricCard
                  label="최장 침묵"
                  value={`${(preservedVadMetrics.longestPause / 1000).toFixed(2)}s`}
                  color="red"
                  icon="⏰"
                />
                <MetricCard
                  label="발화 횟수"
                  value={`${preservedVadMetrics.speechBurstCount}회`}
                  color="emerald"
                  icon="📊"
                />
                <MetricCard
                  label="침묵 구간"
                  value={`${preservedVadMetrics.pauseCount}회`}
                  color="blue"
                  icon="⏸️"
                />
              </div>
              {preservedVadMetrics.summary && (
                <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-blue-600 dark:text-blue-400">분석: </span>
                    {preservedVadMetrics.summary}
                  </p>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {tab === 'details' && (
        <div className="space-y-4">
          {/* Sticky toolbar */}
          <Card className="p-4 sticky top-0 z-10 space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="neutral"
                  onClick={() => {
                    const last = timeline[timeline.length - 1];
                    if (!last) return;

                    const t = typeof last.t === 'number' ? last.t : (typeof last.timestamp === 'number' ? last.timestamp : timeline.length);
                    setBookmarks((b) => [...b, { x: t, label: '북마크', color: '#10b981' }]);
                  }}
                  className="text-xs"
                >
                  📍 북마크 추가
                </Button>
                <Button
                  variant="neutral"
                  onClick={() => setBookmarks([])}
                  className="text-xs"
                >
                  🗑️ 초기화
                </Button>
              </div>

              {/* Marker filters */}
              <FilterBar
                filters={[
                  { id: 'spike', label: '급변', icon: '📈' },
                  { id: 'low', label: '저각성', icon: '📉' },
                  { id: 'bookmark', label: '북마크', icon: '📍' },
                ]}
                activeFilter={`${filter.spike}-${filter.low}-${filter.bookmark}`}
                onFilterChange={(id) => {
                  if (id === 'spike') setFilter(f => ({...f, spike: !f.spike}));
                  if (id === 'low') setFilter(f => ({...f, low: !f.low}));
                  if (id === 'bookmark') setFilter(f => ({...f, bookmark: !f.bookmark}));
                }}
              />
            </div>

            {/* CSV export (backend-generated) */}
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button
                variant="neutral"
                onClick={async () => {
                  try {
                    const blob = await sessionAPI.downloadCsv(effectiveSessionId, 'vad');
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vad-timeline-${effectiveSessionId}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to download VAD CSV');
                  }
                }}
                className="text-xs"
              >
                📊 VAD CSV
              </Button>
              <Button
                variant="neutral"
                onClick={async () => {
                  try {
                    const blob = await sessionAPI.downloadCsv(effectiveSessionId, 'emotion');
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `emotion-timeline-${effectiveSessionId}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to download Emotion CSV');
                  }
                }}
                className="text-xs"
              >
                😊 감정 CSV
              </Button>
            </div>
          </Card>
          {selected && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 text-sm">
              <div className="text-xs text-gray-500 mb-1">선택한 시점</div>
              <div>t: {selected.x}</div>
              <div>V: {typeof selected.valence === 'number' ? selected.valence.toFixed(2) : '-'}</div>
              <div>A: {typeof selected.arousal === 'number' ? selected.arousal.toFixed(2) : '-'}</div>
              <div>D: {typeof selected.dominance === 'number' ? selected.dominance.toFixed(2) : '-'}</div>
            </div>
          )}
          <VADTimeline
            data={timeline}
            markers={[
              ...autoMarkers.filter(m => (m.type === 'spike' ? filter.spike : m.type === 'low' ? filter.low : true)),
              ...(filter.bookmark ? bookmarks : [])
            ]}
            onSelectPoint={(p) => setSelected(p)}
          />
        </div>
      )}

      {tab === 'pdf' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">📄 PDF 리포트</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">세션 리포트를 PDF로 다운로드하여 보관할 수 있습니다.</p>
          </div>
          <Button
            variant="primary"
            onClick={handleDownloadPdf}
          >
            📥 PDF 다운로드
          </Button>
        </div>
      )}
    </Card>
  );
}



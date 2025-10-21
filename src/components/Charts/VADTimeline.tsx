import { useMemo } from 'react';

type VADPoint = {
  [key: string]: any;
  valence?: number;
  arousal?: number;
  dominance?: number;
  t?: number;
  timestamp?: number;
};

interface Props {
  data: VADPoint[];
  height?: number;
}

export function VADTimeline({ data, height = 140 }: Props) {
  const width = 480;

  const processed = useMemo(() => {
    const points = (data || []).map((d, i) => ({
      x: typeof d.t === 'number' ? d.t : (typeof d.timestamp === 'number' ? d.timestamp : i),
      valence: typeof d.valence === 'number' ? d.valence : null,
      arousal: typeof d.arousal === 'number' ? d.arousal : null,
      dominance: typeof d.dominance === 'number' ? d.dominance : null,
    }));

    const xs = points.map(p => p.x);
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 1;

    const values: number[] = [];
    points.forEach(p => {
      if (typeof p.valence === 'number') values.push(p.valence);
      if (typeof p.arousal === 'number') values.push(p.arousal);
      if (typeof p.dominance === 'number') values.push(p.dominance);
    });
    const minY = values.length ? Math.min(...values) : -1;
    const maxY = values.length ? Math.max(...values) : 1;
    const padY = (maxY - minY) * 0.1 || 0.2;

    const scaleX = (x: number) => {
      if (maxX === minX) return 0;
      return ((x - minX) / (maxX - minX)) * (width - 40) + 20;
    };
    const scaleY = (y: number) => {
      const ymin = minY - padY;
      const ymax = maxY + padY;
      if (ymax === ymin) return height / 2;
      return height - ((y - ymin) / (ymax - ymin)) * (height - 30) - 15;
    };

    const linePath = (key: 'valence' | 'arousal' | 'dominance') => {
      const filtered = points.filter(p => typeof p[key] === 'number');
      if (!filtered.length) return '';
      return filtered.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p[key] as number)}`).join(' ');
    };

    return {
      minY: minY - padY,
      maxY: maxY + padY,
      paths: {
        valence: linePath('valence'),
        arousal: linePath('arousal'),
        dominance: linePath('dominance'),
      }
    };
  }, [data, height]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-500">VAD Timeline</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block"/>Valence</span>
          <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block"/>Arousal</span>
          <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block"/>Dominance</span>
        </div>
      </div>
      <svg width={width} height={height} role="img" aria-label="VAD timeline chart">
        <rect x={0} y={0} width={width} height={height} fill="transparent" />
        {processed.paths.valence && (
          <path d={processed.paths.valence} stroke="#ef4444" strokeWidth={2} fill="none" />
        )}
        {processed.paths.arousal && (
          <path d={processed.paths.arousal} stroke="#3b82f6" strokeWidth={2} fill="none" />
        )}
        {processed.paths.dominance && (
          <path d={processed.paths.dominance} stroke="#22c55e" strokeWidth={2} fill="none" />
        )}
      </svg>
      <div className="mt-1 text-[10px] text-gray-400">Range: {processed.minY.toFixed(2)} ~ {processed.maxY.toFixed(2)}</div>
    </div>
  );
}



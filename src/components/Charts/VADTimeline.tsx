import { useMemo, useState } from 'react';

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
  const [visible, setVisible] = useState<{valence:boolean; arousal:boolean; dominance:boolean}>({ valence: true, arousal: true, dominance: true });
  const [hover, setHover] = useState<{x:number; y:number} | null>(null);

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
      minX,
      maxX,
      points,
      scaleX,
      scaleY,
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
        <div className="flex items-center gap-3 text-xs select-none">
          <button onClick={() => setVisible(v => ({...v, valence: !v.valence}))} className={`inline-flex items-center gap-1 ${visible.valence ? '' : 'opacity-50'}`}>
            <span className="w-3 h-0.5 bg-red-500 inline-block"/>
            Valence
          </button>
          <button onClick={() => setVisible(v => ({...v, arousal: !v.arousal}))} className={`inline-flex items-center gap-1 ${visible.arousal ? '' : 'opacity-50'}`}>
            <span className="w-3 h-0.5 bg-blue-500 inline-block"/>
            Arousal
          </button>
          <button onClick={() => setVisible(v => ({...v, dominance: !v.dominance}))} className={`inline-flex items-center gap-1 ${visible.dominance ? '' : 'opacity-50'}`}>
            <span className="w-3 h-0.5 bg-green-500 inline-block"/>
            Dominance
          </button>
        </div>
      </div>
      <svg width={width} height={height} role="img" aria-label="VAD timeline chart"
        onMouseMove={(e) => {
          const rect = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
          setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => setHover(null)}
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" />
        {processed.paths.valence && visible.valence && (
          <path d={processed.paths.valence} stroke="#ef4444" strokeWidth={2} fill="none" />
        )}
        {processed.paths.arousal && visible.arousal && (
          <path d={processed.paths.arousal} stroke="#3b82f6" strokeWidth={2} fill="none" />
        )}
        {processed.paths.dominance && visible.dominance && (
          <path d={processed.paths.dominance} stroke="#22c55e" strokeWidth={2} fill="none" />
        )}

        {hover && processed.points.length > 0 && (
          (() => {
            // find nearest by x
            const invX = (px: number) => {
              const { minX, maxX, scaleX } = processed as any;
              // approximate inverse by scanning
              let best = processed.points[0];
              let bestDist = Infinity;
              for (const p of processed.points) {
                const sx = scaleX(p.x);
                const d = Math.abs(sx - px);
                if (d < bestDist) { bestDist = d; best = p; }
              }
              return best;
            };
            const nearest = invX(hover.x);
            const cx = (processed as any).scaleX(nearest.x);
            const vals: Array<{label:string;color:string;value:number|null}> = [
              { label: 'V', color: '#ef4444', value: nearest.valence as any },
              { label: 'A', color: '#3b82f6', value: nearest.arousal as any },
              { label: 'D', color: '#22c55e', value: nearest.dominance as any },
            ];
            return (
              <g>
                <line x1={cx} x2={cx} y1={10} y2={height-10} stroke="#9ca3af" strokeDasharray="4 4" />
                {/* Tooltip box */}
                <rect x={Math.min(Math.max(cx + 8, 0), width-120)} y={8} width={112} height={52} rx={6} fill="#111827" opacity={0.9} />
                {vals.map((v, i) => (
                  <g key={i}>
                    <circle cx={Math.min(Math.max(cx + 14, 8), width-106)} cy={18 + i*12} r={3} fill={v.color} />
                    <text x={Math.min(Math.max(cx + 22, 16), width-98)} y={21 + i*12} fontSize={10} fill="#e5e7eb">
                      {v.label}: {typeof v.value === 'number' ? v.value.toFixed(2) : '-'}
                    </text>
                  </g>
                ))}
              </g>
            );
          })()
        )}
      </svg>
      <div className="mt-1 text-[10px] text-gray-400">Range: {processed.minY.toFixed(2)} ~ {processed.maxY.toFixed(2)}</div>
    </div>
  );
}



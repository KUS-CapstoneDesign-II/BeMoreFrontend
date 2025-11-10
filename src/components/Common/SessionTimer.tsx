import { useEffect, useMemo, useRef, useState } from 'react';

interface SessionTimerProps {
  running: boolean;
  resetKey: string | null; // change resets timer
  initialElapsedMs?: number; // resume support
  className?: string;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = hours > 0 ? String(hours).padStart(2, '0') + ':' : '';
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}${mm}:${ss}`;
}

export function SessionTimer({ running, resetKey, initialElapsedMs = 0, className }: SessionTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(initialElapsedMs);
  const lastStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Reset on key change
  useEffect(() => {
    setElapsedMs(0);
    lastStartRef.current = running ? performance.now() : null;
    if (!running && rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [resetKey, running]);

  // Handle running state changes
  useEffect(() => {
    if (running) {
      if (lastStartRef.current == null) lastStartRef.current = performance.now();
      const tick = () => {
        if (lastStartRef.current != null) {
          setElapsedMs((acc) => {
            const base = acc;
            const delta = performance.now() - lastStartRef.current!;
            return base + delta;
          });
          lastStartRef.current = performance.now();
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
    } else {
      // Paused: ensure we stop ticking
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastStartRef.current = null;
    }
  }, [running]);

  const label = useMemo(() => formatDuration(elapsedMs), [elapsedMs]);

  return (
    <span className={className || 'font-mono text-xs sm:text-sm text-gray-600 dark:text-gray-300'} aria-label="세션 타이머">
      {label}
    </span>
  );
}

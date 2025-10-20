import { useEffect, useRef, useState } from 'react';

interface UseIdleTimeoutOptions {
  idleMs: number;
  onIdle: () => void;
}

export function useIdleTimeout({ idleMs, onIdle }: UseIdleTimeoutOptions) {
  const timerRef = useRef<number | null>(null);
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    const reset = () => {
      setIsIdle(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setIsIdle(true);
        onIdle();
      }, idleMs);
    };

    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'wheel', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [idleMs, onIdle]);

  return { isIdle };
}

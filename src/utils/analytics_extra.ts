import { trackEvent, trackTiming } from './analytics';

export function markAndMeasure(name: string, fn: () => void) {
  const start = performance.now();
  try { fn(); } finally { trackTiming(name, performance.now() - start); }
}

export function funnelEvent(step: string, extra?: Record<string, any>) {
  // Scrub potentially sensitive fields
  const sanitized: Record<string, any> = {};
  if (extra) {
    for (const k of Object.keys(extra)) {
      if (/name|email|phone|address|token|id/i.test(k)) continue;
      sanitized[k] = typeof extra[k] === 'string' && extra[k].length > 64 ? extra[k].slice(0, 64) : extra[k];
    }
  }
  trackEvent(`funnel_${step}`, sanitized);
}

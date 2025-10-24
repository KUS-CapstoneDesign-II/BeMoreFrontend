import { trackEvent, trackTiming } from './analytics';

export function markAndMeasure(name: string, fn: () => void) {
  const start = performance.now();
  try { fn(); } finally { trackTiming(name, performance.now() - start); }
}

export function funnelEvent(step: string, extra?: Record<string, unknown>) {
  // Scrub potentially sensitive fields
  const sanitized: Record<string, unknown> = {};
  if (extra) {
    for (const k of Object.keys(extra)) {
      if (/name|email|phone|address|token|id/i.test(k)) continue;
      const v = extra[k];
      sanitized[k] = typeof v === 'string' && v.length > 64 ? v.slice(0, 64) : v;
    }
  }
  trackEvent(`funnel_${step}`, sanitized);
}

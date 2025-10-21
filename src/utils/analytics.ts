import type { ConsentState } from '../contexts/ConsentContext';

let gaInitialized = false;

function hasWindowGA() {
  return typeof window !== 'undefined' && (window as any).gtag;
}

function injectGAScript(measurementId: string) {
  if (document.getElementById('ga-script')) return;
  const s1 = document.createElement('script');
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  s1.id = 'ga-script';
  document.head.appendChild(s1);

  const s2 = document.createElement('script');
  s2.id = 'ga-init';
  s2.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${measurementId}', { anonymize_ip: true });`;
  document.head.appendChild(s2);
}

export function initAnalytics(consent: ConsentState | null, respectDNT: boolean) {
  const id = import.meta.env.VITE_GA_ID as string | undefined;
  if (!id) return;
  if (respectDNT) return;
  if (!consent?.analytics) return;
  injectGAScript(id);
  gaInitialized = true;
}

export function trackEvent(name: string, params?: Record<string, any>) {
  if (!gaInitialized || !hasWindowGA()) return;
  (window as any).gtag('event', name, params || {});
}

export function trackTiming(name: string, ms: number) {
  trackEvent('timing_complete', { name, value: Math.round(ms) });
}

export function trackPageView(path: string) {
  if (!gaInitialized || !hasWindowGA()) return;
  (window as any).gtag('event', 'page_view', { page_path: path });
}

// Web Vitals/Performance metrics mapping to GA timings
export function trackWebVitals(metrics: {
  LCP?: number;
  firstContentfulPaint?: number;
  loadTime?: number;
  domContentLoaded?: number;
}) {
  if (metrics.firstContentfulPaint != null) trackTiming('FCP', metrics.firstContentfulPaint);
  if (metrics.LCP != null) trackTiming('LCP', metrics.LCP);
  if (metrics.loadTime != null) trackTiming('PageLoad', metrics.loadTime);
  if (metrics.domContentLoaded != null) trackTiming('DOMReady', metrics.domContentLoaded);
}

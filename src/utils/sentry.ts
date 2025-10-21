import type { ConsentState } from '../contexts/ConsentContext';

let sentryInitialized = false;

export function initSentry(consent: ConsentState | null, respectDNT: boolean) {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  if (respectDNT) return;
  if (!consent?.crashReporting) return;
  // Lazy import to avoid bundle impact
  import('@sentry/browser').then((Sentry: any) => {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
    sentryInitialized = true;
  }).catch(() => {});
}

export function captureError(error: unknown) {
  if (!sentryInitialized) return;
  import('@sentry/browser').then((Sentry: any) => {
    Sentry.captureException(error);
  }).catch(() => {});
}

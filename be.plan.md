<!-- b868f1ff-656e-4c83-b8e8-0474d827e811 acf2edc2-e020-408d-83d3-3f78018d535f -->
# BeMore Frontend Improvement Plan

## Decision: Environment Strategy

- Choose stage+prod now with Vercel previews; keep on‑prem readiness in parallel.
- Rationale
  - Stage+prod: faster iteration, preview deployments, minimal ops.
  - On‑prem: kept ready via Docker, NGINX, runtime env injection; activate when required.

## Phase 1 — Stabilization & Security

- CSP hardening (vercel.json)
  - Add: frame-ancestors 'none', base-uri 'self', object-src 'none', upgrade-insecure-requests.
  - Restrict script-src to 'self' jsdelivr only if required; add worker-src 'self' blob:; connect-src include stage/prod APIs and wss endpoints.
  - Example (adapt domains):
```text
Content-Security-Policy:
 default-src 'self';
 base-uri 'self'; frame-ancestors 'none'; object-src 'none';
 img-src 'self' data: https:; media-src 'self' blob:; font-src 'self' data:;
 script-src 'self' https://cdn.jsdelivr.net;
 style-src 'self' 'unsafe-inline'; worker-src 'self' blob:;
 connect-src 'self' https://api.stage.example.com wss://api.stage.example.com https://api.prod.example.com wss://api.prod.example.com https://vitals.vercel-insights.com;
 upgrade-insecure-requests;
```

- Centralize API base URL and timeouts (`src/services/api.ts`)
  - Use envs: `VITE_API_URL`, fallback to `window.__ENV__.API_URL` when present.
  - Add axios interceptors for request id, error mapping, and 10s timeout.
- WebSocket robustness (`src/hooks/useWebSocket.ts`, `src/services/websocket.ts`)
  - Exponential backoff reconnect, heartbeat ping/pong, pause on hidden tab, network offline awareness.
- Sentry & analytics privacy
  - Respect consent/DNT (already), add PII scrubbing and sampling controls in `utils/sentry.ts`, `utils/analytics.ts`.
- PWA/service worker hardening
  - Versioned cache, offline fallback page, safe caching rules in `public/sw.js`, `utils/registerSW.ts`.

## Phase 2 — Quality Bar (TDD/CI)

- Unit/integration tests
  - Add Vitest + Testing Library; 80% coverage target across `src/components`, `src/hooks`, `src/services`.
- E2E smoke tests
  - Add Playwright: onboarding → start session → websocket connect → end session flow.
- Static checks
  - Enforce `tsc --noEmit`, ESLint on CI; add pre-commit hooks (husky + lint-staged).
- CI pipeline
  - GitHub Actions: install → typecheck → lint → unit tests → e2e (PR labels) → upload coverage. Vercel previews on PR.

## Phase 3 — UX & Performance

- Routing & code-splitting
  - Introduce `react-router-dom` routes: `/` (Dashboard), `/session`, `/history`, `/settings` with lazy routes; keep `AIChat`, `VADMonitor` lazy.
- Bundle & metrics
  - Add bundle analyzer, define budgets; prefetch on hover; split MediaPipe vendor to async chunk only when needed.
- Performance work
  - Move heavy MediaPipe to a Web Worker if feasible; maintain UI responsive.
  - Enhance skeleton/loading states; reduce layout shifts.
- Resilience
  - Improve NetworkStatusBanner with retry CTA; graceful degradation for DEMO_MODE.

## Phase 4 — Feature Polish

- AIChat UX
  - Streaming messages, retry/send state, error toasts.
- History & Analytics
  - New page with recent sessions and VAD/Emotion summaries; server API integration via `sessionAPI`.
- Settings & i18n
  - Persisted settings schema (zod), i18n infra (ko/en), accessible modals/focus traps.
- Accessibility
  - Axe audit, labels/roles, keyboard focus outlines; fix contrast issues.

## Deployment & On‑Prem Readiness

- Stage/prod with Vercel
  - Branch mapping: PR→preview, develop→stage, main→prod.
  - Env vars per env: `VITE_API_URL`, `VITE_WS_URL`, `SENTRY_DSN`, analytics keys.
  - CSP per env in `vercel.json` with correct domains.
- On‑prem path (ready but optional now)
  - Dockerfile (multi‑stage) + NGINX; runtime env via `/env.js` that sets `window.__ENV__`.
  - Helm chart for k8s (service, ingress with CSP headers), documentation.

## Small but Important Security/UX Items

- Sanitize STT text before render; length caps for user-visible fields.
- WS URL builder forces wss: in prod; error toasts localized.

## Acceptance Criteria

- All CI checks green; unit coverage ≥80%; key E2E passes.
- LCP < 2.5s on fast 3G for landing; no CSP violations in console.
- WebSocket auto-reconnect works; offline handling visible.
- Stage and prod deployable via branch mapping; on‑prem build produces a working container.

### To-dos

- [x] Harden CSP and security headers in vercel.json
- [x] Centralize API base URL with env and axios interceptors
- [x] Add WS reconnect/heartbeat/offline handling
- [x] Harden service worker caching and offline fallback
- [x] Add Vitest + Testing Library and coverage setup
- [x] Add Playwright E2E smoke tests
- [x] Create CI pipeline for typecheck/lint/tests/coverage
- [x] Add husky + lint-staged pre-commit hooks
- [x] Introduce react-router routes and lazy splits
- [x] Add bundle analyzer and define budgets
- [x] Move heavy MediaPipe work off main thread
- [x] Enhance network status and retries UX
- [x] Streamed AIChat UX with error/retry states
- [x] Implement History/Analytics page and APIs
- [x] Persisted settings schema and ko/en i18n
- [x] Run axe and fix a11y issues
- [x] Configure stage/prod envs and branch mapping
- [x] Add Dockerfile+NGINX with runtime env injection
- [ ] Provide Helm chart and deployment docs


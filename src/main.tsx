// CI/CD Pipeline Test - 2025-01-12
// Testing GitHub Actions E2E Session Flow Verification workflow

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './AppRouter'
import { ThemeProvider } from './contexts/ThemeContext'
import { ConsentProvider } from './contexts/ConsentContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { I18nProvider } from './contexts/I18nContext'
import { ToastProvider } from './contexts/ToastContext'
import { ErrorBoundary } from './components/Common/ErrorBoundary'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { ModalManagerProvider } from './contexts/ModalManagerContext'
import { SessionContextProvider } from './contexts/SessionContext'
import { NetworkContextProvider } from './contexts/NetworkContext'
import { registerServiceWorker, initPWAInstall } from './utils/registerSW'
import { initA11y } from './utils/a11y'
import { initializeSecurity } from './utils/security'
import { fontCSSVariables } from './utils/fontOptimization'
import { initWebVitals, sendVitalsToAnalytics } from './utils/webVitals'
import { initPerformanceReporting, performanceReporting } from './utils/performanceReporting'

// PWA 초기화
if (import.meta.env.PROD) {
  registerServiceWorker();
  initPWAInstall();
}

// 🔒 보안 초기화 (HTTPS, CSP, HSTS 등)
initializeSecurity();

// 📝 폰트 최적화 초기화 (font-display: swap, 시스템 폰트)
const styleSheet = document.createElement('style');
styleSheet.textContent = fontCSSVariables;
document.head.appendChild(styleSheet);

// Google Fonts 로드 (선택사항, 필요 시 활성화)
// addGoogleFontsLink('Inter', [400, 500, 600, 700]);

// Dev a11y checks (axe)
if (import.meta.env.DEV) {
  initA11y();
}

// 📊 성능 모니터링 초기화 (Web Vitals + Performance Reporting)
initPerformanceReporting();
initWebVitals((metric) => {
  sendVitalsToAnalytics(metric);
  performanceReporting.recordMetric(metric);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConsentProvider>
      <SettingsProvider>
        <ThemeProvider>
          <I18nProvider>
            <AccessibilityProvider>
              <ErrorBoundary>
                <ToastProvider>
                  <ModalManagerProvider>
                    <SessionContextProvider>
                      <NetworkContextProvider>
                        <AppRouter />
                      </NetworkContextProvider>
                    </SessionContextProvider>
                  </ModalManagerProvider>
                </ToastProvider>
              </ErrorBoundary>
            </AccessibilityProvider>
          </I18nProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ConsentProvider>
  </StrictMode>,
)

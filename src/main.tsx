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
import { registerServiceWorker, initPWAInstall } from './utils/registerSW'
import { initA11y } from './utils/a11y'

// PWA 초기화
if (import.meta.env.PROD) {
  registerServiceWorker();
  initPWAInstall();
}

// Dev a11y checks (axe)
if (import.meta.env.DEV) {
  initA11y();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConsentProvider>
      <SettingsProvider>
        <ThemeProvider>
          <I18nProvider>
            <AccessibilityProvider>
              <ErrorBoundary>
                <ToastProvider>
                  <AppRouter />
                </ToastProvider>
              </ErrorBoundary>
            </AccessibilityProvider>
          </I18nProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ConsentProvider>
  </StrictMode>,
)

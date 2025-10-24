import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './AppRouter'
import { ThemeProvider } from './contexts/ThemeContext'
import { ConsentProvider } from './contexts/ConsentContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { ToastProvider } from './contexts/ToastContext'
import { ErrorBoundary } from './components/Common/ErrorBoundary'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { registerServiceWorker, initPWAInstall } from './utils/registerSW'

// PWA 초기화
if (import.meta.env.PROD) {
  registerServiceWorker();
  initPWAInstall();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConsentProvider>
      <SettingsProvider>
        <ThemeProvider>
          <AccessibilityProvider>
            <ErrorBoundary>
              <ToastProvider>
                <AppRouter />
              </ToastProvider>
            </ErrorBoundary>
          </AccessibilityProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ConsentProvider>
  </StrictMode>,
)

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/Layout/AppLayout';
import { AuthGuard } from './components/Auth/AuthGuard';
import { PublicRoute } from './components/Auth/PublicRoute';

// Lazy loaded pages
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/Auth/SignupPage'));
const SessionApp = lazy(() => import('./App'));
const Dashboard = lazy(() => import('./pages/Home/Dashboard').then(m => ({ default: m.Dashboard })));
const HistoryPage = lazy(() => import('./pages/History/History'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

// DevTools (개발 환경 전용)
const DevTools = lazy(() => import('./pages/DevTools'));

function Fallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
      Loading...
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Fallback />}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />
            <Route
              path="/auth/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/auth/signup"
              element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/app"
              element={
                <AuthGuard>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/app/session"
              element={
                <AuthGuard>
                  <AppLayout>
                    <SessionApp />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/app/history"
              element={
                <AuthGuard>
                  <AppLayout>
                    <HistoryPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/app/settings"
              element={
                <AuthGuard>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </AuthGuard>
              }
            />

            {/* DevTools (개발 환경 전용) */}
            {import.meta.env.DEV && (
              <Route
                path="/dev-tools"
                element={<DevTools />}
              />
            )}

            {/* Catch all - redirect to landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}



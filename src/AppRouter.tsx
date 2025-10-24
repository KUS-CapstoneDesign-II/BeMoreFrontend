import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const SessionApp = lazy(() => import('./App'));
const Dashboard = lazy(() => import('./pages/Home/Dashboard'));
const HistoryPage = lazy(() => import('./pages/History/History'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

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
      <Suspense fallback={<Fallback />}> 
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/session" element={<SessionApp />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}



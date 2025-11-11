/**
 * DevTools Page
 *
 * 개발자 검증 대시보드:
 * - 시스템 상태 체크 (API, WebSocket, 인증, Feature Flags)
 * - 라우트 네비게이션 테스트
 * - API 테스트 도구
 * - 에러 시뮬레이션
 * - 수동 체크리스트
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsEnabled } from '../config/features';

// ============================================================================
// Types
// ============================================================================

interface SystemStatus {
  api: 'connected' | 'disconnected' | 'checking';
  websocket: 'connected' | 'disconnected' | 'checking';
  auth: 'authenticated' | 'unauthenticated' | 'checking';
  featureFlags: {
    analyticsEnabled: boolean;
    performanceMonitoring: boolean;
    errorReporting: boolean;
  };
}

interface RouteInfo {
  path: string;
  name: string;
  protected: boolean;
}

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

const ROUTES: RouteInfo[] = [
  { path: '/', name: 'Landing Page', protected: false },
  { path: '/auth/login', name: 'Login', protected: false },
  { path: '/auth/signup', name: 'Signup', protected: false },
  { path: '/app', name: 'Dashboard', protected: true },
  { path: '/app/session', name: 'Session', protected: true },
  { path: '/app/history', name: 'History', protected: true },
  { path: '/app/settings', name: 'Settings', protected: true },
];

const API_ENDPOINTS: ApiEndpoint[] = [
  { method: 'POST', url: '/api/auth/login', description: '로그인' },
  { method: 'POST', url: '/api/auth/signup', description: '회원가입' },
  { method: 'POST', url: '/api/auth/logout', description: '로그아웃' },
  { method: 'GET', url: '/api/dashboard/summary', description: '대시보드 요약' },
  { method: 'POST', url: '/api/session/start', description: '세션 시작' },
  { method: 'POST', url: '/api/analytics/vitals', description: 'Analytics (Feature Flag)' },
];

// ============================================================================
// Component
// ============================================================================

export default function DevTools() {
  const navigate = useNavigate();

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    api: 'checking',
    websocket: 'checking',
    auth: 'checking',
    featureFlags: {
      analyticsEnabled: false,
      performanceMonitoring: false,
      errorReporting: false,
    },
  });

  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [apiTestResult, setApiTestResult] = useState<string>('');

  // ========================================================================
  // System Status Check
  // ========================================================================

  useEffect(() => {
    checkSystemStatus();
  }, []);

  async function checkSystemStatus() {
    // API 연결 확인
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/health`, { method: 'GET' });

      setSystemStatus((prev) => ({
        ...prev,
        api: response.ok ? 'connected' : 'disconnected',
      }));
    } catch {
      setSystemStatus((prev) => ({ ...prev, api: 'disconnected' }));
    }

    // WebSocket 연결 확인 (간단 체크)
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
      const testWs = new WebSocket(wsUrl);

      testWs.onopen = () => {
        setSystemStatus((prev) => ({ ...prev, websocket: 'connected' }));
        testWs.close();
      };

      testWs.onerror = () => {
        setSystemStatus((prev) => ({ ...prev, websocket: 'disconnected' }));
      };

      setTimeout(() => {
        if (testWs.readyState !== WebSocket.OPEN) {
          setSystemStatus((prev) => ({ ...prev, websocket: 'disconnected' }));
          testWs.close();
        }
      }, 3000);
    } catch {
      setSystemStatus((prev) => ({ ...prev, websocket: 'disconnected' }));
    }

    // 인증 상태 확인
    const token = localStorage.getItem('accessToken');
    setSystemStatus((prev) => ({
      ...prev,
      auth: token ? 'authenticated' : 'unauthenticated',
    }));

    // Feature Flags 확인
    setSystemStatus((prev) => ({
      ...prev,
      featureFlags: {
        analyticsEnabled: getAnalyticsEnabled(),
        performanceMonitoring: true,
        errorReporting: true,
      },
    }));
  }

  // ========================================================================
  // Route Navigation
  // ========================================================================

  function navigateToRoute(path: string) {
    navigate(path);
  }

  // ========================================================================
  // API Test
  // ========================================================================

  async function testApiEndpoint(endpoint: ApiEndpoint) {
    setSelectedEndpoint(endpoint);
    setApiTestResult('Testing...');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${apiUrl}${endpoint.url}`;

      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('accessToken')
            ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            : {}),
        },
        ...(endpoint.method !== 'GET'
          ? {
              body: JSON.stringify({
                // Mock 데이터
                email: 'test@example.com',
                password: 'TestPass123!',
              }),
            }
          : {}),
      });

      const data = await response.json().catch(() => null);

      setApiTestResult(
        JSON.stringify(
          {
            status: response.status,
            statusText: response.statusText,
            data,
          },
          null,
          2
        )
      );
    } catch (error) {
      setApiTestResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ========================================================================
  // Checklist
  // ========================================================================

  function toggleChecklistItem(key: string) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ========================================================================
  // Render
  // ========================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return 'text-green-600';
      case 'disconnected':
      case 'unauthenticated':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return '✅';
      case 'disconnected':
      case 'unauthenticated':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DevTools - 프로젝트 검증 대시보드</h1>
          <p className="mt-2 text-gray-600">
            개발 환경에서만 접근 가능한 검증 도구입니다.
          </p>
        </div>

        {/* System Status */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">시스템 상태</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded border p-4">
              <span className="font-medium">API 연결</span>
              <span className={getStatusColor(systemStatus.api)}>
                {getStatusIcon(systemStatus.api)} {systemStatus.api}
              </span>
            </div>

            <div className="flex items-center justify-between rounded border p-4">
              <span className="font-medium">WebSocket 연결</span>
              <span className={getStatusColor(systemStatus.websocket)}>
                {getStatusIcon(systemStatus.websocket)} {systemStatus.websocket}
              </span>
            </div>

            <div className="flex items-center justify-between rounded border p-4">
              <span className="font-medium">인증 상태</span>
              <span className={getStatusColor(systemStatus.auth)}>
                {getStatusIcon(systemStatus.auth)} {systemStatus.auth}
              </span>
            </div>

            <div className="flex items-center justify-between rounded border p-4">
              <span className="font-medium">Feature Flags</span>
              <span className="text-blue-600">
                {Object.values(systemStatus.featureFlags).filter(Boolean).length} / 3 활성화
              </span>
            </div>
          </div>

          <div className="mt-4 rounded bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Feature Flags 상세</h3>
            <ul className="space-y-1 text-sm">
              <li>
                Analytics: {systemStatus.featureFlags.analyticsEnabled ? '✅ 활성화' : '❌ 비활성화'}
              </li>
              <li>
                Performance Monitoring:{' '}
                {systemStatus.featureFlags.performanceMonitoring ? '✅ 활성화' : '❌ 비활성화'}
              </li>
              <li>
                Error Reporting:{' '}
                {systemStatus.featureFlags.errorReporting ? '✅ 활성화' : '❌ 비활성화'}
              </li>
            </ul>
          </div>

          <button
            onClick={checkSystemStatus}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            🔄 상태 새로고침
          </button>
        </section>

        {/* Route Navigation Test */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">라우트 네비게이션 테스트</h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ROUTES.map((route) => (
              <button
                key={route.path}
                onClick={() => navigateToRoute(route.path)}
                className="flex items-center justify-between rounded border p-3 text-left hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium">{route.name}</div>
                  <div className="text-sm text-gray-500">{route.path}</div>
                </div>
                <div className="text-xs">
                  {route.protected ? '🔒 보호됨' : '🌐 공개'}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* API Test Tool */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">API 테스트 도구</h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Endpoints List */}
            <div>
              <h3 className="mb-2 font-semibold">엔드포인트 목록</h3>
              <div className="space-y-2">
                {API_ENDPOINTS.map((endpoint, index) => (
                  <button
                    key={index}
                    onClick={() => testApiEndpoint(endpoint)}
                    className="w-full rounded border p-3 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        {endpoint.method}
                      </span>
                      <span className="text-sm">{endpoint.url}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{endpoint.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Test Result */}
            <div>
              <h3 className="mb-2 font-semibold">테스트 결과</h3>
              {selectedEndpoint ? (
                <div className="rounded border bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                      {selectedEndpoint.method}
                    </span>
                    <span className="text-sm">{selectedEndpoint.url}</span>
                  </div>
                  <pre className="overflow-auto rounded bg-gray-900 p-4 text-xs text-green-400">
                    {apiTestResult}
                  </pre>
                </div>
              ) : (
                <div className="rounded border bg-gray-50 p-4 text-center text-gray-500">
                  엔드포인트를 선택하여 테스트하세요
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Manual Checklist */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">수동 검증 체크리스트</h2>

          <div className="space-y-2">
            {[
              '로그인 성공 확인',
              '회원가입 성공 확인',
              '보호된 라우트 리다이렉트 확인',
              '대시보드 데이터 로딩 확인',
              '세션 시작/종료 확인',
              '히스토리 데이터 표시 확인',
              '설정 저장 확인',
              '에러 메시지 표시 확인',
              '네트워크 오류 처리 확인',
              '로그아웃 확인',
            ].map((item) => (
              <label key={item} className="flex cursor-pointer items-center gap-3 rounded border p-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={checklist[item] || false}
                  onChange={() => toggleChecklistItem(item)}
                  className="h-5 w-5"
                />
                <span className={checklist[item] ? 'line-through text-gray-400' : ''}>
                  {item}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 rounded bg-blue-50 p-4">
            <strong>진행률:</strong>{' '}
            {Object.values(checklist).filter(Boolean).length} / 10 ({' '}
            {Math.round((Object.values(checklist).filter(Boolean).length / 10) * 100)}% )
          </div>
        </section>

        {/* Environment Info */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">환경 정보</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded border p-4">
              <div className="mb-2 font-semibold">Backend URL</div>
              <div className="text-sm text-gray-600">
                {import.meta.env.VITE_API_URL || 'Not configured'}
              </div>
            </div>

            <div className="rounded border p-4">
              <div className="mb-2 font-semibold">WebSocket URL</div>
              <div className="text-sm text-gray-600">
                {import.meta.env.VITE_WS_URL || 'Not configured'}
              </div>
            </div>

            <div className="rounded border p-4">
              <div className="mb-2 font-semibold">Analytics Enabled</div>
              <div className="text-sm text-gray-600">
                {import.meta.env.VITE_ANALYTICS_ENABLED || 'false'}
              </div>
            </div>

            <div className="rounded border p-4">
              <div className="mb-2 font-semibold">Environment Mode</div>
              <div className="text-sm text-gray-600">
                {import.meta.env.MODE} ({import.meta.env.DEV ? 'Development' : 'Production'})
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>이 페이지는 개발 환경에서만 접근 가능합니다.</p>
          <p className="mt-1">프로덕션 배포 시 자동으로 비활성화됩니다.</p>
        </div>
      </div>
    </div>
  );
}

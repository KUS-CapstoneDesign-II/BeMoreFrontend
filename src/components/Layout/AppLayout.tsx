import type { ReactNode } from 'react';
import { NetworkStatusBadge } from '../NetworkStatusBadge';
import './AppLayout.css';

/**
 * AppLayout
 *
 * 전체 앱을 감싸는 레이아웃 컴포넌트
 * 네트워크 상태 배지, 헤더, 푸터 등을 포함
 */
interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      {/* 상단 헤더 */}
      <header className="app-header">
        <div className="app-header-content">
          {/* 로고 또는 앱 제목 */}
          <div className="app-header-logo">
            <h1>BeMore</h1>
          </div>

          {/* 우측 네트워크 상태 배지 */}
          <div className="app-header-right">
            <NetworkStatusBadge />
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="app-main">
        {children}
      </main>

      {/* 푸터 (선택적) */}
      <footer className="app-footer">
        <p>&copy; 2025 BeMore. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AppLayout;

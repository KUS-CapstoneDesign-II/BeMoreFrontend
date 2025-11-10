import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    const confirmed = window.confirm('로그아웃하시겠습니까?');
    if (!confirmed) return;

    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="app-layout">
      {/* 상단 헤더 */}
      <header className="app-header">
        <div className="app-header-content">
          {/* 로고 또는 앱 제목 */}
          <div className="app-header-logo">
            <h1>BeMore</h1>
          </div>

          {/* 우측 네트워크 상태 배지 및 사용자 정보 */}
          <div className="app-header-right">
            <NetworkStatusBadge />

            {/* 사용자 정보 및 로그아웃 버튼 */}
            {user && (
              <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
                <span className="user-name" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="logout-button"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--color-error)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                    opacity: isLoggingOut ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoggingOut) {
                      e.currentTarget.style.opacity = '0.8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoggingOut) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </button>
              </div>
            )}
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

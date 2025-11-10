import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute 컴포넌트
 * 인증되지 않은 사용자만 접근할 수 있는 라우트입니다.
 * 이미 인증된 사용자는 대시보드로 리다이렉트됩니다.
 * (예: 로그인 페이지, 회원가입 페이지)
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // 인증 상태 확인 중이면 로딩 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 이미 인증된 경우 대시보드로 리다이렉트
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  // 인증되지 않은 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
}

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

/**
 * NetworkContext
 *
 * 네트워크 연결 상태를 중앙화하는 Context
 * 온라인/오프라인 상태를 실시간으로 추적하고 제공
 *
 * 상태:
 * - isOnline: 현재 네트워크 연결 상태
 * - lastStatusChange: 마지막 상태 변경 시간
 * - reconnectAttempts: 재연결 시도 횟수
 */

interface NetworkContextType {
  // 네트워크 상태
  isOnline: boolean;
  lastStatusChange: number | null;
  reconnectAttempts: number;

  // 액션 함수들
  setIsOnline: (online: boolean) => void;
  resetReconnectAttempts: () => void;
  incrementReconnectAttempts: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkContextProviderProps {
  children: ReactNode;
}

/**
 * NetworkContextProvider
 * 네트워크 상태 관리 Provider
 */
export function NetworkContextProvider({ children }: NetworkContextProviderProps) {
  // 초기 상태: navigator.onLine을 신뢰할 수 있다고 가정
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastStatusChange, setLastStatusChange] = useState<number | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  /**
   * 온라인/오프라인 이벤트 감지
   * navigator.onLine 변경 시 자동 업데이트
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Network: Online');
      setIsOnline(true);
      setLastStatusChange(Date.now());
      setReconnectAttempts(0);
    };

    const handleOffline = () => {
      console.log('🔴 Network: Offline');
      setIsOnline(false);
      setLastStatusChange(Date.now());
    };

    // 이벤트 리스너 등록
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 초기 상태 설정
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setLastStatusChange(Date.now());
    }

    // 정리
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * 재연결 시도 횟수 초기화
   */
  const resetReconnectAttempts = () => {
    setReconnectAttempts(0);
  };

  /**
   * 재연결 시도 횟수 증가
   */
  const incrementReconnectAttempts = () => {
    setReconnectAttempts((prev) => prev + 1);
  };

  const value: NetworkContextType = {
    // 읽기 전용 상태
    isOnline,
    lastStatusChange,
    reconnectAttempts,

    // 상태 업데이트 함수
    setIsOnline,
    resetReconnectAttempts,
    incrementReconnectAttempts,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * useNetworkStatus
 * NetworkContext 사용 hook
 *
 * @throws {Error} NetworkContextProvider 없이 사용 시
 *
 * @example
 * ```tsx
 * const { isOnline, lastStatusChange } = useNetworkStatus();
 * ```
 */
export function useNetworkStatus(): NetworkContextType {
  const context = useContext(NetworkContext);

  if (context === undefined) {
    throw new Error(
      '❌ useNetworkStatus must be used within <NetworkContextProvider>. ' +
      'Make sure your component is wrapped with NetworkContextProvider in main.tsx'
    );
  }

  return context;
}

export default NetworkContext;

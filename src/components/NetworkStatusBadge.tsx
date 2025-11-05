import { useNetworkStatus } from '../contexts/NetworkContext';
import './NetworkStatusBadge.css';

/**
 * NetworkStatusBadge
 *
 * 네트워크 연결 상태를 시각적으로 표시하는 배지 컴포넌트
 * - 온라인: 초록색 배지 + "Online"
 * - 오프라인: 빨간색 배지 + "Offline"
 *
 * 위치: 상단 우측 (헤더에 통합)
 */
export function NetworkStatusBadge() {
  const { isOnline, lastStatusChange } = useNetworkStatus();

  /**
   * 마지막 상태 변경 시간을 사람이 읽을 수 있는 형식으로 변환
   */
  const formatStatusTime = (timestamp: number | null): string => {
    if (!timestamp) return '';

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) {
      return `${diffSecs}s ago`;
    }
    if (diffSecs < 3600) {
      const mins = Math.floor(diffSecs / 60);
      return `${mins}m ago`;
    }
    if (diffSecs < 86400) {
      const hours = Math.floor(diffSecs / 3600);
      return `${hours}h ago`;
    }

    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`network-status-badge ${isOnline ? 'online' : 'offline'}`}>
      {/* 상태 표시기 (원형 배지) */}
      <div className="network-status-indicator">
        <span className="network-status-dot"></span>
      </div>

      {/* 상태 텍스트 */}
      <span className="network-status-text">
        {isOnline ? '🟢 Online' : '🔴 Offline'}
      </span>

      {/* 마지막 상태 변경 시간 (호버 시 표시) */}
      {lastStatusChange && (
        <div className="network-status-tooltip">
          {isOnline ? 'Connected' : 'Disconnected'} {formatStatusTime(lastStatusChange)}
        </div>
      )}
    </div>
  );
}

export default NetworkStatusBadge;

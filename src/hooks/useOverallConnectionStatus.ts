/**
 * Overall Connection Status Hook
 *
 * 3개 채널(landmarks, voice, session)을 통합하여 단일 연결 상태로 제공
 * - 모든 채널 connected → "connected" (정상)
 * - 일부 채널 connected → "partial" (부분 연결)
 * - 모든 채널 disconnected → "disconnected" (연결 끊김)
 */

export type OverallConnectionStatus = 'connected' | 'partial' | 'disconnected';

export type ConnectionDetails = Record<string, string>;

export interface OverallStatusResult {
  status: OverallConnectionStatus;
  statusText: string;
  statusColor: string;
  details: {
    landmarks: string;
    voice: string;
    session: string;
  };
  connectedChannels: number;
  totalChannels: number;
}

export function useOverallConnectionStatus(
  wsConnected: boolean,
  connectionStatus: ConnectionDetails
): OverallStatusResult {
  const landmarks = connectionStatus['landmarks'] || 'disconnected';
  const voice = connectionStatus['voice'] || 'disconnected';
  const session = connectionStatus['session'] || 'disconnected';
  // 연결된 채널 수 계산
  const connectedChannels = [
    landmarks,
    voice,
    session,
  ].filter((status) => status === 'connected').length;

  const totalChannels = 3;

  // 통합 상태 결정
  let status: OverallConnectionStatus;
  let statusText: string;
  let statusColor: string;

  if (!wsConnected) {
    // WebSocket 자체가 연결되지 않음
    status = 'disconnected';
    statusText = '연결 끊김';
    statusColor = 'text-red-600 dark:text-red-400';
  } else if (connectedChannels === totalChannels) {
    // 모든 채널 연결됨
    status = 'connected';
    statusText = '연결됨';
    statusColor = 'text-green-600 dark:text-green-400';
  } else if (connectedChannels > 0) {
    // 일부 채널만 연결됨
    status = 'partial';
    statusText = `부분 연결 (${connectedChannels}/${totalChannels})`;
    statusColor = 'text-yellow-600 dark:text-yellow-400';
  } else {
    // 모든 채널 연결 안 됨
    status = 'disconnected';
    statusText = '연결 끊김';
    statusColor = 'text-red-600 dark:text-red-400';
  }

  return {
    status,
    statusText,
    statusColor,
    details: {
      landmarks,
      voice,
      session,
    },
    connectedChannels,
    totalChannels,
  };
}

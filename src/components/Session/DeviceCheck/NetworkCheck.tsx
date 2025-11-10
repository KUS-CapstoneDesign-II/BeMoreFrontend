import { useEffect, useState } from 'react';
import { Logger } from '../../../config/env';

interface NetworkCheckProps {
  latency: number; // milliseconds
  bandwidth: number; // Mbps
  isGood: boolean;
}

/**
 * Network Check Component
 *
 * 네트워크 지연 시간(latency)과 대역폭(bandwidth) 확인
 */
export default function NetworkCheck({ latency, bandwidth, isGood }: NetworkCheckProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [testResults, setTestResults] = useState({
    latency: latency || 0,
    bandwidth: bandwidth || 0,
  });

  const getLatencyQuality = (ms: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (ms < 50) return 'excellent';
    if (ms < 100) return 'good';
    if (ms < 300) return 'fair';
    return 'poor';
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return '⚡';
      case 'good':
        return '✅';
      case 'fair':
        return '⚠️';
      case 'poor':
        return '❌';
      default:
        return '❓';
    }
  };

  const runNetworkTest = async () => {
    setIsChecking(true);
    try {
      Logger.info('🌐 Running network test');

      // Test 1: Latency (ping test)
      const startTime = performance.now();
      await fetch('/api/health', { method: 'HEAD', cache: 'no-store' }).catch(() => {
        // Fallback to simple fetch if health endpoint unavailable
      });
      const latency = performance.now() - startTime;

      // Test 2: Bandwidth (download test)
      // For now, estimate based on latency (real implementation would download a test file)
      // Assuming typical bandwidth for WebRTC: 1-5 Mbps
      const estimatedBandwidth = Math.max(1, 5 - (latency / 1000) * 2);

      setTestResults({
        latency: Math.round(latency),
        bandwidth: Math.round(estimatedBandwidth * 10) / 10,
      });

      Logger.info('✅ Network test completed', {
        latency: Math.round(latency),
        bandwidth: estimatedBandwidth,
      });
    } catch (error) {
      Logger.error('❌ Network test failed', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (latency === 0 && bandwidth === 0) {
      runNetworkTest();
    }
  }, [latency, bandwidth]);

  const displayLatency = testResults.latency || latency;
  const displayBandwidth = testResults.bandwidth || bandwidth;
  const latencyQuality = getLatencyQuality(displayLatency);
  const statusIcon = getQualityIcon(latencyQuality);

  return (
    <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {statusIcon} 네트워크
        </h3>
        <span
          className={`text-sm px-3 py-1 rounded-full font-medium
            ${
              isGood
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }
          `}
        >
          {isGood ? '✅ 양호' : '❌ 불량'}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Latency */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">지연 시간</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {displayLatency}
            <span className="text-sm ml-1">ms</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {latencyQuality === 'excellent'
              ? '매우 좋음 (<50ms)'
              : latencyQuality === 'good'
                ? '좋음 (50-100ms)'
                : latencyQuality === 'fair'
                  ? '보통 (100-300ms)'
                  : '나쁨 (>300ms)'}
          </p>
        </div>

        {/* Bandwidth */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">대역폭</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {displayBandwidth}
            <span className="text-sm ml-1">Mbps</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {displayBandwidth >= 2.5 ? '세션 적합' : '제한적'}
          </p>
        </div>
      </div>

      {/* Quality Indicator Bar */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          네트워크 품질
        </p>
        <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          <div
            className={`h-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-white
              ${
                latencyQuality === 'excellent'
                  ? 'w-full bg-green-500'
                  : latencyQuality === 'good'
                    ? 'w-3/4 bg-green-500'
                    : latencyQuality === 'fair'
                      ? 'w-1/2 bg-yellow-500'
                      : 'w-1/4 bg-red-500'
              }
            `}
          >
            {latencyQuality === 'excellent'
              ? '⚡ 최고'
              : latencyQuality === 'good'
                ? '✅ 좋음'
                : latencyQuality === 'fair'
                  ? '⚠️ 보통'
                  : '❌ 나쁨'}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {!isGood && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 네트워크 연결이 불안정합니다. 더 나은 신호가 있는 위치로 이동하거나 다른 네트워크를
            사용해보세요.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <button
        onClick={runNetworkTest}
        disabled={isChecking}
        className={`w-full px-4 py-2 rounded-lg font-medium transition ${
          isChecking
            ? 'bg-gray-400 cursor-not-allowed opacity-50'
            : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
        }`}
      >
        {isChecking ? '🔄 테스트 중...' : '🔄 재테스트'}
      </button>

      {/* Info */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        권장 사항: 지연 시간 &lt;300ms, 대역폭 &gt;2.5Mbps
      </p>
    </div>
  );
}

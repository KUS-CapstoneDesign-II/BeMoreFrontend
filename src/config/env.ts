/**
 * Environment Configuration & Validation
 * Phase 9: 환경변수 검증 및 설정
 */

import type { EnvironmentConfig } from '../types/session';

/**
 * Type guards for environment config
 */
function isValidStage(value: unknown): value is 'dev' | 'staging' | 'prod' {
  return value === 'dev' || value === 'staging' || value === 'prod';
}

function isValidLogLevel(value: unknown): value is 'debug' | 'info' | 'warn' | 'error' {
  return value === 'debug' || value === 'info' || value === 'warn' || value === 'error';
}

/**
 * 환경변수 검증 및 로드
 * 프로덕션 배포에서 필수
 */
export function validateEnvironment(): EnvironmentConfig {
  const stage = import.meta.env.VITE_STAGE;
  const logLevel = import.meta.env.VITE_LOG_LEVEL;

  const config: EnvironmentConfig = {
    stage: isValidStage(stage) ? stage : 'dev',
    apiUrl: import.meta.env.VITE_API_URL as string,
    wsUrl: import.meta.env.VITE_WS_URL as string,
    logLevel: isValidLogLevel(logLevel) ? logLevel : 'info',
    enableMockStt: import.meta.env.VITE_ENABLE_MOCK_STT === 'true',
    enableMockMediapipe: import.meta.env.VITE_ENABLE_MOCK_MEDIAPIPE === 'true',
  };

  // 필수 환경변수 검증
  if (!config.apiUrl) {
    console.error('❌ VITE_API_URL is required');
    throw new Error('VITE_API_URL environment variable is not set');
  }

  if (!config.wsUrl) {
    console.warn('⚠️ VITE_WS_URL is not set, falling back to API_URL with ws protocol');
    config.wsUrl = config.apiUrl.replace(/^https?:/, 'ws:');
  }

  // 프로덕션 검증
  if (config.stage === 'prod') {
    if (!config.apiUrl.startsWith('https://')) {
      console.warn('⚠️ Production API URL should use HTTPS');
    }
    if (!config.wsUrl.startsWith('wss://')) {
      console.warn('⚠️ Production WebSocket URL should use WSS');
    }
  }

  // 환경 설정 로깅
  if (import.meta.env.DEV) {
    console.log('🔧 Environment Configuration:', {
      stage: config.stage,
      apiUrl: config.apiUrl,
      wsUrl: config.wsUrl,
      logLevel: config.logLevel,
      mockStt: config.enableMockStt,
      mockMediapipe: config.enableMockMediapipe,
    });
  }

  return config;
}

// 환경 설정 싱글톤
let envConfig: EnvironmentConfig | null = null;

/**
 * 환경 설정 가져오기 (캐싱)
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  if (!envConfig) {
    envConfig = validateEnvironment();
  }
  return envConfig;
}

/**
 * API URL 가져오기
 */
export function getApiUrl(): string {
  return getEnvironmentConfig().apiUrl;
}

/**
 * WebSocket URL 가져오기
 */
export function getWsUrl(): string {
  return getEnvironmentConfig().wsUrl;
}

/**
 * 로깅 레벨 가져오기
 */
export function getLogLevel(): string {
  return getEnvironmentConfig().logLevel;
}

/**
 * 로깅 함수 (레벨 기반)
 */
export function log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const logLevel = getLogLevel();
  const levels: Record<'debug' | 'info' | 'warn' | 'error', number> = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = (logLevel as 'debug' | 'info' | 'warn' | 'error') || 'info';

  if (levels[level] >= levels[currentLevel]) {
    const prefix = `[${level.toUpperCase()}]`;
    if (data !== undefined) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }
}

/**
 * 편의 로깅 함수
 */
export const Logger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, data),
  info: (msg: string, data?: unknown) => log('info', msg, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
};

/**
 * 브라우저 기능 지원 확인 (Phase 9)
 */
export function checkBrowserCapabilities(): {
  camera: boolean;
  microphone: boolean;
  mediaRecorder: boolean;
  webWorkers: boolean;
  requestAnimationFrame: boolean;
  indexedDb: boolean;
} {
  const navigator_ = typeof navigator !== 'undefined' ? navigator : null;

  // Legacy webkit API support
  interface NavigatorWithWebkit extends Navigator {
    webkitGetUserMedia?: unknown;
  }

  return {
    camera:
      !!navigator_?.mediaDevices?.getUserMedia ||
      !!(navigator_ as NavigatorWithWebkit | null)?.webkitGetUserMedia,
    microphone:
      !!navigator_?.mediaDevices?.getUserMedia ||
      !!(navigator_ as NavigatorWithWebkit | null)?.webkitGetUserMedia,
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    webWorkers: typeof Worker !== 'undefined',
    requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
    indexedDb: typeof indexedDB !== 'undefined',
  };
}

/**
 * 초기화 함수 (애플리케이션 시작 시 호출)
 */
export function initializeEnvironment(): void {
  try {
    const config = getEnvironmentConfig();
    const capabilities = checkBrowserCapabilities();

    Logger.info('🚀 Environment initialized', {
      stage: config.stage,
      capabilities,
    });

    // 필수 기능 확인
    if (!capabilities.camera) {
      Logger.warn('Camera API not available');
    }
    if (!capabilities.microphone) {
      Logger.warn('Microphone API not available');
    }
    if (!capabilities.webWorkers) {
      Logger.warn('Web Workers not available');
    }
  } catch (error) {
    Logger.error('Failed to initialize environment', error);
    throw error;
  }
}

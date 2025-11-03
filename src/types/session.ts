/**
 * Phase 9: Session Timeline System
 * 세션 관련 타입 정의
 */

// 세션 상태 (Zustand sessionStore)
export type SessionStatus = 'idle' | 'running' | 'paused' | 'ended';

// 음성 감지 상태
export type VadState = 'silence' | 'voice';

// 세션 정보
export interface Session {
  sessionId: string;
  userId: string;
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date;
  minuteIndex: number;
  totalDuration: number; // seconds
}

// 실시간 메트릭스
export interface Metrics {
  // FPS와 성능
  currentFps: number;
  targetFps: number;
  cpuUsage?: number;

  // 오디오
  audioLevel: number; // 0-100
  vadState: VadState;
  isMicActive: boolean;

  // 네트워크
  networkLatency: number; // ms
  queueLength: number;
  lastTransmitTime: Date | null;
  transmitRate: number; // items/sec

  // 에러 추적
  errors: SessionError[];
  warnings: string[];
}

// 타임라인 카드 (1분 단위)
export interface TimelineCard {
  minuteIndex: number;
  sessionId: string;

  // 지표 점수 (0-100)
  facialScore: number;
  vadScore: number;
  textScore: number;
  combinedScore: number;

  // 메타데이터
  keywords: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1

  // 타임스탬프
  timestamp: Date;
  durationMs: number;
}

// 세션 리포트
export interface SessionReport {
  sessionId: string;
  userId: string;
  startedAt: Date;
  endedAt: Date;
  durationMs: number;

  // 요약 지표
  averageScore: number;
  maxScore: number;
  minScore: number;

  // 감정 분석
  dominantEmotion: string;
  emotionDistribution: Record<string, number>;

  // 타임라인
  cards: TimelineCard[];

  // 인사이트
  keywords: string[];
  highlights: string[];
  recommendations: string[];

  // 사용자 피드백
  userFeedback?: {
    rating: number; // 1-5
    notes: string;
  };
}

// 세션 시작 요청/응답
export interface StartSessionRequest {
  userId?: string;
}

export interface StartSessionResponse {
  sessionId: string;
  startedAt: string;
}

// 1분 틱 요청/응답 (Phase 9)
export interface TickRequest {
  sessionId: string;
  minuteIndex: number;
  frames: FaceFrame[];
  audioSamples: AudioSample[];
  textInput?: string;
}

export interface TickResponse {
  minuteIndex: number;
  facialScore: number;
  vadScore: number;
  textScore: number;
  combinedScore: number;
  keywords: string[];
  sentiment?: string;
}

// 멀티모달 입력 데이터
export interface FaceFrame {
  timestamp: number; // ms since epoch
  landmarks?: Array<[number, number]>; // x, y coordinates
  confidence?: number;
  expression?: string;
}

export interface AudioSample {
  timestamp: number; // ms since epoch
  level: number; // 0-100
  frequency?: number; // Hz
  vadState: VadState;
}

// 에러 정보
export interface SessionError {
  timestamp: Date;
  code: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  retryable: boolean;
  retryCount: number;
}

// 장치 점검 결과
export interface DeviceCheckResult {
  camera: DeviceStatus;
  microphone: DeviceStatus;
  network: DeviceStatus;
  allOk: boolean;
}

export interface DeviceStatus {
  available: boolean;
  enabled: boolean;
  error?: string;
  fps?: number;
  latency?: number;
}

// 환경 설정
export interface EnvironmentConfig {
  stage: 'dev' | 'staging' | 'prod';
  apiUrl: string;
  wsUrl: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMockStt: boolean;
  enableMockMediapipe: boolean;
}

// 배치 큐 항목
export interface BatchQueueItem {
  timestamp: Date;
  type: 'face' | 'audio' | 'text';
  data: FaceFrame | AudioSample | string;
}

// 재시도 정책
export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number; // 지수 백오프: delay *= factor
  maxDelayMs: number;
}

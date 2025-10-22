// =====================================
// Session Types
// =====================================

export interface Session {
  sessionId: string;
  userId: string;
  counselorId: string;
  status: SessionStatus;
  startedAt: number;
  endedAt?: number;
  pausedAt?: number;
}

export type SessionStatus = 'initializing' | 'active' | 'paused' | 'ended';

export interface SessionStats {
  totalDuration: number;
  emotionCount: number;
  vadAnalysisCount: number;
  averageRiskScore: number;
}

// =====================================
// Emotion Types
// =====================================

export interface EmotionData {
  timestamp: number;
  emotion: EmotionType;
  frameCount: number;
  sttLength: number;
  cbtAnalysis?: CBTAnalysis;
}

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'neutral'
  | 'surprised'
  | 'disgusted'
  | 'fearful';

// =====================================
// CBT Types
// =====================================

export interface CBTAnalysis {
  hasDistortions: boolean;
  needsIntervention: boolean;
  detections: CognitiveDistortion[];
  intervention?: Intervention;
}

export interface CognitiveDistortion {
  type: string;
  name_ko: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  examples: string[];
}

export interface Intervention {
  distortionType: string;
  distortionName: string;
  severity: string;
  urgency: string;
  questions: string[];
  tasks: Task[];
}

export interface Task {
  title: string;
  description: string;
  difficulty: string;
  duration: string;
}

// =====================================
// VAD Types
// =====================================

export interface VADMetrics {
  speechRatio: number;
  pauseRatio: number;
  averagePauseDuration: number;
  longestPause: number;
  speechBurstCount: number;
  averageSpeechBurst: number;
  pauseCount: number;
  summary: string;
}

export interface PsychologicalIndicators {
  riskScore: number;
  riskLevel: 'normal' | 'caution' | 'warning' | 'high' | 'critical';
  indicators: {
    hesitation: number;
    anxiety: number;
    depression: number;
    engagement: number;
    clarity: number;
  };
  alerts: Alert[];
}

export interface Alert {
  type: string;
  severity: string;
  message: string;
}

export interface VADAnalysis {
  timestamp: number;
  metrics: VADMetrics;
  psychological: PsychologicalIndicators;
  timeSeries: VADTimeSeriesData[];
}

export interface VADTimeSeriesData {
  timestamp: number;
  isSpeech: boolean;
  duration: number;
}

export interface VADRealtimeData {
  isSpeech: boolean;
  probability: number;
  energy: number;
  timestamp: number;
}

// =====================================
// WebSocket Message Types
// =====================================

export type WSMessageType =
  | 'connected'
  | 'emotion_update'
  | 'vad_analysis'
  | 'vad_realtime'
  | 'ai_response'
  | 'stt_received'
  | 'status_update'
  | 'landmarks'
  | 'error';

export interface WSMessage<T = any> {
  type: WSMessageType;
  data: T;
}

export interface EmotionUpdateData {
  emotion: EmotionType;
  timestamp: number;
  frameCount: number;
  sttSnippet: string;
  intervention?: Intervention;
}

export interface AIResponseData {
  response: string;
  responseType: 'empathy_support' | 'positive_reinforcement' | 'cbt_intervention' | 'general_conversation' | 'error_fallback';
  timestamp: number;
  context: {
    historyLength: number;
    emotionCount: number;
    cbtFlagCount: number;
  };
  error?: boolean;
}

// =====================================
// API Types
// =====================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface SessionStartResponse {
  sessionId: string;
  wsUrls: {
    landmarks: string;
    voice: string;
    session: string;
  };
}

export interface SessionReport {
  sessionId: string;
  userId: string;
  duration: number;
  summary: {
    emotionCount: number;
    vadAnalysisCount: number;
    averageRiskScore: number;
    dominantEmotion: EmotionType;
  };
  emotionTimeline: EmotionData[];
  vadSummary: VADMetrics;
  vadTimeline?: Array<{ t?: number; timestamp?: number; valence?: number; arousal?: number; dominance?: number }>;
  vadVector?: { valence: number; arousal: number; dominance: number };
  cbtFindings?: CBTAnalysis[];
}

// =====================================
// MediaPipe Types
// =====================================

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceLandmarks {
  landmarks: Landmark[];
  timestamp: number;
}

// =====================================
// Connection Status
// =====================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionState {
  landmarks: ConnectionStatus;
  voice: ConnectionStatus;
  session: ConnectionStatus;
}

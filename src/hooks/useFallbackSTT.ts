import { useRef, useCallback, useState } from 'react';
import { Logger } from '../config/env';

interface FallbackSTTOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult: (text: string) => void;
  onError?: (error: string) => void;
}

interface FallbackSTTReturn {
  isSupported: () => boolean;
  start: () => void;
  stop: () => void;
  isActive: boolean;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item: (index: number) => SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

/**
 * Web Speech API fallback for STT
 * Provides browser-native speech recognition as backup for WebSocket STT
 *
 * @example
 * const fallbackSTT = useFallbackSTT({
 *   onResult: (text) => console.log('Recognized:', text),
 *   onError: (err) => console.error('STT Error:', err)
 * });
 *
 * if (fallbackSTT.isSupported()) {
 *   fallbackSTT.start();
 * }
 */
export const useFallbackSTT = (options: FallbackSTTOptions): FallbackSTTReturn => {
  const {
    lang = 'ko-KR',
    continuous = true,
    interimResults = false,
    onResult,
    onError,
  } = options;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isActive, setIsActive] = useState(false);

  /**
   * Check if Web Speech API is supported in current browser
   */
  const isSupported = useCallback((): boolean => {
    const hasAPI =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition !== undefined ||
        window.webkitSpeechRecognition !== undefined);

    Logger.debug('🎤 Web Speech API support check', {
      supported: hasAPI,
      SpeechRecognition: !!window.SpeechRecognition,
      webkitSpeechRecognition: !!window.webkitSpeechRecognition,
    });

    return hasAPI;
  }, []);

  /**
   * Start speech recognition
   */
  const start = useCallback(() => {
    if (!isSupported()) {
      const error = 'Web Speech API not supported in this browser';
      Logger.error('❌ Cannot start fallback STT', { reason: error });
      onError?.(error);
      return;
    }

    // Stop existing recognition if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        Logger.warn('Failed to stop existing recognition', { error: err });
      }
    }

    try {
      // Create recognition instance
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        throw new Error('SpeechRecognition constructor not available');
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;

      // Handle results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];

        if (result && result.isFinal && result[0]) {
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          Logger.info('✅ Fallback STT result', {
            text: transcript,
            confidence: confidence.toFixed(2),
            resultIndex: event.resultIndex,
          });

          onResult(transcript);
        } else if (interimResults && result && result[0]) {
          const transcript = result[0].transcript;
          Logger.debug('🔄 Interim STT result', { text: transcript });
        }
      };

      // Handle errors
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        Logger.error('❌ Fallback STT error', {
          error: event.error,
          message: event.message,
        });

        const errorMessage = getErrorMessage(event.error);
        onError?.(errorMessage);

        // Auto-restart on network error (transient)
        if (event.error === 'network') {
          Logger.info('🔄 Attempting to restart after network error');
          setTimeout(() => {
            if (recognitionRef.current === recognition) {
              start();
            }
          }, 2000);
        } else if (event.error !== 'aborted') {
          setIsActive(false);
        }
      };

      // Handle end
      recognition.onend = () => {
        Logger.debug('🛑 Fallback STT ended');

        // Auto-restart if continuous mode and not manually stopped
        if (continuous && recognitionRef.current === recognition) {
          Logger.debug('🔄 Restarting continuous recognition');
          setTimeout(() => {
            if (recognitionRef.current === recognition) {
              start();
            }
          }, 100);
        } else {
          setIsActive(false);
        }
      };

      // Start recognition
      recognition.start();
      recognitionRef.current = recognition;
      setIsActive(true);

      Logger.info('✅ Fallback STT started', {
        lang,
        continuous,
        interimResults,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start speech recognition';
      Logger.error('❌ Failed to initialize fallback STT', { error: err });
      onError?.(errorMessage);
      setIsActive(false);
    }
  }, [isSupported, lang, continuous, interimResults, onResult, onError]);

  /**
   * Stop speech recognition
   */
  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsActive(false);
        Logger.info('✅ Fallback STT stopped');
      } catch (err) {
        Logger.error('❌ Failed to stop fallback STT', { error: err });
      }
    }
  }, []);

  return {
    isSupported,
    start,
    stop,
    isActive,
  };
};

/**
 * Get user-friendly error message from speech recognition error code
 */
function getErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'no-speech': '음성이 감지되지 않았습니다',
    'audio-capture': '마이크에 접근할 수 없습니다',
    'not-allowed': '마이크 권한이 거부되었습니다',
    'network': '네트워크 오류가 발생했습니다',
    'aborted': '음성 인식이 중단되었습니다',
    'bad-grammar': '음성 인식 설정 오류',
    'language-not-supported': '지원하지 않는 언어입니다',
  };

  return errorMessages[errorCode] || `음성 인식 오류: ${errorCode}`;
}

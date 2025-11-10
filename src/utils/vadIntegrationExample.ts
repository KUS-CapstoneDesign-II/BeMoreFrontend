/**
 * VAD Integration Example
 *
 * Shows how to integrate VAD utilities with the WebSocket message handler
 * in App.tsx to handle Backend VAD data correctly.
 *
 * USAGE:
 * 1. Replace the VAD message handler in App.tsx with code from "OPTION 1" or "OPTION 2" below
 * 2. Test with Backend VAD messages
 * 3. Adjust transformation options based on Backend format feedback
 */

import { transformVADData, analyzeVADFormat, debugVADTransformation } from './vadUtils';
import type { VADMetrics } from './vadUtils';
import { Logger } from '../config/env';

/**
 * ============================================================================
 * OPTION 1: Automatic Format Detection (Recommended)
 * ============================================================================
 * Automatically detects Backend VAD data format and applies appropriate transformations.
 * Best for handling multiple possible Backend formats.
 *
 * IMPLEMENTATION:
 * Replace the VAD message handler in App.tsx with:
 *
 * case 'vad_analysis':
 *   const vadMetrics = transformVADData(message.data, {
 *     mapFields: true,              // Handle snake_case field names
 *     normalizeRanges: true,         // Handle 0-100 range values
 *     convertTimeUnits: true,        // Handle seconds vs milliseconds
 *     validateOutput: true,          // Validate final output
 *   });
 *
 *   if (vadMetrics) {
 *     setVADData(vadMetrics);
 *     Logger.debug('✅ VAD metrics processed', vadMetrics);
 *   } else {
 *     Logger.error('❌ VAD metrics processing failed', message.data);
 *   }
 *   break;
 */

// Example function demonstrating Option 1
export function handleVADAnalysisOption1(message: { data: Record<string, unknown> }) {
  const vadMetrics = transformVADData(message.data, {
    mapFields: true,
    normalizeRanges: true,
    convertTimeUnits: true,
    validateOutput: true,
  });

  if (vadMetrics) {
    // Update Frontend state with transformed metrics
    // setVADData(vadMetrics);
    Logger.debug('✅ VAD metrics processed', vadMetrics);
    return vadMetrics;
  } else {
    Logger.error('❌ VAD metrics processing failed', message.data);
    return null;
  }
}

/**
 * ============================================================================
 * OPTION 2: Custom Format Configuration (For Specific Backend)
 * ============================================================================
 * Once Backend confirms their exact format, use this with targeted transformations.
 * More efficient when you know exactly what the Backend sends.
 *
 * EXAMPLES:
 *
 * // If Backend uses snake_case but correct ranges/units:
 * const vadMetrics = transformVADData(message.data, {
 *   mapFields: true,
 *   normalizeRanges: false,
 *   convertTimeUnits: false,
 *   validateOutput: true,
 * });
 *
 * // If Backend uses camelCase but 0-100 ranges:
 * const vadMetrics = transformVADData(message.data, {
 *   mapFields: false,
 *   normalizeRanges: true,
 *   convertTimeUnits: false,
 *   validateOutput: true,
 * });
 *
 * // If Backend uses seconds for all time fields:
 * const vadMetrics = transformVADData(message.data, {
 *   mapFields: true,
 *   normalizeRanges: true,
 *   convertTimeUnits: true,
 *   validateOutput: true,
 * });
 */

// Example configurations for different Backend formats
export const VAD_FORMAT_CONFIGS = {
  // Scenario 1: Backend sends correct camelCase with 0.0-1.0 ranges
  camelCasePerfect: {
    mapFields: false,
    normalizeRanges: false,
    convertTimeUnits: false,
    validateOutput: true,
  },

  // Scenario 2: Backend sends snake_case with correct ranges
  snakeCaseCorrectRanges: {
    mapFields: true,
    normalizeRanges: false,
    convertTimeUnits: false,
    validateOutput: true,
  },

  // Scenario 3: Backend sends camelCase but 0-100 ranges
  camelCase0to100Range: {
    mapFields: false,
    normalizeRanges: true,
    convertTimeUnits: false,
    validateOutput: true,
  },

  // Scenario 4: Backend sends snake_case, 0-100 ranges, seconds
  snakeCaseFullTransform: {
    mapFields: true,
    normalizeRanges: true,
    convertTimeUnits: true,
    validateOutput: true,
  },

  // Scenario 5: All transformations enabled (safest)
  safeMode: {
    mapFields: true,
    normalizeRanges: true,
    convertTimeUnits: true,
    validateOutput: true,
  },
};

/**
 * ============================================================================
 * OPTION 3: Diagnostic First, Then Transform (For Troubleshooting)
 * ============================================================================
 * Use this approach when you're unsure of Backend format.
 * First analyzes the format, logs diagnostics, then applies transformations.
 *
 * IMPLEMENTATION:
 * Replace VAD message handler with:
 *
 * case 'vad_analysis':
 *   const analysis = analyzeVADFormat(message.data);
 *   Logger.info('🔍 VAD Format Analysis', analysis);
 *
 *   const vadMetrics = transformVADData(message.data, {
 *     mapFields: analysis.recommendations.some(r => r.includes('map')),
 *     normalizeRanges: analysis.recommendations.some(r => r.includes('Normalize')),
 *     convertTimeUnits: analysis.recommendations.some(r => r.includes('Convert')),
 *     validateOutput: true,
 *   });
 *
 *   if (vadMetrics) {
 *     setVADData(vadMetrics);
 *     debugVADTransformation(message.data, vadMetrics);
 *   }
 *   break;
 */

// Example function demonstrating Option 3
export function handleVADAnalysisOption3(message: { data: Record<string, unknown> }) {
  const analysis = analyzeVADFormat(message.data);
  Logger.info('🔍 VAD Format Analysis', analysis);

  // Determine which transformations are needed based on analysis
  const transformConfig = {
    mapFields: analysis.recommendations.some((r) =>
      r.includes('field name mapping'),
    ),
    normalizeRanges: analysis.recommendations.some((r) =>
      r.includes('Normalize'),
    ),
    convertTimeUnits: analysis.recommendations.some((r) =>
      r.includes('Convert'),
    ),
    validateOutput: true,
  };

  Logger.debug('🔧 Applied transformation config', transformConfig);

  const vadMetrics = transformVADData(message.data, transformConfig);

  if (vadMetrics) {
    Logger.debug('✅ VAD metrics processed', vadMetrics);
    debugVADTransformation(message.data, vadMetrics);
    return vadMetrics;
  } else {
    Logger.error('❌ VAD metrics processing failed', message.data);
    debugVADTransformation(message.data, null);
    return null;
  }
}

/**
 * ============================================================================
 * OPTION 4: Manual Field Mapping (For Custom Backend Formats)
 * ============================================================================
 * For Backend formats that don't fit the standard patterns.
 * Define exact field mappings and custom transformation logic.
 *
 * EXAMPLE:
 * If Backend sends: { vad_score, pause_time_ms, speech_percent, etc. }
 * You can manually map: { vad_score → speechRatio, pause_time_ms → longestPause, etc. }
 */

interface CustomVADMapping {
  [backendField: string]: keyof VADMetrics;
}

export function transformVADDataCustom(
  backendData: Record<string, unknown>,
  fieldMapping: CustomVADMapping,
  rangeScaler?: (value: number) => number,
  timeConverter?: (value: number) => number,
): VADMetrics | null {
  try {
    const transformed: Record<string, unknown> = {};

    // Apply custom field mapping
    for (const [backendField, frontendField] of Object.entries(fieldMapping)) {
      if (backendField in backendData) {
        let value: unknown = backendData[backendField];

        // Apply range scaling if provided
        if (
          (frontendField === 'speechRatio' || frontendField === 'pauseRatio') &&
          rangeScaler
        ) {
          value = rangeScaler(Number(value));
        }

        // Apply time conversion if provided
        if (
          (frontendField === 'averagePauseDuration' ||
            frontendField === 'longestPause' ||
            frontendField === 'averageSpeechBurst') &&
          timeConverter
        ) {
          value = timeConverter(Number(value));
        }

        transformed[frontendField] = value;
      }
    }

    return transformed as unknown as VADMetrics;
  } catch (error) {
    Logger.error('❌ Custom VAD transformation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * ============================================================================
 * COMPLETE App.tsx Integration Example
 * ============================================================================
 * Full code snippet showing how to integrate VAD utilities into App.tsx
 *
 * Replace the WebSocket message handler section (around line 140-200) with:
 */

export const APP_TSX_VAD_INTEGRATION = `
// In App.tsx, within the WebSocket message handler:

case 'vad_analysis':
  try {
    // OPTION 1: Use automatic format detection (recommended)
    const vadMetrics = transformVADData(message.data, {
      mapFields: true,
      normalizeRanges: true,
      convertTimeUnits: true,
      validateOutput: true,
    });

    if (vadMetrics) {
      setVADData(vadMetrics);
      Logger.debug('✅ VAD metrics received', vadMetrics);
    } else {
      Logger.error('❌ VAD metrics validation failed', message.data);
      // Show error to user or use fallback data
      setVADData(null);
    }
  } catch (error) {
    Logger.error('❌ VAD handler error', { error });
    setVADData(null);
  }
  break;

// Update the VAD display component to handle the transformed data:

<div className="vad-metrics">
  {vadData && (
    <>
      <p>발화 비율: {(vadData.speechRatio * 100).toFixed(1)}%</p>
      <p>침묵 비율: {(vadData.pauseRatio * 100).toFixed(1)}%</p>
      <p>평균 침묵 시간: {(vadData.averagePauseDuration / 1000).toFixed(2)}초</p>
      <p>가장 긴 침묵: {(vadData.longestPause / 1000).toFixed(2)}초</p>
      <p>발화 버스트 수: {vadData.speechBurstCount}</p>
      <p>침묵 수: {vadData.pauseCount}</p>
      <p>{vadData.summary}</p>
    </>
  )}
</div>
`;

/**
 * ============================================================================
 * Testing with Mock Backend Data
 * ============================================================================
 * For testing before Backend is ready, use these mock messages:
 */

// Mock 1: Correct camelCase with 0.0-1.0 ranges
export const MOCK_VAD_CORRECT = {
  speechRatio: 0.65,
  pauseRatio: 0.35,
  averagePauseDuration: 2500,
  longestPause: 8000,
  speechBurstCount: 12,
  averageSpeechBurst: 5500,
  pauseCount: 11,
  summary: '자연스러운 발화 패턴',
};

// Mock 2: snake_case with 0-100 ranges and seconds
export const MOCK_VAD_NEEDS_TRANSFORM = {
  speech_ratio: 65,
  pause_ratio: 35,
  average_pause_duration: 2.5,
  longest_pause: 8,
  speech_burst_count: 12,
  average_speech_burst: 5.5,
  pause_count: 11,
  summary: '자연스러운 발화 패턴',
};

// Test function
export function testVADTransformation() {
  Logger.info('🧪 Testing VAD Transformation');

  // Test 1: Correct format
  const result1 = transformVADData(MOCK_VAD_CORRECT, { validateOutput: true });
  Logger.info('Test 1 (correct format)', {
    input: MOCK_VAD_CORRECT,
    output: result1,
    success: result1 !== null,
  });

  // Test 2: Needs transformation
  const result2 = transformVADData(MOCK_VAD_NEEDS_TRANSFORM, {
    mapFields: true,
    normalizeRanges: true,
    convertTimeUnits: true,
    validateOutput: true,
  });
  Logger.info('Test 2 (needs transformation)', {
    input: MOCK_VAD_NEEDS_TRANSFORM,
    output: result2,
    success: result2 !== null,
  });

  // Test 3: Analyze format
  const analysis = analyzeVADFormat(MOCK_VAD_NEEDS_TRANSFORM);
  Logger.info('Test 3 (format analysis)', analysis);
}

export default {
  handleVADAnalysisOption1,
  handleVADAnalysisOption3,
  transformVADDataCustom,
  VAD_FORMAT_CONFIGS,
  testVADTransformation,
  MOCK_VAD_CORRECT,
  MOCK_VAD_NEEDS_TRANSFORM,
};

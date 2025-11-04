/**
 * VAD (Voice Activity Detection) Data Utilities
 *
 * Handles transformation of Backend VAD metrics to Frontend expected format.
 * Supports multiple data formats from Backend (field naming, data ranges, time units).
 *
 * Expected Frontend Format:
 * {
 *   speechRatio: 0.0-1.0,
 *   pauseRatio: 0.0-1.0,
 *   averagePauseDuration: number (milliseconds),
 *   longestPause: number (milliseconds),
 *   speechBurstCount: number,
 *   averageSpeechBurst: number (milliseconds),
 *   pauseCount: number,
 *   summary: string
 * }
 */

import { Logger } from '../config/env';

/**
 * Frontend VAD Metrics Interface
 */
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

/**
 * Possible Backend VAD Data Format (flexible input)
 */
export interface BackendVADData {
  [key: string]: any;
}

/**
 * Field name mapping from snake_case to camelCase
 */
const FIELD_NAME_MAPPING: Record<string, keyof VADMetrics> = {
  // camelCase (already correct)
  speechRatio: 'speechRatio',
  pauseRatio: 'pauseRatio',
  averagePauseDuration: 'averagePauseDuration',
  longestPause: 'longestPause',
  speechBurstCount: 'speechBurstCount',
  averageSpeechBurst: 'averageSpeechBurst',
  pauseCount: 'pauseCount',
  summary: 'summary',

  // snake_case (Backend format - potential)
  speech_ratio: 'speechRatio',
  pause_ratio: 'pauseRatio',
  average_pause_duration: 'averagePauseDuration',
  longest_pause: 'longestPause',
  speech_burst_count: 'speechBurstCount',
  average_speech_burst: 'averageSpeechBurst',
  pause_count: 'pauseCount',

  // Abbreviated variants
  sr: 'speechRatio',
  pr: 'pauseRatio',
  apd: 'averagePauseDuration',
  lp: 'longestPause',
  sbc: 'speechBurstCount',
  asb: 'averageSpeechBurst',
  pc: 'pauseCount',
};

/**
 * Map Backend field names to Frontend camelCase format
 * Handles: camelCase, snake_case, and abbreviated variations
 *
 * @param data Backend VAD data with potentially different field names
 * @returns Data with standardized camelCase field names
 */
export function mapVADMetrics(data: BackendVADData): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  for (const [backendKey, frontendKey] of Object.entries(FIELD_NAME_MAPPING)) {
    if (backendKey in data) {
      mapped[frontendKey] = data[backendKey];
    }
  }

  // If no fields were mapped, check for alternative patterns
  if (Object.keys(mapped).length === 0) {
    Logger.warn('⚠️ VAD field mapping failed - no recognized field names found', {
      receivedFields: Object.keys(data),
      expectedFields: Object.keys(FIELD_NAME_MAPPING),
    });
    return data; // Return original data as fallback
  }

  return mapped;
}

/**
 * Normalize VAD metric ranges to 0.0-1.0 scale
 * Handles: 0-1, 0-100, percentages
 *
 * @param metrics Metrics with possibly incorrect ranges
 * @returns Metrics normalized to 0.0-1.0 range
 */
export function normalizeVADMetrics(
  metrics: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = { ...metrics };

  // Fields that should be in 0.0-1.0 range
  const ratioFields = ['speechRatio', 'pauseRatio'];

  for (const field of ratioFields) {
    if (field in normalized && typeof normalized[field] === 'number') {
      const value = normalized[field];

      // Detect format and normalize
      if (value > 1.0) {
        // Assume 0-100 range
        if (value > 100) {
          Logger.warn(`⚠️ ${field} value exceeds 100: ${value}`, { field, value });
          normalized[field] = Math.min(1.0, value / 1000); // Possible millisecond format
        } else {
          // 0-100 range
          normalized[field] = value / 100;
        }
      }
      // else: already in 0.0-1.0 range
    }
  }

  return normalized;
}

/**
 * Convert time values to milliseconds
 * Detects and converts from seconds, minutes, etc.
 *
 * @param metrics Metrics with possibly different time units
 * @returns Metrics with all time values in milliseconds
 */
export function convertTimeUnits(
  metrics: Record<string, unknown>,
): Record<string, unknown> {
  const converted = { ...metrics };

  // Fields that represent time durations
  const timeFields = [
    'averagePauseDuration',
    'longestPause',
    'averageSpeechBurst',
  ];

  for (const field of timeFields) {
    if (field in converted && typeof converted[field] === 'number') {
      const value = converted[field];

      // Detect time unit from value magnitude
      if (value > 100000) {
        // Likely already in milliseconds (max ~100 seconds)
        // Do nothing
      } else if (value > 100) {
        // Likely in seconds (if >100, must be milliseconds)
        // Assume seconds
        converted[field] = value * 1000;
      }
      // else: likely already in milliseconds
    }
  }

  return converted;
}

/**
 * Comprehensive VAD data transformer
 * Applies all transformations: field mapping, normalization, unit conversion
 *
 * @param backendData Raw data from Backend
 * @param options Transformation options
 * @returns Frontend-formatted VAD metrics
 */
export function transformVADData(
  backendData: BackendVADData,
  options: {
    mapFields?: boolean;
    normalizeRanges?: boolean;
    convertTimeUnits?: boolean;
    validateOutput?: boolean;
  } = {},
): VADMetrics | null {
  try {
    const {
      mapFields = true,
      normalizeRanges = true,
      convertTimeUnits: convertTime = true,
      validateOutput = true,
    } = options;

    let result: Record<string, any> = { ...backendData };

    // Step 1: Map field names
    if (mapFields) {
      result = mapVADMetrics(result);
    }

    // Step 2: Normalize ranges
    if (normalizeRanges) {
      result = normalizeVADMetrics(result);
    }

    // Step 3: Convert time units
    if (convertTime) {
      result = convertTimeUnits(result);
    }

    // Step 4: Validate output
    if (validateOutput) {
      const validation = validateVADMetrics(result as VADMetrics);
      if (!validation.valid) {
        Logger.warn('⚠️ VAD metrics validation failed', {
          errors: validation.errors,
          data: result,
        });
        if (validation.critical) {
          return null; // Return null for critical failures
        }
      }
    }

    return result as VADMetrics;
  } catch (error) {
    Logger.error('❌ VAD data transformation failed', {
      error: error instanceof Error ? error.message : String(error),
      data: backendData,
    });
    return null;
  }
}

/**
 * Validate VAD metrics for correct format and ranges
 *
 * @param metrics Metrics to validate
 * @returns Validation result with errors list and criticality flag
 */
export function validateVADMetrics(metrics: Partial<VADMetrics>): {
  valid: boolean;
  errors: string[];
  critical: boolean;
} {
  const errors: string[] = [];

  // Check required fields
  const requiredFields: (keyof VADMetrics)[] = [
    'speechRatio',
    'pauseRatio',
    'averagePauseDuration',
    'longestPause',
    'speechBurstCount',
    'averageSpeechBurst',
    'pauseCount',
  ];

  for (const field of requiredFields) {
    if (!(field in metrics)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate ratio fields (0.0-1.0)
  const ratioFields: (keyof VADMetrics)[] = ['speechRatio', 'pauseRatio'];
  for (const field of ratioFields) {
    if (field in metrics) {
      const value = metrics[field];
      if (typeof value !== 'number') {
        errors.push(`${field} should be a number, got ${typeof value}`);
      } else if (value < 0 || value > 1) {
        errors.push(`${field} should be between 0 and 1, got ${value}`);
      }
    }
  }

  // Validate time fields (should be positive numbers in milliseconds)
  const timeFields: (keyof VADMetrics)[] = [
    'averagePauseDuration',
    'longestPause',
    'averageSpeechBurst',
  ];
  for (const field of timeFields) {
    if (field in metrics) {
      const value = metrics[field];
      if (typeof value !== 'number') {
        errors.push(`${field} should be a number, got ${typeof value}`);
      } else if (value < 0) {
        errors.push(`${field} should be positive, got ${value}`);
      } else if (value > 3600000) {
        // 1 hour in milliseconds - likely wrong unit
        errors.push(`${field} exceeds 1 hour - check time unit conversion`);
      }
    }
  }

  // Validate count fields (should be non-negative integers)
  const countFields: (keyof VADMetrics)[] = ['speechBurstCount', 'pauseCount'];
  for (const field of countFields) {
    if (field in metrics) {
      const value = metrics[field];
      if (typeof value !== 'number') {
        errors.push(`${field} should be a number, got ${typeof value}`);
      } else if (value < 0) {
        errors.push(`${field} should be non-negative, got ${value}`);
      } else if (!Number.isInteger(value)) {
        errors.push(`${field} should be an integer, got ${value}`);
      }
    }
  }

  // Validate summary field
  if ('summary' in metrics && typeof metrics.summary !== 'string') {
    errors.push(`summary should be a string, got ${typeof metrics.summary}`);
  }

  // Determine if errors are critical
  const criticalErrors = errors.filter(
    (e) => e.includes('Missing') || e.includes('should be a number'),
  );

  return {
    valid: errors.length === 0,
    errors,
    critical: criticalErrors.length > 0,
  };
}

/**
 * Diagnostic tool: Analyze Backend VAD message format
 * Helps identify field names, data ranges, and time units used by Backend
 *
 * @param backendData Raw data from Backend
 * @returns Analysis report
 */
export function analyzeVADFormat(backendData: BackendVADData): {
  fieldNames: string[];
  ratioFields: { name: string; value: number; detectedFormat: string }[];
  timeFields: { name: string; value: number; detectedUnit: string }[];
  countFields: { name: string; value: number }[];
  recommendations: string[];
} {
  const fieldNames = Object.keys(backendData);
  const ratioFields: { name: string; value: number; detectedFormat: string }[] = [];
  const timeFields: { name: string; value: number; detectedUnit: string }[] = [];
  const countFields: { name: string; value: number }[] = [];
  const recommendations: string[] = [];

  // Analyze each field
  for (const [key, value] of Object.entries(backendData)) {
    if (typeof value !== 'number') continue;

    // Detect ratio fields
    if (
      key.toLowerCase().includes('ratio') ||
      key.toLowerCase().includes('rate') ||
      key.toLowerCase().includes('percentage')
    ) {
      let detectedFormat = 'unknown';
      if (value >= 0 && value <= 1) {
        detectedFormat = '0.0-1.0';
      } else if (value >= 0 && value <= 100) {
        detectedFormat = '0-100';
        recommendations.push(`Normalize ${key} from 0-100 to 0.0-1.0`);
      }
      ratioFields.push({ name: key, value, detectedFormat });
    }

    // Detect time fields
    if (
      key.toLowerCase().includes('duration') ||
      key.toLowerCase().includes('pause') ||
      key.toLowerCase().includes('burst')
    ) {
      let detectedUnit = 'unknown';
      if (value > 100000) {
        detectedUnit = 'milliseconds';
      } else if (value > 100) {
        detectedUnit = 'seconds (needs conversion to ms)';
        recommendations.push(`Convert ${key} from seconds to milliseconds`);
      } else if (value > 1) {
        detectedUnit = 'seconds or milliseconds (ambiguous)';
        recommendations.push(`Confirm ${key} time unit (seconds or milliseconds)`);
      } else {
        detectedUnit = 'milliseconds or fractional seconds';
      }
      timeFields.push({ name: key, value, detectedUnit });
    }

    // Detect count fields
    if (
      key.toLowerCase().includes('count') ||
      key.toLowerCase().includes('number')
    ) {
      if (Number.isInteger(value) && value >= 0) {
        countFields.push({ name: key, value });
      }
    }
  }

  // Field name recommendations
  if (fieldNames.some((f) => f.includes('_'))) {
    recommendations.push('Backend uses snake_case - will need field name mapping');
  }

  return {
    fieldNames,
    ratioFields,
    timeFields,
    countFields,
    recommendations,
  };
}

/**
 * Debug helper: Log VAD data transformation details
 * Useful for troubleshooting data format mismatches
 *
 * @param backendData Raw Backend data
 * @param transformed Transformed Frontend data
 */
export function debugVADTransformation(
  backendData: BackendVADData,
  transformed: VADMetrics | null,
): void {
  Logger.debug('🔍 VAD Data Transformation Debug Info', {
    backend: backendData,
    transformed,
    analysis: analyzeVADFormat(backendData),
    validation: transformed ? validateVADMetrics(transformed) : 'null result',
  });
}

export default {
  mapVADMetrics,
  normalizeVADMetrics,
  convertTimeUnits,
  transformVADData,
  validateVADMetrics,
  analyzeVADFormat,
  debugVADTransformation,
};

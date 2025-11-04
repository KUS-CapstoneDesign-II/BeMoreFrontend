/**
 * VAD Utilities Test Suite
 *
 * Tests for vadUtils.ts transformations:
 * - Field name mapping (camelCase ↔ snake_case)
 * - Range normalization (0-100 ↔ 0.0-1.0)
 * - Time unit conversion (seconds ↔ milliseconds)
 * - Comprehensive transformation and validation
 */

import {
  mapVADMetrics,
  normalizeVADMetrics,
  convertTimeUnits,
  transformVADData,
  validateVADMetrics,
  analyzeVADFormat,
  VADMetrics,
} from '../vadUtils';

/**
 * Test Suite: Field Name Mapping
 */
describe('mapVADMetrics', () => {
  test('should handle camelCase fields (no mapping needed)', () => {
    const input = {
      speechRatio: 0.65,
      pauseRatio: 0.35,
      averagePauseDuration: 2500,
      longestPause: 8000,
      speechBurstCount: 12,
      averageSpeechBurst: 5500,
      pauseCount: 11,
      summary: 'test',
    };

    const output = mapVADMetrics(input);
    expect(output.speechRatio).toBe(0.65);
    expect(output.pauseRatio).toBe(0.35);
  });

  test('should convert snake_case to camelCase', () => {
    const input = {
      speech_ratio: 0.65,
      pause_ratio: 0.35,
      average_pause_duration: 2500,
      longest_pause: 8000,
      speech_burst_count: 12,
      average_speech_burst: 5500,
      pause_count: 11,
      summary: 'test',
    };

    const output = mapVADMetrics(input);
    expect(output.speechRatio).toBe(0.65);
    expect(output.pauseRatio).toBe(0.35);
    expect(output.averagePauseDuration).toBe(2500);
    expect(output.longestPause).toBe(8000);
  });

  test('should handle mixed camelCase and snake_case', () => {
    const input = {
      speechRatio: 0.65, // camelCase
      pause_ratio: 0.35, // snake_case
      averagePauseDuration: 2500, // camelCase
      longest_pause: 8000, // snake_case
    };

    const output = mapVADMetrics(input);
    expect(output.speechRatio).toBe(0.65);
    expect(output.pauseRatio).toBe(0.35);
    expect(output.averagePauseDuration).toBe(2500);
    expect(output.longestPause).toBe(8000);
  });

  test('should handle abbreviated field names', () => {
    const input = {
      sr: 0.65, // speech_ratio
      pr: 0.35, // pause_ratio
      apd: 2500, // average_pause_duration
      sbc: 12, // speech_burst_count
    };

    const output = mapVADMetrics(input);
    expect(output.speechRatio).toBe(0.65);
    expect(output.pauseRatio).toBe(0.35);
    expect(output.averagePauseDuration).toBe(2500);
    expect(output.speechBurstCount).toBe(12);
  });
});

/**
 * Test Suite: Range Normalization
 */
describe('normalizeVADMetrics', () => {
  test('should leave correct 0.0-1.0 ranges unchanged', () => {
    const input = {
      speechRatio: 0.65,
      pauseRatio: 0.35,
    };

    const output = normalizeVADMetrics(input);
    expect(output.speechRatio).toBe(0.65);
    expect(output.pauseRatio).toBe(0.35);
  });

  test('should convert 0-100 range to 0.0-1.0', () => {
    const input = {
      speechRatio: 65,
      pauseRatio: 35,
    };

    const output = normalizeVADMetrics(input);
    expect(output.speechRatio).toBe(0.65);
    expect(output.pauseRatio).toBe(0.35);
  });

  test('should handle edge cases (0 and 100)', () => {
    const input = {
      speechRatio: 0,
      pauseRatio: 100,
    };

    const output = normalizeVADMetrics(input);
    expect(output.speechRatio).toBe(0);
    expect(output.pauseRatio).toBe(1.0);
  });

  test('should handle percentages (1-100)', () => {
    const input = {
      speechRatio: 1,
      pauseRatio: 99,
    };

    const output = normalizeVADMetrics(input);
    expect(output.speechRatio).toBe(0.01);
    expect(output.pauseRatio).toBe(0.99);
  });
});

/**
 * Test Suite: Time Unit Conversion
 */
describe('convertTimeUnits', () => {
  test('should leave milliseconds unchanged', () => {
    const input = {
      averagePauseDuration: 2500,
      longestPause: 8000,
      averageSpeechBurst: 5500,
    };

    const output = convertTimeUnits(input);
    expect(output.averagePauseDuration).toBe(2500);
    expect(output.longestPause).toBe(8000);
    expect(output.averageSpeechBurst).toBe(5500);
  });

  test('should convert seconds to milliseconds', () => {
    const input = {
      averagePauseDuration: 2.5,
      longestPause: 8,
      averageSpeechBurst: 5.5,
    };

    const output = convertTimeUnits(input);
    expect(output.averagePauseDuration).toBe(2500);
    expect(output.longestPause).toBe(8000);
    expect(output.averageSpeechBurst).toBe(5500);
  });

  test('should handle edge case (exact boundary)', () => {
    const input = {
      averagePauseDuration: 100, // Ambiguous: could be 100ms or 100s
      longestPause: 101, // Likely milliseconds
    };

    const output = convertTimeUnits(input);
    // 100 is at boundary, treated as milliseconds
    expect(output.averagePauseDuration).toBe(100);
    expect(output.longestPause).toBe(101);
  });

  test('should handle small values (already in milliseconds)', () => {
    const input = {
      averagePauseDuration: 50,
      longestPause: 20,
      averageSpeechBurst: 30,
    };

    const output = convertTimeUnits(input);
    expect(output.averagePauseDuration).toBe(50);
    expect(output.longestPause).toBe(20);
    expect(output.averageSpeechBurst).toBe(30);
  });
});

/**
 * Test Suite: Comprehensive Transformation
 */
describe('transformVADData', () => {
  test('should handle already-correct data', () => {
    const input = {
      speechRatio: 0.65,
      pauseRatio: 0.35,
      averagePauseDuration: 2500,
      longestPause: 8000,
      speechBurstCount: 12,
      averageSpeechBurst: 5500,
      pauseCount: 11,
      summary: 'Natural speech pattern',
    };

    const output = transformVADData(input);
    expect(output).not.toBeNull();
    expect(output?.speechRatio).toBe(0.65);
    expect(output?.pauseRatio).toBe(0.35);
  });

  test('should handle data requiring all transformations', () => {
    const input = {
      speech_ratio: 65, // snake_case + 0-100 range
      pause_ratio: 35,
      average_pause_duration: 2.5, // seconds
      longest_pause: 8,
      speech_burst_count: 12,
      average_speech_burst: 5.5,
      pause_count: 11,
      summary: '자연스러운 발화 패턴',
    };

    const output = transformVADData(input, {
      mapFields: true,
      normalizeRanges: true,
      convertTimeUnits: true,
      validateOutput: true,
    });

    expect(output).not.toBeNull();
    expect(output?.speechRatio).toBe(0.65);
    expect(output?.pauseRatio).toBe(0.35);
    expect(output?.averagePauseDuration).toBe(2500);
    expect(output?.longestPause).toBe(8000);
  });

  test('should return null for data with missing critical fields', () => {
    const input = {
      speechRatio: 0.65,
      // Missing required fields
    };

    const output = transformVADData(input, { validateOutput: true });
    expect(output).toBeNull();
  });

  test('should skip transformations when disabled', () => {
    const input = {
      speech_ratio: 65, // Would need transformation
      pause_ratio: 35,
      average_pause_duration: 2.5,
      longest_pause: 8,
      speech_burst_count: 12,
      average_speech_burst: 5.5,
      pause_count: 11,
      summary: 'test',
    };

    const output = transformVADData(input, {
      mapFields: false, // Don't map snake_case
      normalizeRanges: false,
      convertTimeUnits: false,
      validateOutput: false,
    });

    // Should return original data since no transformations applied
    expect(output?.speech_ratio).toBe(65);
  });
});

/**
 * Test Suite: Validation
 */
describe('validateVADMetrics', () => {
  const validMetrics: Partial<VADMetrics> = {
    speechRatio: 0.65,
    pauseRatio: 0.35,
    averagePauseDuration: 2500,
    longestPause: 8000,
    speechBurstCount: 12,
    averageSpeechBurst: 5500,
    pauseCount: 11,
    summary: 'test',
  };

  test('should accept valid metrics', () => {
    const validation = validateVADMetrics(validMetrics);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  test('should reject out-of-range ratio values', () => {
    const invalid = {
      ...validMetrics,
      speechRatio: 1.5, // Should be 0.0-1.0
    };

    const validation = validateVADMetrics(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('speechRatio'))).toBe(true);
  });

  test('should reject negative count values', () => {
    const invalid = {
      ...validMetrics,
      speechBurstCount: -5,
    };

    const validation = validateVADMetrics(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('speechBurstCount'))).toBe(
      true,
    );
  });

  test('should reject non-integer count values', () => {
    const invalid = {
      ...validMetrics,
      pauseCount: 5.5, // Should be integer
    };

    const validation = validateVADMetrics(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('pauseCount'))).toBe(true);
  });

  test('should report critical errors for missing fields', () => {
    const invalid = {
      // Missing all fields
    };

    const validation = validateVADMetrics(invalid);
    expect(validation.critical).toBe(true);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('should warn about excessive time values', () => {
    const invalid = {
      ...validMetrics,
      longestPause: 3700000, // >1 hour
    };

    const validation = validateVADMetrics(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('exceeds'))).toBe(true);
  });
});

/**
 * Test Suite: Format Analysis
 */
describe('analyzeVADFormat', () => {
  test('should detect correct format', () => {
    const data = {
      speechRatio: 0.65,
      pauseRatio: 0.35,
      averagePauseDuration: 2500,
      longestPause: 8000,
      speechBurstCount: 12,
      averageSpeechBurst: 5500,
      pauseCount: 11,
      summary: 'test',
    };

    const analysis = analyzeVADFormat(data);
    expect(analysis.fieldNames.length).toBe(8);
    expect(analysis.ratioFields.length).toBe(2);
    expect(analysis.timeFields.length).toBe(3);
    expect(analysis.countFields.length).toBe(2);
    expect(analysis.recommendations.length).toBe(0);
  });

  test('should recommend snake_case mapping', () => {
    const data = {
      speech_ratio: 0.65,
      pause_ratio: 0.35,
      average_pause_duration: 2500,
    };

    const analysis = analyzeVADFormat(data);
    expect(
      analysis.recommendations.some((r) =>
        r.includes('field name mapping'),
      ),
    ).toBe(true);
  });

  test('should recommend range normalization', () => {
    const data = {
      speechRatio: 65, // 0-100 range
      pauseRatio: 35,
      averagePauseDuration: 2500,
    };

    const analysis = analyzeVADFormat(data);
    expect(
      analysis.recommendations.some((r) =>
        r.includes('Normalize'),
      ),
    ).toBe(true);
  });

  test('should recommend time unit conversion', () => {
    const data = {
      speechRatio: 0.65,
      pauseRatio: 0.35,
      averagePauseDuration: 2.5, // seconds
      longestPause: 8,
      averageSpeechBurst: 5.5,
    };

    const analysis = analyzeVADFormat(data);
    expect(
      analysis.recommendations.some((r) =>
        r.includes('Convert'),
      ),
    ).toBe(true);
  });

  test('should detect all fields correctly', () => {
    const data = {
      speech_ratio: 65,
      pause_ratio: 35,
      average_pause_duration: 2.5,
      longest_pause: 8,
      speech_burst_count: 12,
      average_speech_burst: 5.5,
      pause_count: 11,
      summary: 'test',
    };

    const analysis = analyzeVADFormat(data);
    expect(analysis.ratioFields.length).toBe(2);
    expect(analysis.timeFields.length).toBe(3);
    expect(analysis.countFields.length).toBe(2);
  });
});

/**
 * Test Suite: Real-World Scenarios
 */
describe('Real-world scenarios', () => {
  test('Scenario 1: Backend sends correct format', () => {
    const backendMessage = {
      type: 'vad_analysis',
      data: {
        speechRatio: 0.65,
        pauseRatio: 0.35,
        averagePauseDuration: 2500,
        longestPause: 8000,
        speechBurstCount: 12,
        averageSpeechBurst: 5500,
        pauseCount: 11,
        summary: 'Natural speech pattern',
      },
    };

    const result = transformVADData(backendMessage.data);
    expect(result).not.toBeNull();
    expect(result?.speechRatio).toBe(0.65);
  });

  test('Scenario 2: Backend sends snake_case with 0-100 ranges', () => {
    const backendMessage = {
      type: 'vad_analysis',
      data: {
        speech_ratio: 65,
        pause_ratio: 35,
        average_pause_duration: 2.5,
        longest_pause: 8.0,
        speech_burst_count: 12,
        average_speech_burst: 5.5,
        pause_count: 11,
        summary: '자연스러운 발화 패턴',
      },
    };

    const result = transformVADData(backendMessage.data, {
      mapFields: true,
      normalizeRanges: true,
      convertTimeUnits: true,
      validateOutput: true,
    });

    expect(result).not.toBeNull();
    expect(result?.speechRatio).toBe(0.65);
    expect(result?.pauseRatio).toBe(0.35);
    expect(result?.averagePauseDuration).toBe(2500);
    expect(result?.longestPause).toBe(8000);
  });

  test('Scenario 3: Partial data from Backend', () => {
    const backendMessage = {
      type: 'vad_analysis',
      data: {
        speechRatio: 0.65,
        pauseRatio: 0.35,
        // Missing some fields
      },
    };

    const result = transformVADData(backendMessage.data, {
      validateOutput: true,
    });

    expect(result).toBeNull(); // Should fail validation
  });
});

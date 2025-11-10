/**
 * Type Guards and Safe Access Utilities
 *
 * Helper functions for type-safe array and object access,
 * especially useful with noUncheckedIndexedAccess enabled.
 */

/**
 * Safely access an array element by index
 * Returns undefined if index is out of bounds
 */
export function safeArrayAccess<T>(array: T[], index: number): T | undefined {
  if (index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
}

/**
 * Safely access an array element with a fallback value
 */
export function safeArrayAccessWithDefault<T>(
  array: T[],
  index: number,
  defaultValue: T
): T {
  const value = safeArrayAccess(array, index);
  return value !== undefined ? value : defaultValue;
}

/**
 * Get the first element of an array safely
 */
export function first<T>(array: T[]): T | undefined {
  return array[0];
}

/**
 * Get the last element of an array safely
 */
export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

/**
 * Safely access an object property
 * Returns undefined if property doesn't exist
 */
export function safeObjectAccess<T extends Record<string, unknown>, K extends string>(
  obj: T,
  key: K
): T[K] | undefined {
  return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}

/**
 * Safely access an object property with a fallback value
 */
export function safeObjectAccessWithDefault<
  T extends Record<string, unknown>,
  K extends string,
  V
>(obj: T, key: K, defaultValue: V): T[K] | V {
  const value = safeObjectAccess(obj, key);
  return value !== undefined ? value : defaultValue;
}

/**
 * Type guard to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a value is a valid array index
 */
export function isValidArrayIndex<T>(array: T[], index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < array.length;
}

/**
 * Type guard to check if an object has a specific key
 */
export function hasKey<K extends string>(
  obj: Record<string, unknown>,
  key: K
): obj is Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Filter out undefined values from an array
 * Useful when mapping with optional chaining
 */
export function filterDefined<T>(array: (T | undefined)[]): T[] {
  return array.filter(isDefined);
}

/**
 * Safely get a value from a Record/Map-like structure
 * Ensures the key exists before accessing
 */
export function getFromRecord<K extends string | number | symbol, V>(
  record: Record<K, V>,
  key: K
): V | undefined {
  return key in record ? record[key] : undefined;
}

/**
 * Assert that a value is defined, throwing an error if not
 * Useful for cases where undefined is truly unexpected
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value must be defined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Safely split array into chunks
 * Returns empty array if invalid chunk size
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0 || !Number.isInteger(chunkSize)) {
    return [];
  }

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Safely find an element in an array with type narrowing
 */
export function safeFindWithDefault<T>(
  array: T[],
  predicate: (item: T) => boolean,
  defaultValue: T
): T {
  const found = array.find(predicate);
  return found !== undefined ? found : defaultValue;
}

/**
 * Check if array has elements (non-empty array type guard)
 */
export function isNonEmptyArray<T>(array: T[]): array is [T, ...T[]] {
  return array.length > 0;
}

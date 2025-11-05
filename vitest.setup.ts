import '@testing-library/jest-dom';
// Silence ResizeObserver in JSDOM if used by components
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error: jsdom lacks ResizeObserver by default
global.ResizeObserver = global.ResizeObserver || MockResizeObserver;

// Mock IntersectionObserver for lazy loading tests
class MockIntersectionObserver {
  constructor(public callback: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error: jsdom lacks IntersectionObserver by default
global.IntersectionObserver = global.IntersectionObserver || MockIntersectionObserver;


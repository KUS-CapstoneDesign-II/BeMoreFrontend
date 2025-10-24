import '@testing-library/jest-dom';
// Silence ResizeObserver in JSDOM if used by components
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.ResizeObserver = global.ResizeObserver || MockResizeObserver;


import '@testing-library/jest-dom';
// Silence ResizeObserver in JSDOM if used by components
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error: jsdom lacks ResizeObserver by default
global.ResizeObserver = global.ResizeObserver || MockResizeObserver;


export async function initA11y(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  try {
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    // Avoid bundler resolution in prod builds
    const mod = '@axe-core/react';
    const axeModule = await import(/* @vite-ignore */ mod);
    const axe = (axeModule as unknown as { default: (r: unknown, rd: unknown, timeout?: number) => void }).default;
    axe(React, ReactDOM, 1000);
  } catch {
    // axe is optional in dev; ignore if missing
  }
}



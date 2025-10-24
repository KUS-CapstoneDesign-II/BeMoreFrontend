import { render, screen } from '@testing-library/react';
import React from 'react';
import { NetworkStatusBanner } from '../NetworkStatusBanner';

describe('NetworkStatusBanner', () => {
  it('shows offline message when offline', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    render(<NetworkStatusBanner />);
    expect(screen.getByText(/오프라인 상태입니다/)).toBeInTheDocument();
  });
});



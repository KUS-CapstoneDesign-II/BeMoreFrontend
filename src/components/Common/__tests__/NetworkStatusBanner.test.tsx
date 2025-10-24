import { render, screen } from '@testing-library/react';
import React from 'react';
import { NetworkStatusBanner } from '../NetworkStatusBanner';
import { SettingsProvider } from '../../../../contexts/SettingsContext';
import { I18nProvider } from '../../../../contexts/I18nContext';

describe('NetworkStatusBanner', () => {
  it('shows offline message when offline', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    render(
      <SettingsProvider>
        <I18nProvider>
          <NetworkStatusBanner />
        </I18nProvider>
      </SettingsProvider>
    );
    expect(screen.getByText(/오프라인 상태입니다/)).toBeInTheDocument();
  });
});



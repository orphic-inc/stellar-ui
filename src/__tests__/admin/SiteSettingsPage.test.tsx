import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import SiteSettingsPage from '../../components/admin/SiteSettingsPage';

const mockUseGetSiteSettingsQuery = jest.fn();
const mockUpdateSettings = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/siteApi', () => ({
  useGetSiteSettingsQuery: () => mockUseGetSiteSettingsQuery(),
  useUpdateSiteSettingsMutation: () => [
    mockUpdateSettings,
    { isLoading: false }
  ]
}));

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn()
}));

const makeSettings = (overrides = {}) => ({
  registrationStatus: 'open' as const,
  maxUsers: 7000,
  approvedDomains: ['gmail.com', 'proton.me'],
  ...overrides
});

describe('SiteSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetSiteSettingsQuery.mockReturnValue({
      data: makeSettings(),
      isLoading: false
    });
    mockUpdateSettings.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
  });

  it('shows spinner while loading', () => {
    mockUseGetSiteSettingsQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<SiteSettingsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('pre-fills form with existing settings', () => {
    renderWithProviders(<SiteSettingsPage />);
    const select = screen.getByRole('combobox', {
      name: /registration/i
    }) as HTMLSelectElement;
    expect(select.value).toBe('open');
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe(
      '7000'
    );
    expect(screen.getByRole('textbox')).toHaveValue('gmail.com\nproton.me');
  });

  it('calls updateSettings on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SiteSettingsPage />);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        registrationStatus: 'open',
        maxUsers: 7000,
        approvedDomains: ['gmail.com', 'proton.me']
      })
    );
  });

  it('does not call updateSettings when maxUsers is zero', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SiteSettingsPage />);
    const maxField = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.clear(maxField);
    await user.type(maxField, '0');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });
});

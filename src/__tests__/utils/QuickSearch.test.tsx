import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import QuickSearch from '../../components/layout/QuickSearch';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('QuickSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search inputs for all entity types', () => {
    renderWithProviders(<QuickSearch />);
    expect(screen.getByPlaceholderText('Releases')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Artists')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Forums')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Users')).toBeInTheDocument();
  });

  it('navigates with query on Enter key', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickSearch />);
    await user.type(
      screen.getByPlaceholderText('Releases'),
      'Kind of Blue{Enter}'
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      `/releases?q=${encodeURIComponent('Kind of Blue')}`
    );
  });

  it('navigates to base path when query is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickSearch />);
    await user.type(screen.getByPlaceholderText('Artists'), '{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/artists');
  });

  it('clears input after navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickSearch />);
    const input = screen.getByPlaceholderText('Forums');
    await user.type(input, 'jazz{Enter}');
    expect((input as HTMLInputElement).value).toBe('');
  });
});

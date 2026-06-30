import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import StylesheetManager from '../../components/admin/StylesheetManager';

const mockGetStylesheets = jest.fn();
const mockGetStats = jest.fn();
const mockUpdateStylesheet = jest.fn();

let mockSaving = false;

jest.mock('../../store/services/siteApi', () => ({
  useGetStylesheetsQuery: () => mockGetStylesheets(),
  useGetStylesheetStatsQuery: () => mockGetStats(),
  useUpdateStylesheetMutation: () => [
    mockUpdateStylesheet,
    { isLoading: mockSaving }
  ]
}));

const makeSheet = (id: number, name: string, isDefault = false) => ({
  id,
  name,
  description: `${name} theme`,
  cssUrl: `/stylesheets/${name}.css`,
  isDefault
});

describe('StylesheetManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaving = false;
    mockUpdateStylesheet.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockGetStats.mockReturnValue({ data: [], isLoading: false });
  });

  it('shows a spinner while loading', () => {
    mockGetStylesheets.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<StylesheetManager />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders stylesheets on the grid table (kit hooks present)', () => {
    mockGetStylesheets.mockReturnValue({
      data: [makeSheet(1, 'kuro', true), makeSheet(2, 'proton')],
      isLoading: false
    });
    renderWithProviders(<StylesheetManager />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('kuro')).toBeInTheDocument();
    expect(screen.getByText('proton')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    mockGetStylesheets.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<StylesheetManager />);
    expect(screen.getByText(/no stylesheets found/i)).toBeInTheDocument();
  });

  it('sets a stylesheet as default', async () => {
    const user = userEvent.setup();
    mockGetStylesheets.mockReturnValue({
      data: [makeSheet(2, 'proton')],
      isLoading: false
    });
    renderWithProviders(<StylesheetManager />);
    await user.click(screen.getByRole('button', { name: /set default/i }));
    expect(mockUpdateStylesheet).toHaveBeenCalledWith({
      id: 2,
      isDefault: true
    });
  });
});

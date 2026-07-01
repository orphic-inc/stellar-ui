import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ContributionsPage from '../../components/contribute/ContributionsPage';

const mockUseGetContributionsQuery = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useGetContributionsQuery: () => mockUseGetContributionsQuery()
}));

const makeContribution = (id: number) => ({
  id,
  type: 'FLAC',
  sizeInBytes: 1073741824,
  downloadUrl: 'https://example.com/file.flac',
  releaseDescription: 'High quality lossless',
  collaborators: [{ id: 1, name: 'Miles Davis' }],
  release: {
    id: 10,
    title: 'Kind of Blue',
    communityId: 1
  }
});

describe('ContributionsPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows spinner while loading', () => {
    mockUseGetContributionsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<ContributionsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseGetContributionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<ContributionsPage />);
    expect(
      screen.getByText(/failed to load contributions/i)
    ).toBeInTheDocument();
  });

  it('shows empty state with upload link when no contributions', () => {
    mockUseGetContributionsQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ContributionsPage />);
    expect(screen.getByText(/no contributions yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /upload something!/i })
    ).toBeInTheDocument();
  });

  it('renders contribution table with release, format, size, collaborators', () => {
    mockUseGetContributionsQuery.mockReturnValue({
      data: { data: [makeContribution(1), makeContribution(2)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ContributionsPage />);
    expect(screen.getAllByText('Kind of Blue').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FLAC').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Miles Davis').length).toBeGreaterThan(0);
    expect(screen.getAllByText('High quality lossless').length).toBeGreaterThan(
      0
    );
    expect(screen.getByRole('link', { name: '+ Upload' })).toBeInTheDocument();
  });

  it('shows download link for each contribution', () => {
    mockUseGetContributionsQuery.mockReturnValue({
      data: { data: [makeContribution(1)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ContributionsPage />);
    expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
  });

  it('shows dash when no collaborators', () => {
    mockUseGetContributionsQuery.mockReturnValue({
      data: {
        data: [{ ...makeContribution(1), collaborators: [] }]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ContributionsPage />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('renders release title as plain text when communityId is null', () => {
    mockUseGetContributionsQuery.mockReturnValue({
      data: {
        data: [
          {
            ...makeContribution(1),
            release: { id: 10, title: 'Orphaned Release', communityId: null }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ContributionsPage />);
    expect(screen.getByText('Orphaned Release')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Orphaned Release' })
    ).not.toBeInTheDocument();
  });

  it('shows dash when releaseDescription or sizeInBytes is null', () => {
    mockUseGetContributionsQuery.mockReturnValue({
      data: {
        data: [
          {
            ...makeContribution(1),
            releaseDescription: null,
            sizeInBytes: null
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ContributionsPage />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('renders empty list when data has no data field', () => {
    mockUseGetContributionsQuery.mockReturnValue({
      data: {},
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ContributionsPage />);
    expect(screen.getByText(/no contributions yet/i)).toBeInTheDocument();
  });

  it('paints the table + controls from the data-st contract (ADR-0006)', () => {
    mockUseGetContributionsQuery.mockReturnValue({
      data: { data: [makeContribution(1)] },
      isLoading: false,
      error: undefined
    });
    const { container } = renderWithProviders(<ContributionsPage />);
    // Columnar data keeps its <table>; the grid/colhead/row variant paints it.
    expect(
      container.querySelector('table[data-st="grid"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('thead[data-st="colhead"]')
    ).toBeInTheDocument();
    expect(container.querySelector('tr[data-st="row"]')).toBeInTheDocument();
    expect(container.querySelector('[data-st="title"]')).toBeInTheDocument();
    // Upload CTA is a filled control; the download link is a plain control.
    expect(
      container.querySelector('a[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
  });
});

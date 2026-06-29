import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import PrivateFooter from '../../components/pages/private/layout/PrivateFooter';

const mockUseGetVersionQuery = jest.fn();

jest.mock('../../store/services/siteApi', () => ({
  useGetVersionQuery: () => mockUseGetVersionQuery()
}));

describe('PrivateFooter', () => {
  beforeEach(() => {
    mockUseGetVersionQuery.mockReset();
  });

  it('shows the running platform version from /api/version', () => {
    mockUseGetVersionQuery.mockReturnValue({ data: { version: '0.6.0' } });

    renderWithProviders(<PrivateFooter />);

    expect(screen.getByText('Powered by Stellar v0.6.0')).toBeInTheDocument();
  });

  it('falls back to the build-time version when /api/version is unreachable', () => {
    mockUseGetVersionQuery.mockReturnValue({ data: undefined });

    renderWithProviders(<PrivateFooter />);

    expect(
      screen.getByText('Powered by Stellar v0.0.0-test')
    ).toBeInTheDocument();
  });

  it('paints from the surface tokens (data-st contract)', () => {
    mockUseGetVersionQuery.mockReturnValue({ data: undefined });
    const { container } = renderWithProviders(<PrivateFooter />);
    expect(container.querySelector('footer')?.className).toContain(
      'bg-[var(--st-backdrop)]'
    );
  });
});

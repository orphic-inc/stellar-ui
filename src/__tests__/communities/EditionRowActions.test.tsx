import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import EditionRowActions from '../../components/communities/EditionRowActions';
import type { ReleaseContributionDetail } from '../../types';

jest.mock(
  '../../components/communities/RatioExemptControl',
  () =>
    function RatioExemptControl({
      contribution
    }: {
      contribution: { id: number };
    }) {
      return <div data-testid={`ratio-exempt-${contribution.id}`} />;
    }
);
jest.mock(
  '../../components/communities/DownloadButton',
  () =>
    function DownloadButton() {
      return <button type="button">Download</button>;
    }
);

const flac = {
  id: 5,
  releaseId: 3,
  type: 'flac',
  linkStatus: 'PASS',
  ratioExempt: 'NONE'
} as ReleaseContributionDetail;

describe('EditionRowActions', () => {
  it('offers the ratio exemption control for the row (#392)', () => {
    renderWithProviders(
      <EditionRowActions contribution={flac} canDownload onReport={jest.fn()} />
    );
    expect(screen.getByTestId('ratio-exempt-5')).toBeInTheDocument();
    expect(screen.getByText('Link OK')).toBeInTheDocument();
  });

  it('reports the row it belongs to', async () => {
    const onReport = jest.fn();
    renderWithProviders(
      <EditionRowActions contribution={flac} canDownload onReport={onReport} />
    );
    await userEvent.click(screen.getByRole('button', { name: '[Report]' }));
    expect(onReport).toHaveBeenCalledWith(5);
  });
});

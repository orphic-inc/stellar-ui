import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import EditionStack from '../../components/communities/EditionStack';
import type { ReleaseContributionDetail } from '../../types';

const contribution = (
  overrides: Partial<ReleaseContributionDetail> = {}
): ReleaseContributionDetail => ({
  id: 1,
  userId: 7,
  releaseId: 3,
  contributorId: 4,
  releaseDescription: null,
  downloadUrl: 'https://example.com/f.torrent',
  sizeInBytes: 520_000_000,
  linkStatus: 'PASS',
  linkCheckedAt: null,
  type: 'flac',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  user: { id: 7, username: 'seeder' },
  collaborators: [],
  releaseFile: {
    bitrate: 'Lossless',
    hasLog: true,
    hasCue: true,
    isScene: false
  },
  edition: {
    id: 10,
    media: 'CD',
    year: null,
    recordLabel: null,
    catalogueNumber: null,
    title: null,
    isRemaster: false,
    isUnknownEdition: false
  },
  ...overrides
});

describe('EditionStack', () => {
  it('emits the edition-stack Part hook', () => {
    renderWithProviders(<EditionStack contributions={[contribution()]} />);
    expect(document.querySelector('[data-st="edition-stack"]')).not.toBeNull();
  });

  it('groups contributions under their edition heading', () => {
    renderWithProviders(
      <EditionStack
        contributions={[
          contribution({ id: 1, type: 'flac' }),
          contribution({
            id: 2,
            type: 'mp3',
            releaseFile: {
              bitrate: 'Kbps320',
              hasLog: false,
              hasCue: false,
              isScene: false
            }
          })
        ]}
      />
    );
    // One heading (shared edition), two format rows.
    expect(screen.getByText('Original Release / CD')).toBeInTheDocument();
    expect(screen.getByText('FLAC / Lossless')).toBeInTheDocument();
    expect(screen.getByText('MP3 / 320')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-st="edition"]')).toHaveLength(2);
  });

  it('renders a separate heading per distinct edition', () => {
    renderWithProviders(
      <EditionStack
        contributions={[
          contribution({ id: 1 }),
          contribution({
            id: 2,
            edition: {
              id: 20,
              media: 'Vinyl',
              year: 2011,
              recordLabel: 'Rhino',
              catalogueNumber: null,
              title: 'Reissue',
              isRemaster: true,
              isUnknownEdition: false
            }
          })
        ]}
      />
    );
    expect(screen.getByText('Original Release / CD')).toBeInTheDocument();
    expect(
      screen.getByText('2011 - Rhino / Reissue / Vinyl')
    ).toBeInTheDocument();
  });

  it('marks lossless rows with the lossless modifier and shows rip flags', () => {
    renderWithProviders(<EditionStack contributions={[contribution()]} />);
    const row = document.querySelector('[data-st="edition"]');
    expect(row).toHaveAttribute('data-st-lossless');
    expect(screen.getByText('Log')).toBeInTheDocument();
    expect(screen.getByText('Cue')).toBeInTheDocument();
  });

  it('does not mark a lossy row as lossless', () => {
    renderWithProviders(
      <EditionStack
        contributions={[
          contribution({
            releaseFile: {
              bitrate: 'Kbps320',
              hasLog: false,
              hasCue: false,
              isScene: false
            }
          })
        ]}
      />
    );
    expect(document.querySelector('[data-st="edition"]')).not.toHaveAttribute(
      'data-st-lossless'
    );
  });

  it('renders per-row actions from the render-prop', () => {
    renderWithProviders(
      <EditionStack
        contributions={[contribution({ id: 42 })]}
        renderActions={(c) => <button type="button">DL {c.id}</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'DL 42' })).toBeInTheDocument();
  });

  it('collapses an edition group when its heading is toggled', async () => {
    renderWithProviders(<EditionStack contributions={[contribution()]} />);
    expect(document.querySelectorAll('[data-st="edition"]')).toHaveLength(1);
    await userEvent.click(screen.getByText('Original Release / CD'));
    expect(document.querySelectorAll('[data-st="edition"]')).toHaveLength(0);
  });
});

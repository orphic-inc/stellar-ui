import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CommunityReleaseRow from '../../components/communities/CommunityReleaseRow';
import type { CommunityReleasesResponse } from '../../store/services/communityApi';

// Moved out of CommunityPage (#475); CommunityPage.test covers its place in
// the list, this covers what the row itself wires up.

jest.mock('../../components/communities/DownloadButton', () => ({
  __esModule: true,
  default: ({
    contributionId,
    canDownload
  }: {
    contributionId: number;
    canDownload: boolean;
  }) => <span data-testid="download">{`${contributionId}:${canDownload}`}</span>
}));

type Release = CommunityReleasesResponse['data'][number];

const makeRelease = (overrides: Record<string, unknown> = {}): Release =>
  ({
    id: 5,
    title: 'Kind of Blue',
    artist: { id: 1, name: 'Miles Davis' },
    year: 1959,
    type: 'Album',
    imageSrc: null,
    group: null,
    tags: [],
    contributions: [
      {
        id: 105,
        type: 'FLAC',
        sizeInBytes: 1073741824,
        linkStatus: 'PASS',
        ratioExempt: false,
        user: { id: 10, username: 'alice' },
        _count: { consumers: 1 }
      }
    ],
    ...overrides
  }) as unknown as Release;

const renderRow = (release: Release, onReport = jest.fn()) => {
  renderWithProviders(
    <CommunityReleaseRow
      release={release}
      communityId={3}
      canDownload
      onReport={onReport}
    />
  );
  return onReport;
};

describe('CommunityReleaseRow', () => {
  it("links the title to the release, under the community's path", () => {
    renderRow(makeRelease());

    expect(screen.getByRole('link', { name: 'Kind of Blue' })).toHaveAttribute(
      'href',
      '/communities/3/releases/5'
    );
  });

  it("shows the group's cover over the release's own, else a placeholder", () => {
    renderRow(
      makeRelease({
        imageSrc: '/api/asset/release',
        group: { imageSrc: '/api/asset/group' }
      })
    );
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/api/asset/group'
    );
  });

  it('draws the placeholder when there is no cover', () => {
    renderRow(makeRelease());

    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it("reports the format's own contribution", async () => {
    const onReport = renderRow(makeRelease());

    await userEvent.click(screen.getByRole('button', { name: '[Report]' }));

    expect(onReport).toHaveBeenCalledWith(105);
  });

  it('passes the contribution and download right to its download button', () => {
    renderRow(makeRelease());

    expect(screen.getByTestId('download')).toHaveTextContent('105:true');
  });

  it('says one snatch and one contributor in the singular', () => {
    renderRow(makeRelease());

    expect(screen.getByText('1 contributor')).toBeInTheDocument();
    expect(screen.getAllByText('1 snatch')).toHaveLength(2);
  });
});

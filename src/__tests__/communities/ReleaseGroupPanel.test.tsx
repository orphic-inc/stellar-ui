import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ReleaseGroupPanel from '../../components/communities/ReleaseGroupPanel';

const mockGetReleaseGroupQuery = jest.fn();

jest.mock('../../store/services/releaseGroupApi', () => ({
  useGetReleaseGroupQuery: (...args: unknown[]) =>
    mockGetReleaseGroupQuery(...args)
}));

const group = { id: 42, title: 'Kind of Blue', year: 1959 };

const member = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  title: 'Kind of Blue',
  year: 1959,
  image: null,
  communityId: 1,
  community: { id: 1, name: 'Jazz Community' },
  artist: { id: 10, name: 'Miles Davis' },
  ...overrides
});

describe('ReleaseGroupPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the group identity before the member list arrives', () => {
    mockGetReleaseGroupQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false
    });
    renderWithProviders(
      <ReleaseGroupPanel group={group} currentReleaseId={5} />
    );
    // Identity comes from the INLINE group object, so it must be on screen with
    // no response at all — that split is the point of the panel (ADR-0037).
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument();
    expect(screen.getByText('1959')).toBeInTheDocument();
    expect(screen.getByText(/loading other releases/i)).toBeInTheDocument();
  });

  it('marks the current release rather than hiding it, and links the others', () => {
    mockGetReleaseGroupQuery.mockReturnValue({
      data: {
        id: 42,
        title: 'Kind of Blue',
        releases: [
          member(),
          member({
            id: 9,
            communityId: 7,
            community: { id: 7, name: 'Tapehead' }
          })
        ]
      },
      isLoading: false,
      isError: false
    });
    renderWithProviders(
      <ReleaseGroupPanel group={group} currentReleaseId={5} />
    );

    expect(screen.getByText('you are here')).toBeInTheDocument();

    // The sibling links out; the release being viewed does not link to itself.
    const links = [...document.querySelectorAll('a')].map((a) =>
      a.getAttribute('href')
    );
    expect(links).toContain('/communities/7/releases/9');
    expect(links).not.toContain('/communities/1/releases/5');

    expect(screen.getByText('Tapehead')).toBeInTheDocument();
  });

  it('renders a member with no community as unlinked text', () => {
    mockGetReleaseGroupQuery.mockReturnValue({
      data: {
        id: 42,
        title: 'Kind of Blue',
        releases: [
          member({ id: 9, communityId: null, community: null, title: 'Orphan' })
        ]
      },
      isLoading: false,
      isError: false
    });
    renderWithProviders(
      <ReleaseGroupPanel group={group} currentReleaseId={5} />
    );
    expect(screen.getByText('Orphan')).toBeInTheDocument();
    expect(document.querySelectorAll('a').length).toBe(0);
  });

  it('renders nothing at all on an error, rather than an error banner', () => {
    // The api answers 404 for a group with no viewer-visible member, using the
    // same status and message as a group that does not exist — deliberately
    // indistinguishable. It cannot arise from this page, since the viewer can
    // see this release; if it ever does, "no panel" is the right shape.
    mockGetReleaseGroupQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true
    });
    const { container } = renderWithProviders(
      <ReleaseGroupPanel group={group} currentReleaseId={5} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('This album')).not.toBeInTheDocument();
  });

  it('shows a shorter member list without complaint', () => {
    // The list is access-filtered: a release in a community the viewer cannot
    // reach is simply absent. A one-member group is the correct rendering of
    // "this album, everywhere you can reach it" — not an empty state.
    mockGetReleaseGroupQuery.mockReturnValue({
      data: { id: 42, title: 'Kind of Blue', releases: [member()] },
      isLoading: false,
      isError: false
    });
    renderWithProviders(
      <ReleaseGroupPanel group={group} currentReleaseId={5} />
    );
    expect(screen.getByText('This album')).toBeInTheDocument();
    expect(screen.getByText('you are here')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-st="row"]').length).toBe(1);
  });
});

import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import CommunityPage from '../../components/communities/CommunityPage';

// The community release list badges each file's ratio exemption (ui#181). A
// file of its own, with only the mocks the release list needs, rather than
// growing CommunityPage.test.tsx.

const noopMutation = () => [jest.fn(), { isLoading: false }];
const mockReleases = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunityByIdQuery: () => ({
    data: { id: 3, name: 'Jazz Vault', members: [], curators: [] },
    isLoading: false
  }),
  useGetReleasesByCommunityQuery: () => mockReleases(),
  useAddCommunityMemberMutation: () => noopMutation(),
  useRemoveCommunityMemberMutation: () => noopMutation(),
  useAddCommunityCuratorMutation: () => noopMutation(),
  useRemoveCommunityCuratorMutation: () => noopMutation()
}));

jest.mock('../../store/services/bookmarkApi', () => ({
  useToggleCommunityBookmarkMutation: () => noopMutation()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ communityId: '3' })
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => ({ id: 7, canDownload: true, userRank: {} }),
  useDispatch: () => jest.fn()
}));

const file = (id: number, ratioExempt: string) => ({
  id,
  type: 'flac',
  sizeInBytes: 1073741824,
  linkStatus: 'PASS',
  ratioExempt,
  user: { id: 10, username: 'alice' },
  _count: { consumers: 0 }
});

it('badges each file on the community release list by its exemption', () => {
  mockReleases.mockReturnValue({
    data: {
      data: [
        {
          id: 1,
          title: 'Kind of Blue',
          contributions: [
            file(101, 'NONE'),
            file(102, 'FREEPASS'),
            file(103, 'NEUTRALPASS')
          ],
          _count: { contributions: 3 }
        }
      ],
      meta: { total: 1, limit: 25 }
    },
    isLoading: false
  });
  renderWithProviders(<CommunityPage />);

  expect(screen.getByText('Freepass')).toBeInTheDocument();
  expect(screen.getByText('Neutralpass')).toBeInTheDocument();
});

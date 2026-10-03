import { renderHook } from '@testing-library/react';
import { useReleaseWorkbench } from '../../components/communities/useReleaseWorkbench';
import type { AuthUser } from '../../types';

// Which release controls a viewer gets (#390). They match the api's gates in
// stellar-api `modules/releaseWorkbench/authority.ts`: tags and history revert
// need communities_manage, while metadata editing also admits staff and the
// release's contributors. A staff-only rank once saw tag × and Revert, and
// each answered 403.

let mockIsContributor = false;
const mutation = () => [jest.fn(), { isLoading: false }];

jest.mock('../../store/services/communityApi', () => ({
  useGetReleaseByIdQuery: () => ({
    data: { id: 3, isContributor: mockIsContributor },
    isLoading: false,
    error: undefined
  }),
  useGetCommunityByIdQuery: () => ({ data: undefined }),
  useGetReleaseHistoryQuery: () => ({ data: undefined, isLoading: false }),
  useVoteOnReleaseMutation: () => mutation(),
  useRemoveVoteOnReleaseMutation: () => mutation(),
  useAddTagToReleaseMutation: () => mutation(),
  useVoteOnReleaseTagMutation: () => mutation(),
  useRemoveTagFromReleaseMutation: () => mutation(),
  useRevertReleaseHistoryMutation: () => mutation(),
  useUpdateReleaseMutation: () => mutation()
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn()
}));

const gatesFor = (permissions: Record<string, boolean>) => {
  const user = { id: 1, userRank: { permissions } } as unknown as AuthUser;
  const { result } = renderHook(() =>
    useReleaseWorkbench({ communityId: 2, releaseId: 3, user })
  );
  return {
    canManageTags: result.current.canManageTags,
    canEdit: result.current.canEdit
  };
};

beforeEach(() => {
  mockIsContributor = false;
});

it('gives a staff-only rank metadata editing, but no tag or revert controls', () => {
  expect(gatesFor({ staff: true })).toEqual({
    canManageTags: false,
    canEdit: true
  });
});

it('gives communities_manage every control', () => {
  expect(gatesFor({ communities_manage: true })).toEqual({
    canManageTags: true,
    canEdit: true
  });
});

it('gives admin every control', () => {
  expect(gatesFor({ admin: true })).toEqual({
    canManageTags: true,
    canEdit: true
  });
});

it('gives a contributor metadata editing on their release, and nothing else', () => {
  mockIsContributor = true;
  expect(gatesFor({})).toEqual({ canManageTags: false, canEdit: true });
});

it('gives a member neither', () => {
  expect(gatesFor({})).toEqual({ canManageTags: false, canEdit: false });
});

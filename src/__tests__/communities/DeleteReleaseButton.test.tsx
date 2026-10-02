import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import DeleteReleaseButton from '../../components/communities/DeleteReleaseButton';

const mockNavigate = jest.fn();
const mockDelete = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('../../store/services/communityApi', () => ({
  ...jest.requireActual('../../store/services/communityApi'),
  useDeleteReleaseMutation: () => [mockDelete, { isLoading: false }]
}));

const renderAs = (
  permissions: Record<string, boolean>,
  contributionCount: number | undefined
) => {
  const store = createTestStore();
  store.dispatch(
    setCredentials({
      id: 7,
      username: 'curator',
      userRank: { level: 100, name: 'Staff', color: '', permissions }
    } as never)
  );
  return renderWithProviders(
    <DeleteReleaseButton
      communityId={3}
      releaseId={9}
      contributionCount={contributionCount}
    />,
    { store }
  );
};

const button = () => screen.queryByRole('button', { name: '[Delete release]' });

// #429: the api deletes only a release with no contributions (stellar-api#793).
describe('DeleteReleaseButton (#429)', () => {
  beforeEach(() => {
    mockDelete.mockReset();
    mockNavigate.mockReset();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it('shows to communities_manage on a release with no contributions', () => {
    renderAs({ communities_manage: true }, 0);
    expect(button()).toBeInTheDocument();
  });

  it.each([
    ['without communities_manage', {}, 0],
    ['while the contributions load', { communities_manage: true }, undefined],
    ['on a release with a contribution', { communities_manage: true }, 1]
  ])('is hidden %s', (_label, permissions, count) => {
    renderAs(permissions, count);
    expect(button()).toBeNull();
  });

  it('deletes after confirming, then returns to the community', async () => {
    mockDelete.mockReturnValue({ unwrap: () => Promise.resolve() });
    const { store } = renderAs({ communities_manage: true }, 0);

    await userEvent.click(button()!);

    expect(mockDelete).toHaveBeenCalledWith({ communityId: 3, releaseId: 9 });
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/communities/3')
    );
    expect(store.getState().alert).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Release deleted.' })
      ])
    );
  });

  it('does nothing when the confirmation is declined', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    renderAs({ communities_manage: true }, 0);

    await userEvent.click(button()!);

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('stays on the page and shows the api’s message when refused', async () => {
    mockDelete.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: { msg: 'A release with contributions cannot be deleted' }
        })
    });
    const { store } = renderAs({ communities_manage: true }, 0);

    await userEvent.click(button()!);

    await waitFor(() =>
      expect(store.getState().alert).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'A release with contributions cannot be deleted'
          })
        ])
      )
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

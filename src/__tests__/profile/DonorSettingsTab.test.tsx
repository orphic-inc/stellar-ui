import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import DonorSettingsTab from '../../components/profile/settings/DonorSettingsTab';

const mockUseGetDonorRewardsQuery = jest.fn();
const mockUpdateRewards = jest.fn();
const mockUpdateTitle = jest.fn();

jest.mock('../../store/services/profileApi', () => ({
  useGetDonorRewardsQuery: () => mockUseGetDonorRewardsQuery(),
  useUpdateDonorRewardsMutation: () => [
    mockUpdateRewards,
    { isLoading: false }
  ],
  useUpdateDonorForumTitleMutation: () => [
    mockUpdateTitle,
    { isLoading: false }
  ]
}));

const makeRewards = () => ({
  perks: {
    customIcon: true,
    customIconLink: true,
    iconMouseOverText: true,
    secondAvatar: true,
    avatarMouseOverText: true,
    profileInfo1: true,
    forumTitle: true
  },
  rewards: { customIcon: 'https://example.com/icon.png' },
  forumTitle: { prefix: 'Lord', suffix: 'the Generous', useComma: true }
});

describe('DonorSettingsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetDonorRewardsQuery.mockReturnValue({
      data: makeRewards(),
      isLoading: false
    });
  });

  it('shows a spinner while loading', () => {
    mockUseGetDonorRewardsQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<DonorSettingsTab />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders the donor reward and forum-title forms', () => {
    renderWithProviders(<DonorSettingsTab />);
    expect(screen.getByText('Donor Rewards')).toBeInTheDocument();
    expect(screen.getByText('Forum Title')).toBeInTheDocument();
    expect(screen.getByLabelText(/custom icon url/i)).toBeInTheDocument();
  });

  it('paints both forms from the data-st panel/field/control contract', () => {
    const { container } = renderWithProviders(<DonorSettingsTab />);
    expect(container.querySelectorAll('form[data-st="panel"]').length).toBe(2);
    expect(
      container.querySelector('input[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('textarea[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('label[data-st="meta"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('button[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
  });
});

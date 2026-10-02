import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// #275: the two donor image fields take an upload, but only when the perk is
// part of the member's donor rank; a locked field keeps its note instead.
describe('DonorSettingsTab — image uploads (#275)', () => {
  beforeEach(() => {
    mockUseGetDonorRewardsQuery.mockReturnValue({
      data: {
        ...makeRewards(),
        perks: { ...makeRewards().perks, secondAvatar: false }
      },
      isLoading: false
    });
  });

  it('offers an upload for an unlocked image field only', () => {
    renderWithProviders(<DonorSettingsTab />);
    expect(document.getElementById('image-upload-customIcon')).not.toBeNull();
    expect(document.getElementById('image-upload-secondAvatar')).toBeNull();
    expect(
      screen.getByText('Not included in your current donor rank.')
    ).toBeInTheDocument();
  });
});

// #432: an emptied field must reach the api as '', which clears it. Sending
// `undefined` told the api to keep the old value, so nothing could be cleared.
describe('DonorSettingsTab — clearing a field (#432)', () => {
  beforeEach(() => {
    mockUseGetDonorRewardsQuery.mockReturnValue({
      data: makeRewards(),
      isLoading: false
    });
    mockUpdateRewards.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockUpdateTitle.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('sends an emptied reward field as an empty string', async () => {
    renderWithProviders(<DonorSettingsTab />);
    await userEvent.clear(screen.getByLabelText(/custom icon url/i));
    await userEvent.click(
      screen.getByRole('button', { name: /save donor settings/i })
    );
    expect(mockUpdateRewards).toHaveBeenCalledWith(
      expect.objectContaining({ customIcon: '' })
    );
  });

  it('sends an emptied forum title prefix as an empty string', async () => {
    renderWithProviders(<DonorSettingsTab />);
    await userEvent.clear(screen.getByLabelText(/^prefix$/i));
    await userEvent.click(
      screen.getByRole('button', { name: /save forum title/i })
    );
    expect(mockUpdateTitle).toHaveBeenCalledWith({
      prefix: '',
      suffix: 'the Generous',
      useComma: true
    });
  });
});

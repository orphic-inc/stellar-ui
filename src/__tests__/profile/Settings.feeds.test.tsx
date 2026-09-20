import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Settings from '../../components/profile/settings/Settings';

/**
 * The Member Feed settings tab (#349), driven through the mounted Settings
 * page rather than FeedSettings in isolation — a spec that renders a component
 * on its own cannot prove it is reachable from the tab bar.
 */

const ENABLED = {
  enabled: true as const,
  feeds: {
    contributions:
      'https://site.test/api/feeds/contributions.xml?user=7&token=abcd1234',
    mine: 'https://site.test/api/feeds/mine.xml?user=7&token=abcd1234',
    news: 'https://site.test/api/feeds/news.xml?user=7&token=abcd1234',
    bookmarks: 'https://site.test/api/feeds/bookmarks.xml?user=7&token=abcd1234'
  }
};

const ROTATED = {
  enabled: true as const,
  feeds: {
    contributions:
      'https://site.test/api/feeds/contributions.xml?user=7&token=wxyz9999',
    mine: 'https://site.test/api/feeds/mine.xml?user=7&token=wxyz9999',
    news: 'https://site.test/api/feeds/news.xml?user=7&token=wxyz9999',
    bookmarks: 'https://site.test/api/feeds/bookmarks.xml?user=7&token=wxyz9999'
  }
};

let mockFeedsData: unknown = ENABLED;
const mockRotate = jest.fn();
const mockDispatch = jest.fn();
const mockWriteText = jest.fn();

jest.mock('../../store/services/feedApi', () => ({
  useGetMemberFeedsQuery: () => ({ data: mockFeedsData, isLoading: false }),
  useRotateMyFeedTokenMutation: () => [mockRotate, { isLoading: false }]
}));

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunitiesQuery: () => ({
    data: { data: [{ id: 3, name: 'Jazz' }], meta: { total: 1 } }
  })
}));

jest.mock('../../store/services/profileApi', () => ({
  useGetMyProfileQuery: () => ({ data: undefined, isLoading: false }),
  useUpdateMyProfileMutation: () => [jest.fn(), { isLoading: false }]
}));

jest.mock('../../store/services/authApi', () => ({
  useChangePasswordMutation: () => [jest.fn(), { isLoading: false }],
  useChangeEmailMutation: () => [jest.fn(), { isLoading: false }],
  useGetSessionsQuery: () => ({ data: undefined, isLoading: false }),
  useRevokeSessionMutation: () => [jest.fn(), { isLoading: false }]
}));

jest.mock('../../store/services/siteApi', () => ({
  useGetStylesheetsQuery: () => ({ data: [], isLoading: false })
}));

jest.mock('../../store/slices/authSlice', () => ({
  selectCurrentUser: () => ({ id: 7, username: 'testuser' })
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (sel: (s: unknown) => unknown) => sel({}),
  useDispatch: () => mockDispatch
}));

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch
}));

const openFeedsTab = async () => {
  const user = userEvent.setup();
  // After setup(), which installs a clipboard stub of its own and would
  // otherwise replace this one.
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    configurable: true
  });
  renderWithProviders(<Settings />);
  await user.click(screen.getByRole('button', { name: /^feeds$/i }));
  return user;
};

/** The confirm button inside the dialog; the page trigger shares its name. */
const confirmRotate = () =>
  within(screen.getByRole('dialog')).getByRole('button', {
    name: /^reset feed urls$/i
  });

const contributionsUrl = () =>
  (screen.getByLabelText('New contributions') as HTMLInputElement).value;

beforeEach(() => {
  mockFeedsData = ENABLED;
  mockRotate.mockReset();
  mockDispatch.mockReset();
  mockWriteText.mockReset().mockResolvedValue(undefined);
});

describe('Member Feed settings — disabled site (#349)', () => {
  it('says feeds are off and offers no URL or control', async () => {
    mockFeedsData = { enabled: false };
    await openFeedsTab();

    expect(
      screen.getByText(/feeds are not enabled on this site/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText('New contributions')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /copy/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /reset feed urls/i })
    ).not.toBeInTheDocument();
  });
});

describe('Member Feed settings — the list (#349)', () => {
  it('lists all four feeds by name', async () => {
    await openFeedsTab();

    for (const label of [
      'New contributions',
      'My contributions',
      'News',
      'Bookmarks'
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('masks the token until Show tokens is chosen, and never links a URL', async () => {
    const user = await openFeedsTab();

    expect(contributionsUrl()).toContain('token=••••••••');
    expect(contributionsUrl()).not.toContain('abcd1234');
    // A credential must not enter browser history as a visited link.
    expect(
      screen.queryByRole('link', { name: /feeds/i })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show tokens/i }));
    expect(contributionsUrl()).toContain('token=abcd1234');

    await user.click(screen.getByRole('button', { name: /hide tokens/i }));
    expect(contributionsUrl()).toContain('token=••••••••');
  });

  it('reveals every row from the one control, since all four share a token', async () => {
    const user = await openFeedsTab();
    await user.click(screen.getByRole('button', { name: /show tokens/i }));

    for (const label of [
      'New contributions',
      'My contributions',
      'News',
      'Bookmarks'
    ]) {
      expect(
        (screen.getByLabelText(label) as HTMLInputElement).value
      ).toContain('abcd1234');
    }
  });

  it('keeps a relative URL readable rather than throwing on it (stellar-api#667)', async () => {
    mockFeedsData = {
      enabled: true,
      feeds: {
        contributions: '/api/feeds/contributions.xml?user=7&token=abcd1234',
        mine: '/api/feeds/mine.xml?user=7&token=abcd1234',
        news: '/api/feeds/news.xml?user=7&token=abcd1234',
        bookmarks: '/api/feeds/bookmarks.xml?user=7&token=abcd1234'
      }
    };
    await openFeedsTab();

    expect(contributionsUrl()).toBe(
      '/api/feeds/contributions.xml?user=7&token=••••••••'
    );
  });
});

describe('Member Feed settings — copy (#349)', () => {
  it('copies the unmasked URL even while it is displayed masked', async () => {
    const user = await openFeedsTab();
    const [copyButton] = screen.getAllByRole('button', { name: /^copy$/i });

    await user.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith(ENABLED.feeds.contributions);
    expect(
      await screen.findByRole('button', { name: /copied/i })
    ).toBeInTheDocument();
  });

  it('confirms on the button that was clicked, not the others', async () => {
    const user = await openFeedsTab();
    const buttons = screen.getAllByRole('button', { name: /^copy$/i });

    await user.click(buttons[2]);

    expect(mockWriteText).toHaveBeenCalledWith(ENABLED.feeds.news);
    expect(screen.getAllByRole('button', { name: /^copied$/i })).toHaveLength(
      1
    );
  });

  it('tells the member how to copy by hand when the clipboard refuses', async () => {
    mockWriteText.mockRejectedValue(new Error('denied'));
    const user = await openFeedsTab();

    await user.click(screen.getAllByRole('button', { name: /^copy$/i })[0]);

    await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
    const alert = mockDispatch.mock.calls.flat().find((a) => a?.payload);
    expect(JSON.stringify(alert)).toMatch(/show tokens/i);
  });
});

describe('Member Feed settings — filters (#349)', () => {
  it('appends a chosen filter to the contributions URL only', async () => {
    const user = await openFeedsTab();

    await user.selectOptions(screen.getByLabelText('Format'), 'flac');

    expect(contributionsUrl()).toContain('&format=flac');
    expect(
      (screen.getByLabelText('News') as HTMLInputElement).value
    ).not.toContain('format=');
  });

  it('ANDs several filters, and url-encodes a tag', async () => {
    const user = await openFeedsTab();

    await user.selectOptions(screen.getByLabelText('Community'), '3');
    await user.type(screen.getByLabelText('Tag'), 'jazz fusion');
    await user.selectOptions(screen.getByLabelText('Bitrate'), 'KbpsV0');

    const url = contributionsUrl();
    expect(url).toContain('&community=3');
    expect(url).toContain('&tag=jazz%20fusion');
    expect(url).toContain('&bitrate=KbpsV0');
  });

  it('adds nothing while every filter is unset', async () => {
    await openFeedsTab();

    expect(contributionsUrl()).toBe(
      'https://site.test/api/feeds/contributions.xml?user=7&token=••••••••'
    );
  });

  it('offers the contract enums and the member communities, labelling bitrates', async () => {
    await openFeedsTab();

    // 24 formats from the contract, plus "Any format".
    expect(screen.getByLabelText('Format').children).toHaveLength(25);
    expect(screen.getByRole('option', { name: 'flac' })).toBeInTheDocument();
    // Bitrate renders through the shared label map, not the raw enum value.
    expect(
      screen.getByRole('option', { name: 'V0 (VBR)' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'KbpsV0' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Jazz' })).toBeInTheDocument();
  });
});

describe('Member Feed settings — rotation (#349)', () => {
  it('confirms first, warning that URLs in use stop working', async () => {
    const user = await openFeedsTab();

    await user.click(screen.getByRole('button', { name: /reset feed urls/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/stops working immediately/i)).toBeInTheDocument();
    expect(mockRotate).not.toHaveBeenCalled();
  });

  it('keeps the current URLs when the confirmation is declined', async () => {
    const user = await openFeedsTab();

    await user.click(screen.getByRole('button', { name: /reset feed urls/i }));
    await user.click(
      screen.getByRole('button', { name: /keep current urls/i })
    );

    expect(mockRotate).not.toHaveBeenCalled();
    expect(contributionsUrl()).toContain('••••••••');
  });

  it('shows the rotated URLs from the cache the mutation updated', async () => {
    mockRotate.mockReturnValue({
      unwrap: () => {
        // What updateQueryData does in the real mutation: the feeds cache now
        // answers the new URLs, so the section re-renders from the query.
        mockFeedsData = ROTATED;
        return Promise.resolve(ROTATED);
      }
    });
    const user = await openFeedsTab();

    await user.click(screen.getByRole('button', { name: /reset feed urls/i }));
    await user.click(confirmRotate());

    await waitFor(() => expect(mockRotate).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: /show tokens/i }));
    expect(contributionsUrl()).toContain('wxyz9999');
    expect(contributionsUrl()).not.toContain('abcd1234');
  });

  it('leaves the URLs untouched and reports the api msg when rotation fails', async () => {
    mockRotate.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { msg: 'Rate limited. Try later.' } })
    });
    const user = await openFeedsTab();

    await user.click(screen.getByRole('button', { name: /reset feed urls/i }));
    await user.click(confirmRotate());

    await waitFor(() => expect(mockRotate).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: /show tokens/i }));
    expect(contributionsUrl()).toContain('abcd1234');
    expect(JSON.stringify(mockDispatch.mock.calls)).toMatch(/Rate limited/);
  });
});

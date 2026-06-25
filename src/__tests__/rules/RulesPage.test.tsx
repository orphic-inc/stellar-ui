import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import RulesPage from '../../components/rules/RulesPage';

const mockTree = jest.fn();
const mockIndex = jest.fn();

jest.mock('../../store/services/rulesApi', () => ({
  useGetRulesTreeQuery: () => mockTree(),
  useGetRulesIndexQuery: () => mockIndex()
}));

const TREE = {
  rules: [
    {
      id: 1,
      code: '1',
      title: 'Accounts',
      description: '',
      subRules: [
        {
          id: 11,
          code: '1.1',
          title: 'Do not create more than one account.',
          description:
            'If your account is disabled, contact staff in ${disabled_channel} on ${irc}.'
        }
      ]
    }
  ],
  variables: { disabled_channel: '#disabled', irc: '/irc' }
};

beforeEach(() => {
  mockIndex.mockReturnValue({ data: { main: null, pages: [] } });
});

describe('RulesPage', () => {
  it('shows a spinner while the tree loads', () => {
    mockTree.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderWithProviders(<RulesPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders the rules with sub-rules and resolves the tokens', () => {
    mockTree.mockReturnValue({ data: TREE, isLoading: false });
    renderWithProviders(<RulesPage />);

    expect(
      screen.getByRole('heading', { name: /1\.\s*Accounts/ })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Do not create more than one account.')
    ).toBeInTheDocument();
    // ${disabled_channel} → text, ${irc} → an internal link labelled IRC
    expect(
      screen.getByText(/contact staff in #disabled on/)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'IRC' })).toHaveAttribute(
      'href',
      '/irc'
    );
  });

  it('shows the empty state when the tree has no rules', () => {
    mockTree.mockReturnValue({
      data: { rules: [], variables: {} },
      isLoading: false
    });
    renderWithProviders(<RulesPage />);
    expect(
      screen.getByText(/no rules content has been published yet/i)
    ).toBeInTheDocument();
  });

  it('surfaces a load error', () => {
    mockTree.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<RulesPage />);
    expect(screen.getByText(/failed to load the rules/i)).toBeInTheDocument();
  });
});

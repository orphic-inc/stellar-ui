import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import RulesPage from '../../components/rules/RulesPage';

const mockTree = jest.fn();
const mockIndex = jest.fn();

jest.mock('../../store/services/rulesApi', () => ({
  useGetRulesTreeQuery: () => mockTree(),
  useGetRulesIndexQuery: () => mockIndex()
}));

// `code` is the slug machine key the API actually returns (PRD-09); the UI must
// derive the displayed number + anchor id positionally, so the mock uses slugs
// on purpose — a regression to id={rule.code} would fail the anchor assertions.
const TREE = {
  rules: [
    {
      id: 1,
      code: 'golden.accounts',
      title: 'Accounts',
      description: '',
      subRules: [
        {
          id: 11,
          code: 'single-account',
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

  it('anchors each rule and sub-rule by its positional number for [rule] links', () => {
    mockTree.mockReturnValue({ data: TREE, isLoading: false });
    const { container } = renderWithProviders(<RulesPage />);
    // BBCode `[rule]hX` → /rules#X (rule heading) and `[rule]X.Y` → /rules#X.Y
    // (sub-rule); the ids are POSITIONAL (#398), not the slug `code`.
    expect(container.querySelector('section[id="1"]')).toBeInTheDocument();
    expect(container.querySelector('li[id="1.1"]')).toBeInTheDocument();
    // The slug code must never leak into an anchor id.
    expect(
      container.querySelector('[id="golden.accounts"]')
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[id="single-account"]')
    ).not.toBeInTheDocument();
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

  it('paints the rules from the data-st contract', () => {
    mockTree.mockReturnValue({ data: TREE, isLoading: false });
    mockIndex.mockReturnValue({
      data: { main: null, pages: [{ id: 1, slug: 'cat', title: 'A Category' }] }
    });
    const { container } = renderWithProviders(<RulesPage />);
    // Prose-heavy page: headings → prose -strong, rule codes → meta, category
    // links → control (no inline gray).
    expect(
      container.querySelector('[data-st="prose"][data-st-strong]')
    ).toBeInTheDocument();
    expect(container.querySelector('[data-st="meta"]')).toBeInTheDocument();
    expect(container.querySelector('a[data-st="control"]')).toBeInTheDocument();
  });
});

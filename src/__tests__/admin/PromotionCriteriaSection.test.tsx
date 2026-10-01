import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import PromotionCriteriaSection from '../../components/admin/PromotionCriteriaSection';

// The promotion editor follows the api's ladder rule (#383): the target is the
// next primary rank up, rules match by pair, and every other rule leaving the
// rank is listed as out of date with a Delete.

const mockDispatch = jest.fn();
const mockGetPromotionRules = jest.fn();
const mockGetUserRanks = jest.fn();
const mockCreatePromotionRule = jest.fn();
const mockUpdatePromotionRule = jest.fn();
const mockDeletePromotionRule = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useGetPromotionRulesQuery: () => mockGetPromotionRules(),
  useGetUserRanksQuery: () => mockGetUserRanks(),
  useCreatePromotionRuleMutation: () => [mockCreatePromotionRule],
  useUpdatePromotionRuleMutation: () => [mockUpdatePromotionRule],
  useDeletePromotionRuleMutation: () => [mockDeletePromotionRule]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

// Member 150 → Power User 200 → Elite 300; Donor is secondary, and Staff is
// primary but not auto-managed (#425).
const ranks = [
  { id: 1, name: 'User', level: 100, secondary: false, autoManaged: true },
  { id: 2, name: 'Member', level: 150, secondary: false, autoManaged: true },
  {
    id: 3,
    name: 'Power User',
    level: 200,
    secondary: false,
    autoManaged: true
  },
  { id: 4, name: 'Elite', level: 300, secondary: false, autoManaged: true },
  { id: 9, name: 'Donor', level: 120, secondary: true, autoManaged: false },
  { id: 8, name: 'Staff', level: 500, secondary: false, autoManaged: false }
];

const rule = (id: number, fromRankId: number, toRankId: number) => ({
  id,
  fromRankId,
  fromRankName: ranks.find((r) => r.id === fromRankId)?.name ?? null,
  toRankId,
  toRankName: ranks.find((r) => r.id === toRankId)?.name ?? null,
  minContributed: '1073741824',
  minRatio: 1.05,
  minContributions: 5,
  minAccountAgeDays: 14,
  extra: null,
  enabled: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01'
});

const resolved = (value: unknown = {}) => ({
  unwrap: () => Promise.resolve(value)
});
const rejected = (data: unknown) => ({
  unwrap: () => Promise.reject({ status: 422, data })
});

const alerts = () => mockDispatch.mock.calls.map(([action]) => action.payload);

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUserRanks.mockReturnValue({ data: ranks });
  mockGetPromotionRules.mockReturnValue({ data: [] });
  mockCreatePromotionRule.mockReturnValue(resolved());
  mockUpdatePromotionRule.mockReturnValue(resolved());
  mockDeletePromotionRule.mockReturnValue(resolved());
});

describe('PromotionCriteriaSection — the next rung', () => {
  it('shows the next primary rank as a fixed target and creates to it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PromotionCriteriaSection fromRankId={2} />);

    expect(screen.getByLabelText(/promotes to/i)).toHaveTextContent(
      'Power User'
    );
    expect(screen.queryByRole('combobox', { name: /promotes to/i })).toBeNull();

    await user.click(
      screen.getByRole('button', { name: /save promotion criteria/i })
    );
    await waitFor(() =>
      expect(mockCreatePromotionRule).toHaveBeenCalledWith(
        expect.objectContaining({ fromRankId: 2, toRankId: 3 })
      )
    );
  });

  it('renders nothing for a secondary rank with no rules', () => {
    const { container } = renderWithProviders(
      <PromotionCriteriaSection fromRankId={9} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on a staff rank with no rules (#425)', () => {
    const { container } = renderWithProviders(
      <PromotionCriteriaSection fromRankId={8} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on the top rung with no rules', () => {
    const { container } = renderWithProviders(
      <PromotionCriteriaSection fromRankId={4} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('PromotionCriteriaSection — rules matched by pair', () => {
  it('edits the rule to the next rung, not the first from this rank', async () => {
    // Listed first, the stale Member → Elite rule is the one find() took.
    mockGetPromotionRules.mockReturnValue({
      data: [{ ...rule(7, 2, 4), minContributions: 999 }, rule(8, 2, 3)]
    });
    const user = userEvent.setup();
    renderWithProviders(<PromotionCriteriaSection fromRankId={2} />);

    await waitFor(() =>
      expect(
        (screen.getByLabelText(/min contributions/i) as HTMLInputElement).value
      ).toBe('5')
    );
    await user.click(
      screen.getByRole('button', { name: /save promotion criteria/i })
    );
    await waitFor(() =>
      expect(mockUpdatePromotionRule).toHaveBeenCalledWith(
        expect.objectContaining({ id: 8, toRankId: 3 })
      )
    );
  });

  it('lists every other rule as out of date, each with a Delete', async () => {
    mockGetPromotionRules.mockReturnValue({
      data: [rule(7, 2, 4), rule(8, 2, 3), rule(9, 2, 9)]
    });
    const user = userEvent.setup();
    renderWithProviders(<PromotionCriteriaSection fromRankId={2} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/out of date/i);
    expect(screen.getByText('→ Elite')).toBeInTheDocument();
    expect(screen.getByText('→ Donor')).toBeInTheDocument();
    // No Delete for the current rule; `enabled` switches it off.
    expect(
      screen.queryByRole('button', { name: /delete the rule to power user/i })
    ).toBeNull();

    await user.click(
      screen.getByRole('button', { name: /delete the rule to elite/i })
    );
    expect(mockDeletePromotionRule).toHaveBeenCalledWith(7);
  });

  it('shows the out-of-date list on a rank that can hold no rule', () => {
    mockGetPromotionRules.mockReturnValue({ data: [rule(5, 9, 2)] });
    renderWithProviders(<PromotionCriteriaSection fromRankId={9} />);

    expect(screen.getByText('→ Member')).toBeInTheDocument();
    expect(
      screen.getByText(/secondary classes are not on/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /save promotion criteria/i })
    ).toBeNull();
  });
});

describe('PromotionCriteriaSection — staff ranks (#425)', () => {
  it('lists a rule into a staff rank as out of date on the top rung', () => {
    mockGetPromotionRules.mockReturnValue({ data: [rule(6, 4, 8)] });
    renderWithProviders(<PromotionCriteriaSection fromRankId={4} />);

    expect(screen.getByText('→ Staff')).toBeInTheDocument();
    expect(
      screen.getByText(/no auto-managed class sits above this one/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /save promotion criteria/i })
    ).toBeNull();
  });

  it('says why a staff rank holds no rule when old rules leave it', () => {
    mockGetPromotionRules.mockReturnValue({ data: [rule(7, 8, 4)] });
    renderWithProviders(<PromotionCriteriaSection fromRankId={8} />);

    expect(screen.getByText('→ Elite')).toBeInTheDocument();
    expect(
      screen.getByText(/staff classes are assigned by hand/i)
    ).toBeInTheDocument();
  });
});

describe('PromotionCriteriaSection — api errors', () => {
  it("shows the api's msg when a save is refused", async () => {
    mockCreatePromotionRule.mockReturnValue(
      rejected({ msg: 'fromRank and toRank must both be primary ranks' })
    );
    const user = userEvent.setup();
    renderWithProviders(<PromotionCriteriaSection fromRankId={2} />);

    await user.click(
      screen.getByRole('button', { name: /save promotion criteria/i })
    );
    await waitFor(() =>
      expect(alerts()).toContainEqual(
        expect.objectContaining({
          msg: 'fromRank and toRank must both be primary ranks',
          alertType: 'danger'
        })
      )
    );
  });

  it('falls back to a generic message when the api gives none', async () => {
    mockCreatePromotionRule.mockReturnValue(rejected(undefined));
    const user = userEvent.setup();
    renderWithProviders(<PromotionCriteriaSection fromRankId={2} />);

    await user.click(
      screen.getByRole('button', { name: /save promotion criteria/i })
    );
    await waitFor(() =>
      expect(alerts()).toContainEqual(
        expect.objectContaining({ msg: 'Failed to save promotion criteria.' })
      )
    );
  });
});

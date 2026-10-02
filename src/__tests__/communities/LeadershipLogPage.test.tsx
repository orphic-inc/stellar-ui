import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../testUtils';
import LeadershipLogPage from '../../components/communities/LeadershipLogPage';

const mockLog = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunityByIdQuery: () => ({ data: { id: 3, name: 'Jazz Vault' } }),
  useGetCommunityLeadershipLogQuery: (...args: unknown[]) => mockLog(...args)
}));

const lead = { id: 1, username: 'lead' };
const heir = { id: 2, username: 'heir' };
const mod = { id: 9, username: 'mod' };

const event = (overrides: Record<string, unknown>) => ({
  id: 1,
  kind: 'founded',
  from: null,
  to: lead,
  actor: null,
  at: '2026-10-01T00:00:00.000Z',
  ...overrides
});

const logOf = (events: unknown[]) => ({
  data: {
    data: events,
    meta: { total: events.length, page: 1, limit: 25, totalPages: 1 }
  },
  isLoading: false,
  error: undefined
});

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route
        path="/communities/:communityId/leadership"
        element={<LeadershipLogPage />}
      />
    </Routes>,
    { initialEntries: ['/communities/3/leadership'] }
  );

/** The "Change" cell of each body row, top to bottom. */
const changeCells = () =>
  (screen.getAllByRole('row') as HTMLTableRowElement[])
    .slice(1)
    .map((r) => r.cells[0].textContent);

beforeEach(() => jest.clearAllMocks());

describe('LeadershipLogPage', () => {
  it("reads the community's log and titles the page with its name", () => {
    mockLog.mockReturnValue(logOf([]));
    renderPage();

    expect(mockLog).toHaveBeenCalledWith({ communityId: 3, page: 1 });
    expect(screen.getByText(/Jazz Vault: leadership history/)).toBeVisible();
    expect(screen.getByText('No leadership changes yet.')).toBeVisible();
  });

  it('says each kind of change in a sentence, linking the people', () => {
    mockLog.mockReturnValue(
      logOf([
        event({ id: 4, kind: 'cleared', from: heir, to: null }),
        event({ id: 3, kind: 'handed_off', from: lead, to: heir }),
        event({ id: 2, kind: 'assigned', from: heir, to: lead }),
        event({ id: 1, kind: 'founded', to: heir })
      ])
    );
    renderPage();

    expect(changeCells()).toEqual([
      'Staff cleared heir as leader',
      'heir took over from lead (handoff)',
      'Staff made lead leader, replacing heir',
      'heir became the first leader'
    ]);
    expect(screen.getAllByRole('link', { name: 'heir' })[0]).toHaveAttribute(
      'href',
      '/user/heir'
    );
  });

  it('says a first assignment without a "replacing"', () => {
    mockLog.mockReturnValue(logOf([event({ kind: 'assigned', to: lead })]));
    renderPage();

    expect(changeCells()).toEqual(['Staff made lead leader']);
  });

  // The api sends `actor` to staff only (ADR-0054 §5).
  it('names the staff member when the api sends one, but not on a handoff', () => {
    mockLog.mockReturnValue(
      logOf([
        event({ id: 2, kind: 'handed_off', from: lead, to: heir, actor: heir }),
        event({ id: 1, kind: 'assigned', to: lead, actor: mod })
      ])
    );
    renderPage();

    expect(changeCells()).toEqual([
      'heir took over from lead (handoff)',
      'Staff made lead leader · by mod'
    ]);
  });

  it('reads a 403 as the community page does', () => {
    mockLog.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 403 }
    });
    renderPage();

    expect(
      screen.getByText('You are not a member of this community.')
    ).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('reads a 404 as not found', () => {
    mockLog.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });
    renderPage();

    expect(screen.getByText('Community not found.')).toBeVisible();
  });

  it('links back to the community', () => {
    mockLog.mockReturnValue(logOf([]));
    renderPage();

    expect(screen.getByRole('link', { name: /community/i })).toHaveAttribute(
      'href',
      '/communities/3'
    );
  });
});

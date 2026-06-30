import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import DncPage from '../../components/staff/DncPage';

const mockUseGetDncQuery = jest.fn();
const mockCreate = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../store/services/adminApi', () => ({
  useGetDncQuery: () => mockUseGetDncQuery(),
  useCreateDncEntryMutation: () => [mockCreate, { isLoading: false }],
  useDeleteDncEntryMutation: () => [mockDelete, { isLoading: false }]
}));

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunitiesQuery: () => ({
    data: { data: [{ id: 1, name: 'Test Community' }] }
  })
}));

describe('DncPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockUseGetDncQuery.mockReturnValue({ data: [], isLoading: false });
  });

  it('renders the community selector and no table until one is chosen', () => {
    renderWithProviders(<DncPage />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(
      document.querySelector('table[data-st="grid"]')
    ).not.toBeInTheDocument();
  });

  it('reveals the add form and grid table once a community is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DncPage />);
    await user.selectOptions(screen.getByRole('combobox'), '1');
    expect(
      screen.getByRole('heading', { name: /add entry/i })
    ).toBeInTheDocument();
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(
      screen.getByText(/no dnc entries for this community/i)
    ).toBeInTheDocument();
  });

  it('creates an entry', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DncPage />);
    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.type(
      screen.getByPlaceholderText(/artist, label, or release/i),
      'Bootleg Label'
    );
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(mockCreate).toHaveBeenCalledWith({
      communityId: 1,
      name: 'Bootleg Label',
      comment: ''
    });
  });
});

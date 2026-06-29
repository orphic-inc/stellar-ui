import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Blacklist from '../../components/staff/Blacklist';
import type { Column } from '../../components/ui';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

type Entry = { id: number; value: string };

const columns: Column<Entry>[] = [{ header: 'Value', cell: (e) => e.value }];

const renderBlacklist = (
  overrides: Partial<React.ComponentProps<typeof Blacklist<Entry>>> = {}
) => {
  const onCreate = overrides.onCreate ?? jest.fn().mockResolvedValue({});
  const onDelete = overrides.onDelete ?? jest.fn().mockResolvedValue({});
  renderWithProviders(
    <Blacklist<Entry>
      title="Test Blacklist"
      noun="entry"
      emptyMessage="Nothing blacklisted."
      fields={[
        { name: 'value', label: 'Value', required: true },
        { name: 'comment', label: 'Comment' }
      ]}
      columns={columns}
      entries={[{ id: 1, value: 'alpha' }]}
      isLoading={false}
      isCreating={false}
      entryKey={(e) => e.id}
      onCreate={onCreate}
      onDelete={onDelete}
      messages={{
        created: 'Added.',
        createFailed: 'Add failed.',
        deleted: 'Removed.',
        deleteFailed: 'Remove failed.'
      }}
      {...overrides}
    />
  );
  return { onCreate, onDelete };
};

describe('Blacklist', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the title and entries on the grid table', () => {
    renderBlacklist();
    expect(
      screen.getByRole('heading', { name: 'Test Blacklist' })
    ).toBeInTheDocument();
    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
  });

  it('shows the empty message when there are no entries', () => {
    renderBlacklist({ entries: [] });
    expect(screen.getByText('Nothing blacklisted.')).toBeInTheDocument();
  });

  it('shows a spinner while loading', () => {
    renderBlacklist({ isLoading: true, entries: undefined });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('toggles the add form and submits field values to onCreate', async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn().mockResolvedValue({});
    renderBlacklist({ onCreate });

    expect(screen.queryByLabelText(/Value/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '+ Add entry' }));

    await user.type(screen.getByLabelText(/Value/), 'spam');
    await user.type(screen.getByLabelText('Comment'), 'because');
    await user.click(screen.getByRole('button', { name: 'Add entry' }));

    expect(onCreate).toHaveBeenCalledWith({
      value: 'spam',
      comment: 'because'
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          alertType: 'success',
          msg: 'Added.'
        })
      })
    );
  });

  it('dispatches a danger alert when create fails', async () => {
    const user = userEvent.setup();
    const onCreate = jest
      .fn()
      .mockRejectedValue({ data: { msg: 'Server error.' } });
    renderBlacklist({ onCreate });

    await user.click(screen.getByRole('button', { name: '+ Add entry' }));
    await user.type(screen.getByLabelText(/Value/), 'x');
    await user.click(screen.getByRole('button', { name: 'Add entry' }));

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'danger' })
      })
    );
  });

  it('calls onDelete and confirms removal', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn().mockResolvedValue({});
    renderBlacklist({ onDelete });

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onDelete).toHaveBeenCalledWith({ id: 1, value: 'alpha' });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          alertType: 'success',
          msg: 'Removed.'
        })
      })
    );
  });

  it('shows "Adding…" while a create is in flight', async () => {
    const user = userEvent.setup();
    renderBlacklist({ isCreating: true });
    await user.click(screen.getByRole('button', { name: '+ Add entry' }));
    expect(screen.getByRole('button', { name: 'Adding…' })).toBeInTheDocument();
  });
});

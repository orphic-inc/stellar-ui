import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import { Modal } from '../../components/ui';

describe('Modal primitive — data-st contract + behaviour', () => {
  it('renders a dialog with the panel + colhead Roles and an accessible name', () => {
    renderWithProviders(
      <Modal title="Edit thing" onClose={() => {}}>
        <p>body</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('data-st', 'panel');
    // Title bar is a content-title colhead, wired to the dialog via labelledby.
    expect(dialog).toHaveAccessibleName('Edit thing');
    expect(
      dialog.querySelector('[data-st="colhead"][data-st-title]')
    ).toBeInTheDocument();
  });

  it('closes on the header ✕, Esc, and a backdrop click', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <Modal title="T" onClose={onClose}>
        <p>body</p>
      </Modal>
    );

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    // The backdrop is the dialog's grandparent (portal → backdrop → dialog).
    const backdrop = screen.getByRole('dialog').parentElement!;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('does not close on Esc or backdrop when dismissable is false', () => {
    const onClose = jest.fn();
    renderWithProviders(
      <Modal title="T" onClose={onClose} dismissable={false}>
        <p>body</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    const backdrop = screen.getByRole('dialog').parentElement!;
    fireEvent.mouseDown(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders headerActions alongside the close button', () => {
    renderWithProviders(
      <Modal
        title="T"
        onClose={() => {}}
        headerActions={<button>Rollback</button>}
      >
        <p>body</p>
      </Modal>
    );
    expect(
      screen.getByRole('button', { name: 'Rollback' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('locks body scroll while open and restores it on unmount', () => {
    const { unmount } = renderWithProviders(
      <Modal title="T" onClose={() => {}}>
        <p>body</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});

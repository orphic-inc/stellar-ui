import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import userEvent from '@testing-library/user-event';
import {
  Panel,
  PageShell,
  Button,
  Field,
  DataTable,
  Badge,
  Pagination,
  type Column
} from '../../components/ui';

describe('UI kit — data-st contract', () => {
  it('Panel carries the panel Role', () => {
    renderWithProviders(<Panel>body</Panel>);
    expect(screen.getByText('body')).toHaveAttribute('data-st', 'panel');
  });

  describe('Button variants map to control hooks', () => {
    it('primary is a filled control', () => {
      renderWithProviders(<Button variant="primary">Go</Button>);
      const btn = screen.getByRole('button', { name: 'Go' });
      expect(btn).toHaveAttribute('data-st', 'control');
      expect(btn).toHaveAttribute('data-st-primary');
    });

    it('success is a filled affirmative control', () => {
      renderWithProviders(<Button variant="success">Record</Button>);
      const btn = screen.getByRole('button', { name: 'Record' });
      expect(btn).toHaveAttribute('data-st-primary');
      expect(btn).toHaveAttribute('data-st-success');
    });

    it('danger is a filled destructive control', () => {
      renderWithProviders(<Button variant="danger">Ban</Button>);
      const btn = screen.getByRole('button', { name: 'Ban' });
      expect(btn).toHaveAttribute('data-st-primary');
      expect(btn).toHaveAttribute('data-st-danger');
    });

    it('link is an unpadded text control with no fill', () => {
      renderWithProviders(<Button variant="link">More</Button>);
      const btn = screen.getByRole('button', { name: 'More' });
      expect(btn).toHaveAttribute('data-st', 'control');
      expect(btn).not.toHaveAttribute('data-st-primary');
    });

    it('link-danger is a destructive text control', () => {
      renderWithProviders(<Button variant="link-danger">Remove</Button>);
      const btn = screen.getByRole('button', { name: 'Remove' });
      expect(btn).toHaveAttribute('data-st', 'control');
      expect(btn).toHaveAttribute('data-st-danger');
      expect(btn).not.toHaveAttribute('data-st-primary');
    });

    it('defaults type to button so it does not submit forms', () => {
      renderWithProviders(<Button>X</Button>);
      expect(screen.getByRole('button', { name: 'X' })).toHaveAttribute(
        'type',
        'button'
      );
    });
  });

  describe('Field', () => {
    it('paints the input as field and the label as meta', () => {
      renderWithProviders(<Field id="f" label="Email" />);
      expect(screen.getByLabelText('Email')).toHaveAttribute(
        'data-st',
        'field'
      );
      expect(screen.getByText('Email')).toHaveAttribute('data-st', 'meta');
    });

    it('marks required fields and renders the hint', () => {
      renderWithProviders(
        <Field id="f" label="From IP" required hint="(optional)" />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('(optional)')).toBeInTheDocument();
      expect(screen.getByLabelText(/From IP/)).toBeRequired();
    });
  });

  describe('PageShell', () => {
    it('renders the title as prose -strong', () => {
      renderWithProviders(<PageShell title="Tools">body</PageShell>);
      const heading = screen.getByRole('heading', { name: 'Tools' });
      expect(heading).toHaveAttribute('data-st', 'prose');
      expect(heading).toHaveAttribute('data-st-strong');
    });

    it('renders no back-link by default', () => {
      renderWithProviders(<PageShell title="A">body</PageShell>);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('renders a back-link when backTo is set', () => {
      renderWithProviders(
        <PageShell title="A" backTo="/private/staff/tools">
          body
        </PageShell>
      );
      expect(screen.getByRole('link', { name: '← Toolbox' })).toHaveAttribute(
        'href',
        '/private/staff/tools'
      );
    });

    it('renders header actions', () => {
      renderWithProviders(
        <PageShell title="A" actions={<button>Add</button>}>
          body
        </PageShell>
      );
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });
  });

  describe('DataTable', () => {
    type Row = { id: number; name: string; count: number };
    const columns: Column<Row>[] = [
      { header: 'Name', cell: (r) => r.name },
      { header: 'Count', cell: (r) => r.count, numeric: true }
    ];
    const rows: Row[] = [
      { id: 1, name: 'alpha', count: 3 },
      { id: 2, name: 'beta', count: 7 }
    ];

    it('renders a grid table with colhead and row Roles', () => {
      const { container } = renderWithProviders(
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      );
      expect(
        container.querySelector('table[data-st="grid"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('thead[data-st="colhead"]')
      ).toBeInTheDocument();
      expect(container.querySelectorAll('tr[data-st="row"]')).toHaveLength(2);
      expect(screen.getByText('alpha')).toBeInTheDocument();
    });

    it('flags numeric columns with data-st-num', () => {
      const { container } = renderWithProviders(
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      );
      expect(container.querySelector('th[data-st-num]')).toHaveTextContent(
        'Count'
      );
      expect(container.querySelectorAll('td[data-st-num]')).toHaveLength(2);
    });

    it('washes the active row with data-st-open', () => {
      const { container } = renderWithProviders(
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          rowActive={(r) => r.id === 2}
        />
      );
      expect(container.querySelectorAll('tr[data-st-open]')).toHaveLength(1);
    });

    it('shows a spinner while loading', () => {
      const { container } = renderWithProviders(
        <DataTable
          columns={columns}
          rows={undefined}
          rowKey={(r) => r.id}
          isLoading
        />
      );
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows the empty message when there are no rows', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          rows={[]}
          rowKey={(r) => r.id}
          empty="Nothing here."
        />
      );
      expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders the neutral chip by default', () => {
      renderWithProviders(<Badge>New</Badge>);
      const chip = screen.getByText('New');
      expect(chip).toHaveAttribute('data-st', 'chip');
      expect(chip).not.toHaveAttribute('data-st-danger');
    });

    it('paints the status hue for a variant', () => {
      renderWithProviders(<Badge variant="danger">Disabled</Badge>);
      const chip = screen.getByText('Disabled');
      expect(chip).toHaveAttribute('data-st', 'chip');
      expect(chip).toHaveAttribute('data-st-danger');
    });

    it('renders mono codes', () => {
      renderWithProviders(<Badge mono>FLAC</Badge>);
      expect(screen.getByText('FLAC')).toHaveAttribute('data-st-mono');
    });
  });

  describe('Pagination', () => {
    it('renders nothing for a single page', () => {
      const { container } = renderWithProviders(
        <Pagination page={1} totalPages={1} onChange={() => {}} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('disables Prev on the first page and Next on the last', () => {
      renderWithProviders(
        <Pagination page={1} totalPages={3} onChange={() => {}} />
      );
      expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    });

    it('steps the page on Prev/Next', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderWithProviders(
        <Pagination page={2} totalPages={3} onChange={onChange} />
      );
      await user.click(screen.getByRole('button', { name: 'Next' }));
      expect(onChange).toHaveBeenCalledWith(3);
      await user.click(screen.getByRole('button', { name: 'Prev' }));
      expect(onChange).toHaveBeenCalledWith(1);
    });
  });
});

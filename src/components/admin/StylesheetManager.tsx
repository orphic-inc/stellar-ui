import { useDispatch } from 'react-redux';
import {
  useGetStylesheetsQuery,
  useGetStylesheetStatsQuery,
  useUpdateStylesheetMutation
} from '../../store/services/siteApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import { PageShell, Button, Badge, DataTable, type Column } from '../ui';

type StylesheetRow = NonNullable<
  ReturnType<typeof useGetStylesheetsQuery>['data']
>[number];

const StylesheetManager = () => {
  const dispatch = useDispatch();
  const { data: stylesheets, isLoading: listLoading } =
    useGetStylesheetsQuery();
  const { data: stats, isLoading: statsLoading } = useGetStylesheetStatsQuery();
  const [updateStylesheet, { isLoading: isSaving }] =
    useUpdateStylesheetMutation();

  const userCountById = Object.fromEntries(
    (stats ?? []).map((s) => [s.id, s.userCount])
  );

  const handleSetDefault = async (id: number, name: string) => {
    try {
      await updateStylesheet({ id, isDefault: true }).unwrap();
      dispatch(addAlert(`"${name}" is now the default stylesheet.`, 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to update default.',
          'danger'
        )
      );
    }
  };

  const columns: Column<StylesheetRow>[] = [
    {
      header: 'Name',
      cell: (s) => <span className="font-medium">{s.name}</span>
    },
    { header: 'Description', cell: (s) => s.description || '—' },
    {
      header: 'CSS URL',
      tdClassName: 'break-all',
      cell: (s) => (
        <span className="font-mono text-xs text-[var(--st-text-muted)]">
          {s.cssUrl}
        </span>
      )
    },
    {
      header: 'Users',
      numeric: true,
      cell: (s) => userCountById[s.id] ?? 0
    },
    {
      header: 'Status',
      thClassName: 'text-center',
      tdClassName: 'text-center',
      cell: (s) => (s.isDefault ? <Badge variant="info">Default</Badge> : null)
    },
    {
      header: '',
      tdClassName: 'text-right',
      cell: (s) =>
        s.isDefault ? null : (
          <Button
            variant="link"
            disabled={isSaving}
            onClick={() => handleSetDefault(s.id, s.name)}
          >
            Set default
          </Button>
        )
    }
  ];

  if (listLoading || statsLoading) return <Spinner />;

  return (
    <PageShell title="Stylesheets" width="lg">
      <DataTable
        columns={columns}
        rows={stylesheets}
        rowKey={(s) => s.id}
        empty="No stylesheets found."
      />
      <p data-st="meta" className="text-xs">
        User counts reflect stored stylesheet selections and may differ from
        active rendering when an external stylesheet URL is set.
      </p>
    </PageShell>
  );
};

export default StylesheetManager;

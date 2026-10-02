import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import {
  useDeleteAuthorStylesheetMutation,
  useListAuthorStylesheetsQuery,
  type AuthorStylesheetListItem
} from '../../store/services/stylesheetApi';
import { getApiErrorMessage } from '../../utils/apiError';
import Time from '../layout/Time';
import { Button, DataTable, PageShell, Pagination, type Column } from '../ui';
import { describeQuota, type StylesheetQuota } from './stylesheetQuota';

/** Deleting frees the space but is not a retraction (ADR-0032 §3). */
const useDeleteSheet = () => {
  const dispatch = useAppDispatch();
  const [deleteSheet] = useDeleteAuthorStylesheetMutation();
  return async (sheet: AuthorStylesheetListItem) => {
    const ask = `Delete ${sheet.name}? This frees a space. Members who adopted it keep it until they switch away.`;
    if (!confirm(ask)) return;
    try {
      await deleteSheet(sheet.id).unwrap();
      dispatch(addAlert('Stylesheet deleted.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to delete stylesheet.',
          'danger'
        )
      );
    }
  };
};

const sheetColumns = (
  onDelete: (sheet: AuthorStylesheetListItem) => void
): Column<AuthorStylesheetListItem>[] => [
  {
    header: 'Name',
    cell: (sheet) => (
      // Its page is the link a member shares (#451).
      <Link to={`/stylesheets/${sheet.id}`} data-st="control">
        {sheet.name}
      </Link>
    )
  },
  { header: 'Updated', cell: (sheet) => <Time date={sheet.updatedAt} /> },
  {
    header: '',
    cell: (sheet) => (
      <span className="flex gap-3">
        <Link to={`/stylesheets/${sheet.id}/edit`} data-st="control">
          Edit
        </Link>
        <Button variant="link-danger" onClick={() => onDelete(sheet)}>
          Delete
        </Button>
      </span>
    )
  }
];

/** The member's own sheets, a page at a time, and the space they use. */
const useMySheets = (page: number) => {
  const user = useAppSelector(selectCurrentUser);
  const userId = user ? user.id : 0;
  const { data, isLoading } = useListAuthorStylesheetsQuery(
    { userId, page },
    { skip: !user }
  );
  const limit = user ? user.userRank.authorStylesheetLimit : null;
  const quota = describeQuota(data ? data.meta.total : 0, limit ?? null);
  return { userId, data, isLoading, quota };
};

const QuotaNote = ({ quota }: { quota: StylesheetQuota }) => (
  <>
    {quota.line && <p data-st="meta">{quota.line}</p>}
    {quota.blocked && <p data-st="meta">{quota.blocked}</p>}
  </>
);

const MyStylesheetsPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { userId, data, isLoading, quota } = useMySheets(page);
  const onDelete = useDeleteSheet();

  return (
    <PageShell
      title="My stylesheets"
      backTo={`/user/edit/${userId}`}
      backLabel="← Settings"
      actions={
        <Button
          disabled={quota.blocked !== null}
          onClick={() => navigate('/stylesheets/new')}
        >
          New stylesheet
        </Button>
      }
    >
      <QuotaNote quota={quota} />
      <DataTable
        columns={sheetColumns(onDelete)}
        rows={data?.data}
        rowKey={(sheet) => sheet.id}
        isLoading={isLoading}
        empty="You haven't written a stylesheet yet."
      />
      <Pagination
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default MyStylesheetsPage;

import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import { useGetMyProfileQuery } from '../../store/services/profileApi';
import {
  useAdoptAuthorStylesheetMutation,
  useGetAuthorStylesheetQuery,
  type AuthorStylesheet
} from '../../store/services/stylesheetApi';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import { Button, PageShell } from '../ui';

/**
 * Adopt puts the sheet in the member's Site Stylesheet slot. There's no
 * preview: undoing is one click in Settings, and `?notheme=1` (#449) covers a
 * sheet that hides that control. `scored` is not shown (#108 grill).
 */
const AdoptButton = ({ sheet }: { sheet: AuthorStylesheet }) => {
  const dispatch = useAppDispatch();
  const { data: profile } = useGetMyProfileQuery();
  const [adopt, { isLoading }] = useAdoptAuthorStylesheetMutation();
  const inUse = profile?.userSettings?.activeAuthorStylesheetId === sheet.id;

  const onAdopt = async () => {
    try {
      await adopt(sheet.id).unwrap();
      dispatch(
        addAlert(`Adopted — your site now uses ${sheet.name}.`, 'success')
      );
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to adopt.', 'danger')
      );
    }
  };

  return (
    <Button disabled={inUse || isLoading} onClick={onAdopt}>
      {inUse ? 'In use' : 'Adopt'}
    </Button>
  );
};

const SheetDetail = ({ sheet }: { sheet: AuthorStylesheet }) => {
  const user = useAppSelector(selectCurrentUser);
  return (
    <PageShell
      title={sheet.name}
      backTo={null}
      actions={<AdoptButton sheet={sheet} />}
    >
      <p data-st="meta" className="flex gap-4 text-sm">
        <Link to={`/user/${sheet.authorId}`} data-st="control">
          Author&apos;s profile →
        </Link>
        {sheet.authorId === user?.id && (
          <Link to={`/stylesheets/${sheet.id}/edit`} data-st="control">
            Edit
          </Link>
        )}
      </p>
      <pre
        aria-label="CSS"
        data-st="field"
        className="w-full overflow-auto whitespace-pre-wrap font-mono text-xs"
      >
        {sheet.source}
      </pre>
    </PageShell>
  );
};

/** A sheet's page: the link a member shares (ADR-0032; no gallery). */
const StylesheetPage = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useGetAuthorStylesheetQuery(Number(id));
  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <PageShell title="Stylesheet" backTo={null}>
        <p data-st="meta">This stylesheet isn&apos;t available.</p>
      </PageShell>
    );
  }
  return <SheetDetail sheet={data} />;
};

export default StylesheetPage;

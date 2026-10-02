import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import {
  useCreateAuthorStylesheetMutation,
  useGetAuthorStylesheetQuery,
  useUpdateAuthorStylesheetMutation,
  type AuthorStylesheetBody
} from '../../store/services/stylesheetApi';
import { getFieldErrors, getMsgError } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import { Button, Field, PageShell } from '../ui';

const SOURCE_MAX = 100_000;

type Refusal = { msg?: string; name?: string[]; source?: string[] };

/** Every violation the api found, unmerged (ADR-0032 §6). */
const ErrorList = ({ id, errors }: { id: string; errors?: string[] }) =>
  errors?.length ? (
    <ul id={id} role="alert" className="text-xs text-[var(--st-danger)]">
      {errors.map((e, i) => (
        <li key={i}>{e}</li>
      ))}
    </ul>
  ) : null;

/** A `.css` file is read into the field; nothing is uploaded (ADR-0032 §5). */
const readCssFile = (file: File, onLoad: (text: string) => void) => {
  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result ?? ''));
  reader.readAsText(file);
};

const SourceField = ({
  value,
  onChange,
  errors
}: {
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
}) => (
  <div className="space-y-1">
    <label htmlFor="sheet-source" data-st="meta" className="block text-xs">
      CSS
    </label>
    <textarea
      id="sheet-source"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      maxLength={SOURCE_MAX}
      rows={20}
      spellCheck={false}
      aria-describedby={errors?.length ? 'sheet-source-errors' : undefined}
      data-st="field"
      className="w-full font-mono text-xs"
    />
    <div className="flex items-center justify-between gap-3 text-xs">
      <label data-st="meta">
        Load a .css file{' '}
        <input
          type="file"
          accept=".css,text/css"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readCssFile(file, onChange);
          }}
        />
      </label>
      <span data-st="meta">
        {value.length.toLocaleString('en-US')} /{' '}
        {SOURCE_MAX.toLocaleString('en-US')}
      </span>
    </div>
    <ErrorList id="sheet-source-errors" errors={errors} />
  </div>
);

const useSaveSheet = (id: number | null) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [create, { isLoading: creating }] = useCreateAuthorStylesheetMutation();
  const [update, { isLoading: updating }] = useUpdateAuthorStylesheetMutation();
  const [refusal, setRefusal] = useState<Refusal>({});

  const save = async (body: AuthorStylesheetBody) => {
    setRefusal({});
    try {
      await (id === null ? create(body) : update({ id, ...body })).unwrap();
      dispatch(addAlert('Stylesheet saved.', 'success'));
      navigate('/stylesheets');
    } catch (err) {
      const fields = getFieldErrors(err);
      setRefusal({
        name: fields?.name,
        source: fields?.source,
        msg: fields ? undefined : (getMsgError(err) ?? 'Failed to save.')
      });
    }
  };
  return { save, refusal, saving: creating || updating };
};

const EditorForm = ({
  id,
  initial
}: {
  id: number | null;
  initial: AuthorStylesheetBody;
}) => {
  const [name, setName] = useState(initial.name);
  const [source, setSource] = useState(initial.source);
  const { save, refusal, saving } = useSaveSheet(id);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save({ name, source });
      }}
    >
      {refusal.msg && (
        <p role="alert" className="text-sm text-[var(--st-danger)]">
          {refusal.msg}
        </p>
      )}
      <Field
        id="sheet-name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={100}
      />
      <ErrorList id="sheet-name-errors" errors={refusal.name} />
      <SourceField
        value={source}
        onChange={setSource}
        errors={refusal.source}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save stylesheet'}
        </Button>
        {id !== null && (
          <p data-st="meta" className="text-xs">
            Saving updates this sheet for everyone who has adopted it.
          </p>
        )}
      </div>
    </form>
  );
};

/** Edit loads the sheet's source first; only its author may edit it. */
const EditExisting = ({ id }: { id: number }) => {
  const user = useAppSelector(selectCurrentUser);
  const { data, isLoading, isError } = useGetAuthorStylesheetQuery(id);
  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return <p data-st="meta">This stylesheet isn&apos;t available.</p>;
  }
  if (data.authorId !== user?.id) {
    return <p data-st="meta">You can only edit your own stylesheets.</p>;
  }
  return <EditorForm id={id} initial={data} />;
};

const StylesheetEditorPage = () => {
  const { id } = useParams();
  const editing = id !== undefined;
  return (
    <PageShell
      title={editing ? 'Edit stylesheet' : 'New stylesheet'}
      backTo="/stylesheets"
      backLabel="← My stylesheets"
    >
      {editing ? (
        <EditExisting id={Number(id)} />
      ) : (
        <EditorForm id={null} initial={{ name: '', source: '' }} />
      )}
    </PageShell>
  );
};

export default StylesheetEditorPage;

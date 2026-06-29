import { useState, type Key, type ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { PageShell, Panel, Button, Field, DataTable, type Column } from '../ui';

type BlacklistField = {
  name: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  type?: string;
  placeholder?: string;
};

type BlacklistMessages = {
  created: string;
  createFailed: string;
  deleted: string;
  deleteFailed: string;
};

type BlacklistProps<E> = {
  title: ReactNode;
  /** Noun for the add affordances: "+ Add {noun}" / "Add {noun}" / "Adding…". */
  noun: string;
  fields: BlacklistField[];
  columns: Column<E>[];
  entries: E[] | undefined;
  isLoading: boolean;
  emptyMessage: ReactNode;
  entryKey: (entry: E) => Key;
  /** Page maps the raw field values to its own create payload + `.unwrap()`. */
  onCreate: (values: Record<string, string>) => Promise<unknown>;
  isCreating: boolean;
  onDelete: (entry: E) => Promise<unknown>;
  messages: BlacklistMessages;
};

/**
 * A blacklist manager — a collapsible add-form over a list of entries, each with
 * a Remove action. The IP-ban and email-blacklist pages were structural twins
 * (same form-toggle + list panel, differing only in field names and copy), so
 * they collapse to this one component plus a thin per-page config.
 */
function Blacklist<E>({
  title,
  noun,
  fields,
  columns,
  entries,
  isLoading,
  emptyMessage,
  entryKey,
  onCreate,
  isCreating,
  onDelete,
  messages
}: BlacklistProps<E>) {
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const value = (name: string) => values[name] ?? '';
  const setValue = (name: string, v: string) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate(values);
      dispatch(addAlert(messages.created, 'success'));
      setValues({});
      setShowForm(false);
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? messages.createFailed, 'danger')
      );
    }
  };

  const handleDelete = async (entry: E) => {
    try {
      await onDelete(entry);
      dispatch(addAlert(messages.deleted, 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? messages.deleteFailed, 'danger')
      );
    }
  };

  const tableColumns: Column<E>[] = [
    ...columns,
    {
      header: '',
      tdClassName: 'text-right',
      cell: (entry) => (
        <Button variant="link-danger" onClick={() => handleDelete(entry)}>
          Remove
        </Button>
      )
    }
  ];

  return (
    <PageShell
      title={title}
      actions={
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : `+ Add ${noun}`}
        </Button>
      }
    >
      {showForm && (
        <Panel as="form" onSubmit={handleCreate} className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <Field
                key={field.name}
                id={`bl-${field.name}`}
                label={field.label}
                hint={field.hint}
                required={field.required}
                type={field.type ?? 'text'}
                placeholder={field.placeholder}
                value={value(field.name)}
                onChange={(e) => setValue(field.name, e.target.value)}
              />
            ))}
          </div>
          <Button type="submit" variant="danger" disabled={isCreating}>
            {isCreating ? 'Adding…' : `Add ${noun}`}
          </Button>
        </Panel>
      )}

      <DataTable
        columns={tableColumns}
        rows={entries}
        rowKey={entryKey}
        isLoading={isLoading}
        empty={emptyMessage}
      />
    </PageShell>
  );
}

export default Blacklist;

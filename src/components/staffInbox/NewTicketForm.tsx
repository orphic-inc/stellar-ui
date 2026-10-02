import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateTicketMutation } from '../../store/services/staffInboxApi';
import { useGetRulesTreeQuery } from '../../store/services/rulesApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';
import { TICKET_TEMPLATES, type TicketTemplate } from './ticketTemplates';

const SUBJECT_MAX = 255;

/** Puts the cursor just after the template's `cursorAfter` text, once. */
const useTemplateCursor = (template?: TicketTemplate) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const area = ref.current;
    if (!template || !area) return;
    const at = area.value.indexOf(template.cursorAfter);
    if (at < 0) return;
    const end = at + template.cursorAfter.length;
    area.focus();
    area.setSelectionRange(end, end);
  }, [template]);
  return ref;
};

const SubjectField = ({
  template,
  value,
  onChange,
  maxLength
}: {
  template?: TicketTemplate;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}) => (
  <div>
    <label
      htmlFor="ticket-subject"
      data-st="meta"
      className="block text-sm mb-1"
    >
      Subject
    </label>
    <div className="flex items-center gap-2">
      {template && (
        <span data-st="meta" className="text-sm whitespace-nowrap">
          {template.subjectPrefix}
        </span>
      )}
      <input
        id="ticket-subject"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        maxLength={maxLength}
        data-st="field"
        className="w-full px-3 py-2 text-sm"
        placeholder={
          template?.subjectPlaceholder ?? 'Brief description of your issue'
        }
      />
    </div>
  </div>
);

const BodyField = ({
  value,
  onChange,
  bodyRef
}: {
  value: string;
  onChange: (value: string) => void;
  bodyRef: React.RefObject<HTMLTextAreaElement | null>;
}) => (
  <div>
    <label htmlFor="ticket-body" data-st="meta" className="block text-sm mb-1">
      Message
    </label>
    <textarea
      id="ticket-body"
      ref={bodyRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      rows={8}
      data-st="field"
      className="w-full px-3 py-2 text-sm resize-y"
      placeholder="Describe your issue in detail…"
    />
  </div>
);

const FormActions = ({ isLoading }: { isLoading: boolean }) => {
  const navigate = useNavigate();
  return (
    <div className="flex gap-3">
      <button
        type="submit"
        disabled={isLoading}
        data-st="control"
        data-st-primary
        className="text-sm"
      >
        {isLoading ? 'Submitting…' : 'Submit Ticket'}
      </button>
      <button
        type="button"
        onClick={() => navigate('/inbox/staff')}
        data-st="control"
        className="px-4 py-2 rounded border border-[var(--st-border)] text-sm"
      >
        Cancel
      </button>
    </div>
  );
};

const TicketFields = ({
  template,
  initialBody
}: {
  template?: TicketTemplate;
  initialBody: string;
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState(initialBody);
  const [createTicket, { isLoading }] = useCreateTicketMutation();
  const bodyRef = useTemplateCursor(template);
  // The prefix and its separating space count against the api's limit.
  const prefix = template ? `${template.subjectPrefix} ` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ticket = await createTicket({
        subject: prefix + subject,
        body
      }).unwrap();
      navigate(`/inbox/staff/${ticket.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { msg?: string } })?.data?.msg ??
        'Failed to create ticket.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SubjectField
        template={template}
        value={subject}
        onChange={setSubject}
        maxLength={SUBJECT_MAX - prefix.length}
      />
      <BodyField value={body} onChange={setBody} bodyRef={bodyRef} />
      <FormActions isLoading={isLoading} />
    </form>
  );
};

/**
 * The body a template starts with. It names the site, so it waits for the
 * rules tree's `site_name` (the one place the ui reads it) and falls back to
 * no name when that read fails. `undefined` means "not ready yet".
 */
const useTemplateBody = (template?: TicketTemplate): string | undefined => {
  const user = useAppSelector(selectCurrentUser);
  const { data, isLoading } = useGetRulesTreeQuery(undefined, {
    skip: !template
  });
  if (!template) return '';
  if (isLoading) return undefined;
  const siteName = data ? data.variables.site_name : undefined;
  return template.body(siteName || null, user ? user.username : '');
};

const NewTicketForm = () => {
  const [searchParams] = useSearchParams();
  const name = searchParams.get('template');
  // An unknown name opens the blank form (#100).
  const template = name ? TICKET_TEMPLATES[name] : undefined;
  const initialBody = useTemplateBody(template);

  return (
    <div className="thin">
      <h2 data-st="prose" data-st-strong className="text-xl mb-4">
        Contact Staff
      </h2>
      {initialBody === undefined ? (
        <Spinner />
      ) : (
        <TicketFields template={template} initialBody={initialBody} />
      )}
    </div>
  );
};

export default NewTicketForm;

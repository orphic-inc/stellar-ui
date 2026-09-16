import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  useCreateInviteMutation,
  useGetInviteEligibilityQuery,
  type InviteEligibility
} from '../../../store/services/profileApi';
import { addAlert } from '../../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../../utils/apiError';
import Spinner from '../../layout/Spinner';
import InviteTree from './InviteTree';
import InviteRules from './InviteRules';
import PendingInvites from './PendingInvites';

// A site path the api names at the end of a refusal (`…Staff PM: /inbox/staff`).
// The words are the api's; only the link is ours, so the two cannot drift.
const TRAILING_PATH = /(\/[a-z0-9/-]+)\s*$/i;

/**
 * A refusal in the api's own words (#331: the ui writes no refusal copy), with
 * a trailing site path rendered as the link it names.
 */
const InviteRefusal = ({ msg }: { msg: string }) => {
  const match = msg.match(TRAILING_PATH);
  return (
    <div className="box pad" data-st="panel">
      <p data-st="prose">
        {match ? msg.slice(0, match.index) : msg}
        {match && (
          <Link to={match[1]} data-st="control">
            {match[1]}
          </Link>
        )}
      </p>
    </div>
  );
};

const SendInviteForm = () => {
  const dispatch = useDispatch();
  const [createInvite, { isLoading }] = useCreateInviteMutation();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createInvite({
        email,
        reason: reason || undefined
      }).unwrap();
      if (result.emailSent) {
        dispatch(addAlert('Invitation sent successfully.', 'success'));
      } else {
        dispatch(
          addAlert(
            'Invite created, but email delivery is not configured on this server.',
            'warning'
          )
        );
      }
      setEmail('');
      setReason('');
    } catch (err) {
      // Still the authority on a refusal: eligibility is advisory and may be a
      // race or a stale page, and only the send knows the address is taken.
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to send invite. Please try again.',
          'danger'
        )
      );
    }
  };

  return (
    <div className="box" data-st="panel">
      <form className="send_form pad" onSubmit={handleSubmit}>
        <div className="field_div">
          <div className="label" data-st="meta">
            Email address:
          </div>
          <div className="input">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size={60}
              required
              data-st="field"
            />
            <input
              type="submit"
              value="Invite"
              disabled={isLoading}
              data-st="control"
              data-st-primary
            />
          </div>
        </div>
        <div className="field_div">
          <div className="label" data-st="meta">
            Staff note:
          </div>
          <div className="input">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              size={60}
              maxLength={255}
              data-st="field"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

/**
 * The send section. The gate is advisory — the POST enforces it and answers the
 * same words — so a failed eligibility read renders the form (fail open) rather
 * than refusing a member the api would have accepted.
 */
const SendSection = ({
  eligibility,
  isLoading
}: {
  eligibility?: InviteEligibility;
  isLoading: boolean;
}) => {
  if (isLoading) return <Spinner />;
  if (eligibility && !eligibility.canSend && eligibility.msg) {
    return <InviteRefusal msg={eligibility.msg} />;
  }
  return (
    <>
      {eligibility?.unlimited && (
        <p data-st="prose" data-st-muted className="text-sm mt-3">
          Invites: unlimited
        </p>
      )}
      <SendInviteForm />
    </>
  );
};

const InviteForm = () => {
  const user = useSelector(selectCurrentUser);
  const { data: eligibility, isLoading } = useGetInviteEligibilityQuery();

  return (
    <div className="thin">
      <div className="header">
        <h2 data-st="prose" data-st-strong>
          <Link to={`/user/${user?.username}`} data-st="control">
            {user?.username}
          </Link>
          {' › '}
          Invites
        </h2>
      </div>

      <InviteRules />
      <SendSection eligibility={eligibility} isLoading={isLoading} />
      <PendingInvites />
      <InviteTree embedded />
    </div>
  );
};

export default InviteForm;

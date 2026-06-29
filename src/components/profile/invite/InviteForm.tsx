import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { useCreateInviteMutation } from '../../../store/services/profileApi';
import { addAlert } from '../../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../../utils/apiError';
import InviteTree from './InviteTree';

const InviteForm = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
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
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to send invite. Please try again.',
          'danger'
        )
      );
    }
  };

  return (
    <div className="thin">
      <div className="header">
        <h2 data-st="prose" data-st-strong>
          <Link to={`/private/user/${user?.username}`} data-st="control">
            {user?.username}
          </Link>
          {' › '}
          Invites
        </h2>
      </div>
      <InviteTree embedded />

      <div className="box pad" data-st="panel">
        <p data-st="prose">
          Selling, trading, or publicly giving away invitations is strictly
          forbidden and may result in you and your entire invite tree being
          banned.
        </p>
        <p data-st="prose">
          Only invite people you know and trust. You are responsible for ALL
          invitees.
        </p>
      </div>

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
    </div>
  );
};

export default InviteForm;

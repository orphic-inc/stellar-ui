import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { useCreateInviteMutation } from '../../../store/services/profileApi';
import { addAlert } from '../../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../../utils/apiError';

const InviteForm = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [createInvite, { isLoading }] = useCreateInviteMutation();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvite({ email, reason: reason || undefined }).unwrap();
      dispatch(addAlert('Invitation sent successfully.', 'success'));
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
        <h2>
          <Link to={`/private/user/${user?.id}`}>{user?.username}</Link>
          {' › '}
          Invites
        </h2>
      </div>
      <div className="linkbox">
        <Link to="/private/user/invite-tree" className="brackets">
          Invite tree
        </Link>
      </div>

      <div className="box pad">
        <p>
          Selling, trading, or publicly giving away invitations is strictly
          forbidden and may result in you and your entire invite tree being
          banned.
        </p>
        <p>
          Only invite people you know and trust. You are responsible for ALL
          invitees.
        </p>
      </div>

      <div className="box">
        <form className="send_form pad" onSubmit={handleSubmit}>
          <div className="field_div">
            <div className="label">Email address:</div>
            <div className="input">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size={60}
                required
              />
              <input type="submit" value="Invite" disabled={isLoading} />
            </div>
          </div>
          <div className="field_div">
            <div className="label">Staff note:</div>
            <div className="input">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                size={60}
                maxLength={255}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteForm;

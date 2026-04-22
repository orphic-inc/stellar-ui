import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';

const InviteForm = () => {
  const user = useSelector(selectCurrentUser);
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/profile/referral/create-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          reason,
          userId: user?.id,
          userName: user?.username
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to send invite.');
      }
      setSuccess('Invitation sent successfully.');
      setEmail('');
      setReason('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
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
              <input type="submit" value="Invite" />
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
          {success && <div className="success">{success}</div>}
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default InviteForm;

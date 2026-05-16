import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useRequestRecoveryMutation,
  useResetPasswordMutation
} from '../../store/services/authApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';

const Recovery = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Step 1: request recovery
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [requestRecovery, { isLoading: isRequesting }] =
    useRequestRecoveryMutation();

  // Step 2: reset password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPassword, { isLoading: isResetting }] =
    useResetPasswordMutation();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestRecovery({ email }).unwrap();
      setSubmitted(true);
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to send recovery email.',
          'danger'
        )
      );
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      dispatch(addAlert('Passwords do not match.', 'danger'));
      return;
    }
    try {
      await resetPassword({ token: token!, newPassword }).unwrap();
      dispatch(
        addAlert('Password reset successfully. Please log in.', 'success')
      );
      navigate('/login');
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to reset password.',
          'danger'
        )
      );
    }
  };

  // Step 2: token present — show reset form
  if (token) {
    return (
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent mb-2">
            Stellar
          </h1>
          <p className="text-gray-400 text-sm">Set a new password</p>
        </div>

        <form
          onSubmit={handleReset}
          className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="recovery-new-password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              New password
            </label>
            <input
              id="recovery-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              placeholder="••••••••"
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="recovery-confirm-password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Confirm new password
            </label>
            <input
              id="recovery-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              placeholder="••••••••"
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={isResetting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            {isResetting ? 'Resetting…' : 'Reset Password'}
          </button>

          <div className="text-center text-sm text-gray-500">
            <Link to="/login" className="hover:text-gray-300 transition-colors">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    );
  }

  // Step 1: email form
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent mb-2">
          Stellar
        </h1>
        <p className="text-gray-400 text-sm">Account Recovery</p>
      </div>

      {submitted ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center space-y-4">
          <div className="text-green-400 text-sm">
            If an account exists for that email, you will receive a recovery
            link shortly.
          </div>
          <Link
            to="/login"
            className="block text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleRequest}
          className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="recovery-email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email address
            </label>
            <input
              id="recovery-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={isRequesting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            {isRequesting ? 'Sending…' : 'Send Recovery Email'}
          </button>

          <div className="text-center text-sm text-gray-500">
            <Link to="/login" className="hover:text-gray-300 transition-colors">
              Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default Recovery;

import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../../store/services/authApi';
import { useGetInstallStatusQuery } from '../../store/services/installApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import type { components } from '../../types/api';

interface FormState {
  email: string;
  password: string;
}

interface LocationState {
  notice?: string;
}

type AccountDisabled = components['schemas']['AccountDisabledResponse'];

/**
 * A disabled sign-in (stellar-api#622) carries where to go, not just that it
 * failed. Older apis answer the same 403 with `msg` alone, so both fields are
 * required before the panel replaces the toast.
 */
const asAccountDisabled = (err: unknown): AccountDisabled | null => {
  const rejection = (err ?? {}) as {
    status?: number;
    data?: Partial<AccountDisabled>;
  };
  if (rejection.status !== 403) return null;
  const { msg, disabledChannel, ircGuideUrl } = rejection.data ?? {};
  if (!disabledChannel || !ircGuideUrl) return null;
  return { msg: msg ?? 'Account disabled', disabledChannel, ircGuideUrl };
};

/**
 * Persistent, not a toast: the member has a channel to note and a link to
 * follow, and reactivation happens there rather than in this app (#324).
 */
const DisabledAccountPanel = ({ disabled }: { disabled: AccountDisabled }) => (
  <div
    role="alert"
    className="mb-4 bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm space-y-2"
  >
    <p className="font-medium">{disabled.msg}</p>
    <p>
      Reactivation is handled by staff on IRC. Ask in{' '}
      <strong className="font-semibold">{disabled.disabledChannel}</strong> and
      they can reinstate your account.
    </p>
    <a
      href={disabled.ircGuideUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block underline hover:text-red-200"
    >
      How to connect to IRC
    </a>
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const user = useSelector(selectCurrentUser);
  const { data: installStatus } = useGetInstallStatusQuery();

  const notice = (location.state as LocationState)?.notice;
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [disabled, setDisabled] = useState<AccountDisabled | null>(null);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Cleared per attempt: the next refusal may be about another account.
    setDisabled(null);
    try {
      await login(form).unwrap();
      navigate('/');
    } catch (err) {
      const accountDisabled = asAccountDisabled(err);
      if (accountDisabled) {
        setDisabled(accountDisabled);
        return;
      }
      const status = (err as { status?: number })?.status;
      const authErrorMessage =
        getApiErrorMessage(err) ?? 'Invalid email or password.';
      const msg =
        status === 429
          ? 'Too many attempts, try again later.'
          : authErrorMessage;
      dispatch(addAlert(msg, 'danger'));
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent mb-2">
          Stellar
        </h1>
        <p className="text-gray-400 text-sm">Sign in to your account</p>
      </div>

      {disabled && <DisabledAccountPanel disabled={disabled} />}

      {notice && (
        <div className="mb-4 bg-amber-900/40 border border-amber-700 text-amber-300 rounded-lg px-4 py-3 text-sm">
          {notice}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            placeholder="you@example.com"
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            minLength={6}
            required
            placeholder="••••••••"
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>

        <div className="text-center text-sm text-gray-500 space-x-2">
          <Link
            to="/recovery"
            className="hover:text-gray-300 transition-colors"
          >
            Forgot password?
          </Link>
          <span>·</span>
          {installStatus?.registrationStatus === 'open' && (
            <Link
              to="/register"
              className="hover:text-gray-300 transition-colors"
            >
              Register
            </Link>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;

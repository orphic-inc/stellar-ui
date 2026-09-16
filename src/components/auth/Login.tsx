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

const FIELD_CLASS =
  'w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500';

const LoginField = ({
  name,
  label,
  type,
  value,
  onChange,
  placeholder,
  minLength
}: {
  name: keyof FormState;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  minLength?: number;
}) => (
  <div>
    <label
      htmlFor={`login-${name}`}
      className="block text-sm font-medium text-gray-300 mb-1"
    >
      {label}
    </label>
    <input
      id={`login-${name}`}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      minLength={minLength}
      required
      placeholder={placeholder}
      className={FIELD_CLASS}
    />
  </div>
);

/** The toast wording for every refusal the panel does not take. */
const loginErrorMessage = (err: unknown): string => {
  if ((err as { status?: number })?.status === 429)
    return 'Too many attempts, try again later.';
  return getApiErrorMessage(err) ?? 'Invalid email or password.';
};

const LoginNotice = ({ notice }: { notice: string }) => (
  <div className="mb-4 bg-amber-900/40 border border-amber-700 text-amber-300 rounded-lg px-4 py-3 text-sm">
    {notice}
  </div>
);

const LoginHeading = () => (
  <div className="text-center mb-8">
    <h1 className="text-3xl font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent mb-2">
      Stellar
    </h1>
    <p className="text-gray-400 text-sm">Sign in to your account</p>
  </div>
);

const LoginSubmit = ({ isLoading }: { isLoading: boolean }) => (
  <button
    type="submit"
    disabled={isLoading}
    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
  >
    {isLoading ? 'Signing in…' : 'Sign In'}
  </button>
);

const LoginLinks = ({ canRegister }: { canRegister: boolean }) => (
  <div className="text-center text-sm text-gray-500 space-x-2">
    <Link to="/recovery" className="hover:text-gray-300 transition-colors">
      Forgot password?
    </Link>
    {/* Separator belongs to the Register link: without it a closed
        registration left a trailing "·" after Forgot password?. */}
    {canRegister && (
      <>
        <span>·</span>
        <Link to="/register" className="hover:text-gray-300 transition-colors">
          Register
        </Link>
      </>
    )}
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
      dispatch(addAlert(loginErrorMessage(err), 'danger'));
    }
  };

  return (
    <div className="w-full max-w-sm">
      <LoginHeading />

      {disabled && <DisabledAccountPanel disabled={disabled} />}

      {notice && <LoginNotice notice={notice} />}

      <form
        onSubmit={onSubmit}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4"
      >
        <LoginField
          name="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="you@example.com"
        />
        <LoginField
          name="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={onChange}
          placeholder="••••••••"
          minLength={6}
        />

        <LoginSubmit isLoading={isLoading} />

        <LoginLinks
          canRegister={installStatus?.registrationStatus === 'open'}
        />
      </form>
    </div>
  );
};

export default Login;

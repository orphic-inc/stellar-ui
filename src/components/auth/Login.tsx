import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../../store/services/authApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';

const LOCKOUT_LIMIT = 5;
const LOCKOUT_MS = 6 * 60 * 60 * 1000;

interface FormState {
  email: string;
  password: string;
}

interface LocationState {
  notice?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const user = useSelector(selectCurrentUser);

  const notice = (location.state as LocationState)?.notice;
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    if (user) navigate('/private');
  }, [user, navigate]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      await login(form).unwrap();
      navigate('/private');
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= LOCKOUT_LIMIT) setLockedUntil(Date.now() + LOCKOUT_MS);
      dispatch(addAlert('Invalid email or password.', 'danger'));
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

      {notice && (
        <div className="mb-4 bg-amber-900/40 border border-amber-700 text-amber-300 rounded-lg px-4 py-3 text-sm">
          {notice}
        </div>
      )}

      {isLocked ? (
        <div className="bg-red-900/40 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm text-center">
          Too many failed attempts. Try again later.
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4"
        >
          {attempts > 0 && (
            <div className="bg-yellow-900/40 border border-yellow-700 text-yellow-300 rounded px-3 py-2 text-sm">
              {LOCKOUT_LIMIT - attempts} attempt
              {LOCKOUT_LIMIT - attempts !== 1 ? 's' : ''} remaining before
              lockout.
            </div>
          )}

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
            <Link
              to="/register"
              className="hover:text-gray-300 transition-colors"
            >
              Register
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default Login;

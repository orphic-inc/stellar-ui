import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useGetMeQuery } from '../../store/services/authApi';
import { addAlert } from '../../store/slices/alertSlice';

const LOCKOUT_LIMIT = 5;
const LOCKOUT_MS = 6 * 60 * 60 * 1000;

interface FormState {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { data: me } = useGetMeQuery();

  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    if (me) navigate('/private');
  }, [me, navigate]);

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
    <div className="auth">
      <h1 className="large">Sign In</h1>
      {isLocked ? (
        <p className="warning">Too many failed attempts. Try again later.</p>
      ) : (
        <form className="form" onSubmit={onSubmit}>
          {attempts > 0 && (
            <p className="warning">
              {LOCKOUT_LIMIT - attempts} attempt
              {LOCKOUT_LIMIT - attempts !== 1 ? 's' : ''} remaining before
              lockout.
            </p>
          )}
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={onChange}
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in…' : 'Login'}
          </button>
          <p>
            <Link to="/recovery">Forgot password?</Link>
            {' · '}
            <Link to="/register">Register</Link>
          </p>
        </form>
      )}
    </div>
  );
};

export default Login;

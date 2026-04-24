import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '../../store/services/authApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getFieldErrors } from '../../utils/apiError';

interface FormState {
  username: string;
  email: string;
  password: string;
  password2: string;
}

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      dispatch(addAlert('Passwords do not match.', 'danger'));
      return;
    }
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password
      }).unwrap();
      dispatch(addAlert('Account created.', 'success'));
      navigate('/private');
    } catch (err: unknown) {
      const errors = getFieldErrors(err);
      const firstError = errors && Object.values(errors).flat()[0];
      dispatch(addAlert(firstError ?? 'Registration failed.', 'danger'));
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent mb-2">
          Stellar
        </h1>
        <p className="text-gray-400 text-sm">Create your account</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="reg-username"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Username
          </label>
          <input
            id="reg-username"
            type="text"
            name="username"
            value={form.username}
            onChange={onChange}
            minLength={2}
            maxLength={30}
            required
            placeholder="yourname"
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
          />
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            id="reg-email"
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
            htmlFor="reg-password"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            minLength={6}
            required
            placeholder="6+ characters"
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
          />
        </div>

        <div>
          <label
            htmlFor="reg-password2"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Confirm Password
          </label>
          <input
            id="reg-password2"
            type="password"
            name="password2"
            value={form.password2}
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
          {isLoading ? 'Creating account…' : 'Register'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;

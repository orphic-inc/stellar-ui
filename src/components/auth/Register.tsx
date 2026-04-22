import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '../../store/services/authApi';
import { addAlert } from '../../store/slices/alertSlice';

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
      dispatch(addAlert('Account created! You can now log in.', 'success'));
      navigate('/login');
    } catch (err: unknown) {
      const msg =
        (err as { data?: { errors?: { msg: string }[] } })?.data?.errors?.[0]
          ?.msg ?? 'Registration failed.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  return (
    <div className="auth">
      <h1 className="large">Create Account</h1>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={onChange}
            minLength={2}
            maxLength={30}
            required
          />
        </div>
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
            placeholder="Password (6+ characters)"
            value={form.password}
            onChange={onChange}
            minLength={6}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            name="password2"
            placeholder="Confirm Password"
            value={form.password2}
            onChange={onChange}
            minLength={6}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Register'}
        </button>
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;

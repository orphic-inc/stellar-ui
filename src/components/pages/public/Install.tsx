import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useInstallMutation } from '../../../store/services/installApi';
import { useAppDispatch } from '../../../store/hooks';
import { setCredentials } from '../../../store/slices/authSlice';
import { addAlert } from '../../../store/slices/alertSlice';

interface FormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Install = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [install, { isLoading }] = useInstallMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>();
  const password = watch('password');

  const onSubmit = async (values: FormValues) => {
    try {
      const { user } = await install({
        username: values.username,
        email: values.email,
        password: values.password
      }).unwrap();

      dispatch(setCredentials(user));
      dispatch(addAlert('Installation complete. Welcome, SysOp.', 'success'));
      navigate('/private');
    } catch (err: unknown) {
      const msg =
        (err as { data?: { msg?: string } })?.data?.msg ??
        'Installation failed';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  return (
    <div className="thin">
      <h2>Stellar — First-Time Setup</h2>
      <p className="lead">
        No ranks or users exist yet. Create the initial SysOp account to get
        started. This form is only available on a fresh installation and will be
        locked once complete.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <table className="layout">
          <tbody>
            <tr>
              <td className="label">Username</td>
              <td>
                <input
                  type="text"
                  {...register('username', {
                    required: 'Username is required'
                  })}
                  autoComplete="username"
                />
                {errors.username && (
                  <span className="error">{errors.username.message}</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="label">Email</td>
              <td>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Invalid email address'
                    }
                  })}
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="error">{errors.email.message}</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="label">Password</td>
              <td>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <span className="error">{errors.password.message}</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="label">Confirm Password</td>
              <td>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (v) => v === password || 'Passwords do not match'
                  })}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <span className="error">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td />
              <td>
                <input
                  type="submit"
                  value={isLoading ? 'Installing…' : 'Install'}
                  disabled={isLoading}
                  className="button"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </form>

      <div className="thin">
        <h3>What this will create</h3>
        <ul>
          <li>
            <strong>User</strong> (level 100) — default registration rank
          </li>
          <li>
            <strong>Power User</strong> (level 200) — promoted members
          </li>
          <li>
            <strong>Staff</strong> (level 500) — moderators and staff
          </li>
          <li>
            <strong>SysOp</strong> (level 1000) — full administrative access
          </li>
        </ul>
        <p>Your account will be assigned the SysOp rank.</p>
      </div>
    </div>
  );
};

export default Install;

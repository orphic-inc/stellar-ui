import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  installApi,
  useGetInstallStatusQuery,
  useInstallMutation
} from '../../../store/services/installApi';
import { useAppDispatch } from '../../../store/hooks';
import { setCredentials } from '../../../store/slices/authSlice';
import { addAlert } from '../../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../../utils/apiError';

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
  const { data: installStatus } = useGetInstallStatusQuery();

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
      dispatch(
        installApi.util.updateQueryData(
          'getInstallStatus',
          undefined,
          (draft) => {
            draft.installed = true;
            draft.registrationStatus = 'open';
          }
        )
      );
      dispatch(addAlert('Installation complete. Welcome, SysOp.', 'success'));
      navigate('/private');
    } catch (err: unknown) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Installation failed', 'danger')
      );
    }
  };

  const warnings = installStatus?.configWarnings ?? [];

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent mb-2">
          Stellar
        </h1>
        <p className="text-gray-400 text-sm">First-time setup</p>
      </div>

      {warnings.length > 0 && (
        <div className="mb-6 bg-amber-900/40 border border-amber-700 rounded-lg p-4">
          <p className="text-amber-300 text-sm font-medium mb-2">
            Environment configuration notes
          </p>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-amber-200 text-xs">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="install-username"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Username
          </label>
          <input
            id="install-username"
            type="text"
            {...register('username', { required: 'Username is required' })}
            autoComplete="username"
            placeholder="sysop"
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-400">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="install-email"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            id="install-email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Invalid email address'
              }
            })}
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="install-password"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Password
          </label>
          <input
            id="install-password"
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              }
            })}
            autoComplete="new-password"
            placeholder="8+ characters"
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="install-confirm"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Confirm Password
          </label>
          <input
            id="install-confirm"
            type="password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v) => v === password || 'Passwords do not match'
            })}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {isLoading ? 'Installing…' : 'Install'}
        </button>
      </form>

      <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-300 mb-2">What this creates</p>
        <p>
          User ranks: User (100) · Power User (200) · Staff (500) · SysOp (1000)
        </p>
        <p>
          Default forum structure (Site, Community, Music, Help, Staff, Trash)
        </p>
        <p>
          Your account will be assigned the SysOp rank with a 5 GiB startup
          buffer.
        </p>
        <p className="pt-1 text-gray-500">
          Launch configuration reminders will remain visible in the staff bar
          until they are addressed.
        </p>
      </div>
    </div>
  );
};

export default Install;

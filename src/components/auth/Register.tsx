import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '../../store/services/authApi';
import { useGetInstallStatusQuery } from '../../store/services/installApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';

interface FormState {
  username: string;
  email: string;
  password: string;
  password2: string;
  inviteKey: string;
}

const FIELD_CLASS =
  'w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-500';

const HEADING_CLASS =
  'text-3xl font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent';

const RegisterHeading = ({ className }: { className: string }) => (
  <h1 className={`${HEADING_CLASS} ${className}`}>Stellar</h1>
);

/**
 * Every field on this form is required, so that is not a prop — it was one
 * briefly, defaulted to true and overridden nowhere, which put the parameter
 * count over Codacy's limit of 8. Keep it at or under that when adding props.
 */
const RegisterField = ({
  name,
  label,
  type,
  value,
  onChange,
  placeholder,
  minLength,
  maxLength
}: {
  name: keyof FormState;
  label: React.ReactNode;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  minLength?: number;
  maxLength?: number;
}) => (
  <div>
    <label
      htmlFor={`reg-${name}`}
      className="block text-sm font-medium text-gray-300 mb-1"
    >
      {label}
    </label>
    <input
      id={`reg-${name}`}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      minLength={minLength}
      maxLength={maxLength}
      required
      placeholder={placeholder}
      className={FIELD_CLASS}
    />
  </div>
);

const SignInLink = () => (
  <Link
    to="/login"
    className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
  >
    Sign in
  </Link>
);

/** The page with no form on it: registration is refused before it is tried. */
const RegisterNotice = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-sm text-center">
    <RegisterHeading className="mb-6" />
    <p className="text-gray-400 mb-4">{children}</p>
    <SignInLink />
  </div>
);

const RegisterSubmit = ({ isLoading }: { isLoading: boolean }) => (
  <button
    type="submit"
    disabled={isLoading}
    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
  >
    {isLoading ? 'Creating account…' : 'Register'}
  </button>
);

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const { data: installStatus } = useGetInstallStatusQuery();

  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    password: '',
    password2: '',
    inviteKey: ''
  });
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const isInviteMode = installStatus?.registrationStatus === 'invite';

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
        password: form.password,
        ...(isInviteMode && { inviteKey: form.inviteKey })
      }).unwrap();
      dispatch(addAlert('Account created.', 'success'));
      navigate('/');
    } catch (err: unknown) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Registration failed.', 'danger')
      );
    }
  };

  if (installStatus?.registrationStatus === 'closed') {
    return <RegisterNotice>Registration is currently closed.</RegisterNotice>;
  }

  // One wording in both modes (#327). The api says more when it refuses the
  // POST — an invite key presented to a full site is not spent, and the reply
  // names the date the key runs out. That sentence needs a key to be accurate,
  // and this page renders before one is entered, so it is left to the submit:
  // stellar-api#627 kept an invite's clock running while the site is full, so
  // promising here that the invite "stays valid" would be a promise we cannot
  // keep.
  if (installStatus?.registrationFull) {
    return (
      <RegisterNotice>
        Registration is full: the site has reached its member limit.
      </RegisterNotice>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <RegisterHeading className="mb-2" />
        <p className="text-gray-400 text-sm">
          {isInviteMode
            ? 'Enter your invite key to register'
            : 'Create your account'}
        </p>
      </div>

      <RegisterFormBody
        form={form}
        onChange={onChange}
        onSubmit={onSubmit}
        isInviteMode={isInviteMode}
        isLoading={isLoading}
      />
    </div>
  );
};

const RegisterCoreFields = ({
  form,
  onChange
}: {
  form: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <>
    <RegisterField
      name="username"
      label="Username"
      type="text"
      value={form.username}
      onChange={onChange}
      minLength={2}
      maxLength={30}
      placeholder="yourname"
    />
    <RegisterField
      name="email"
      label="Email"
      type="email"
      value={form.email}
      onChange={onChange}
      placeholder="you@example.com"
    />
    <RegisterField
      name="password"
      label="Password"
      type="password"
      value={form.password}
      onChange={onChange}
      minLength={6}
      placeholder="6+ characters"
    />
    <RegisterField
      name="password2"
      label="Confirm Password"
      type="password"
      value={form.password2}
      onChange={onChange}
      minLength={6}
      placeholder="••••••••"
    />
  </>
);

const RegisterFormBody = ({
  form,
  onChange,
  onSubmit,
  isInviteMode,
  isLoading
}: {
  form: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isInviteMode: boolean;
  isLoading: boolean;
}) => (
  <form
    onSubmit={onSubmit}
    className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4"
  >
    <RegisterCoreFields form={form} onChange={onChange} />

    {isInviteMode && (
      <RegisterField
        name="inviteKey"
        label={
          <>
            Invite Key <span className="text-red-400">*</span>
          </>
        }
        type="text"
        value={form.inviteKey}
        onChange={onChange}
        placeholder="Paste your invite key"
      />
    )}

    <RegisterSubmit isLoading={isLoading} />

    <p className="text-center text-sm text-gray-500">
      Already have an account? <SignInLink />
    </p>
  </form>
);

export default Register;

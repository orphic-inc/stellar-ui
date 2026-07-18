import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateUserMutation } from '../../store/services/userApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { PageShell, Panel, Field, Button } from '../ui';

interface FormState {
  username: string;
  email: string;
  password: string;
}

const NewUserForm = () => {
  const navigate = useNavigate();
  const [createUser, { isLoading }] = useCreateUserMutation();
  const [formData, setFormData] = useState<FormState>({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createUser(formData).unwrap();
      navigate('/staff/tools');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) ?? 'Failed to create user.');
    }
  };

  return (
    <PageShell title="Create a User" width="sm">
      <Panel as="form" onSubmit={onSubmit} className="p-6 space-y-5">
        <Field
          id="new-username"
          label="Username"
          type="text"
          name="username"
          value={formData.username}
          onChange={onChange}
          required
        />
        <Field
          id="new-email"
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          required
        />
        <Field
          id="new-password"
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={onChange}
          minLength={6}
          required
        />

        {error && (
          <p data-st="meta" className="text-sm text-[var(--st-danger)]">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Creating…' : 'Create User'}
        </Button>
      </Panel>
    </PageShell>
  );
};

export default NewUserForm;

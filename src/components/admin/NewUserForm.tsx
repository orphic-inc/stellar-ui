import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateUserMutation } from '../../store/services/userApi';

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
      navigate('/private/staff/tools');
    } catch (err: unknown) {
      setError(
        (err as { data?: { msg?: string } })?.data?.msg ??
          'Failed to create user.'
      );
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          &larr; Back to Toolbox
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-white">Create a User</h2>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-gray-800 rounded-lg p-6 space-y-5 border border-gray-700"
      >
        <div>
          <label
            htmlFor="new-username"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Username
          </label>
          <input
            id="new-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={onChange}
            required
            className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="new-email"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            id="new-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            required
            className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Password
          </label>
          <input
            id="new-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={onChange}
            minLength={6}
            required
            className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          {isLoading ? 'Creating…' : 'Create User'}
        </button>
      </form>
    </div>
  );
};

export default NewUserForm;

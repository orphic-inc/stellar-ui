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
    <div className="thin">
      <div className="header">
        <h2>
          <strong>Create a User</strong>
        </h2>
      </div>
      <div className="linkbox">
        <Link to="/private/staff/tools" className="brackets">
          Back
        </Link>
      </div>
      <form className="newuserform" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="new-username">Username</label>
          <input
            id="new-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="new-email">Email</label>
          <input
            id="new-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="new-password">Password</label>
          <input
            id="new-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={onChange}
            minLength={6}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <input
          type="submit"
          className="btn btn-primary"
          value="Create User"
          disabled={isLoading}
        />
      </form>
    </div>
  );
};

export default NewUserForm;

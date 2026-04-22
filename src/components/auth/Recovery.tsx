import { useState } from 'react';
import { Link } from 'react-router-dom';

const Recovery = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="auth">
      <h1 className="large">Account Recovery</h1>
      {submitted ? (
        <p>
          If an account exists for that email, you will receive a recovery link
          shortly.
        </p>
      ) : (
        <form className="form" onSubmit={onSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Send Recovery Email
          </button>
          <p>
            <Link to="/login">Back to login</Link>
          </p>
        </form>
      )}
    </div>
  );
};

export default Recovery;

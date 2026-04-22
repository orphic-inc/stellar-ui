import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="thin center">
    <h2>404 — Page Not Found</h2>
    <p>The page you requested does not exist.</p>
    <p>
      <Link to="/private">Return home</Link>
    </p>
  </div>
);

export default NotFound;

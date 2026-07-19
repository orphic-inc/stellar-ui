import { Link } from 'react-router-dom';
import { useGetInstallStatusQuery } from '../../../store/services/installApi';

const PublicLanding = () => {
  const { data: installStatus } = useGetInstallStatusQuery();

  return (
    <div className="landing">
      <div className="landing-hero">
        <h1>Stellar</h1>
        <p className="lead">
          We didn&apos;t start the fire, but it&apos;s hot.
        </p>
        <div className="landing-actions flex gap-3">
          <Link to="/login" className="btn btn-primary">
            Sign In
          </Link>
          {installStatus?.registrationStatus === 'open' && (
            <Link to="/register" className="btn btn-secondary">
              Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicLanding;

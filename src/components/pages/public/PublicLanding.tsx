import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useGetMeQuery } from '../../../store/services/authApi';

const PublicLanding = () => {
  const navigate = useNavigate();
  const { data: me } = useGetMeQuery();

  useEffect(() => {
    if (me) navigate('/private');
  }, [me, navigate]);

  return (
    <div className="landing">
      <div className="landing-hero">
        <h1>Stellar</h1>
        <p className="lead">A curated community for music and media.</p>
        <div className="landing-actions">
          <Link to="/login" className="btn btn-primary">
            Sign In
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Request Access
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicLanding;

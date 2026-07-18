import { useNavigate } from 'react-router-dom';
import {
  useLazyGetRandomReleaseQuery,
  useLazyGetRandomArtistQuery
} from '../../store/services/searchApi';

export const RandomReleaseLink = () => {
  const navigate = useNavigate();
  const [trigger, { isFetching }] = useLazyGetRandomReleaseQuery();

  const handleClick = async () => {
    try {
      const r = await trigger().unwrap();
      if (r.communityId) {
        navigate(`/communities/${r.communityId}/releases/${r.id}`);
      }
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isFetching}
      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
    >
      [Random Release]
    </button>
  );
};

export const RandomArtistLink = () => {
  const navigate = useNavigate();
  const [trigger, { isFetching }] = useLazyGetRandomArtistQuery();

  const handleClick = async () => {
    try {
      const a = await trigger().unwrap();
      navigate(`/artists/${a.id}`);
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isFetching}
      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
    >
      [Random Artist]
    </button>
  );
};

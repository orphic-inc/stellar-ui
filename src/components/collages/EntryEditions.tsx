import { useGetReleaseContributionsQuery } from '../../store/services/communityApi';
import EditionStack from '../communities/EditionStack';

// Lazy edition disclosure for one collage entry — fetches the release's
// contributions only once its row is expanded (this component mounts on
// expand), then renders the read-only edition stack. Downloads/reports live on
// the release page, so no actions here.
const EntryEditions = ({
  communityId,
  releaseId
}: {
  communityId: number;
  releaseId: number;
}) => {
  const { data, isFetching } = useGetReleaseContributionsQuery({
    communityId,
    releaseId
  });
  if (isFetching && !data) {
    return (
      <div data-st="meta" className="px-3 py-2 text-xs">
        Loading editions…
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div data-st="meta" className="px-3 py-2 text-xs">
        No files contributed yet.
      </div>
    );
  }
  return <EditionStack contributions={data} />;
};

export default EntryEditions;

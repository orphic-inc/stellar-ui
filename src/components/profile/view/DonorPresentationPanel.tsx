import type { ProfileView } from './profileView';

type Presentation = NonNullable<ProfileView['donorPresentation']>;

const ICON_CLASS =
  'h-12 w-12 object-contain rounded border border-pink-900/40 bg-black/20';
const LABEL_CLASS = 'text-xs uppercase tracking-wide text-pink-200/80';

const CustomIcon = ({ presentation }: { presentation: Presentation }) => {
  if (!presentation.customIconSrc) return null;
  const icon = (
    <img
      src={presentation.customIconSrc}
      alt=""
      title={presentation.iconMouseOverText ?? undefined}
      className={ICON_CLASS}
    />
  );
  return (
    <div className="space-y-2">
      <div className={LABEL_CLASS}>Custom Icon</div>
      {presentation.customIconLink ? (
        <a
          href={presentation.customIconLink}
          target="_blank"
          rel="noreferrer"
          className="inline-block"
        >
          {icon}
        </a>
      ) : (
        icon
      )}
    </div>
  );
};

const DonorAvatar = ({ presentation }: { presentation: Presentation }) => {
  if (!presentation.secondAvatarSrc) return null;
  return (
    <div className="space-y-2">
      <div className={LABEL_CLASS}>Donor Avatar</div>
      <img
        src={presentation.secondAvatarSrc}
        alt=""
        title={presentation.avatarMouseOverText ?? undefined}
        className="h-20 w-20 object-cover rounded border border-pink-900/40"
      />
    </div>
  );
};

const DonorImages = ({ presentation }: { presentation: Presentation }) => {
  if (!presentation.customIconSrc && !presentation.secondAvatarSrc) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-4 items-start">
      <CustomIcon presentation={presentation} />
      <DonorAvatar presentation={presentation} />
    </div>
  );
};

const RankDates = ({ rank }: { rank: Presentation['rank'] }) => {
  if (!rank) return null;
  return (
    <div className="text-sm text-[var(--st-text)]">
      Granted{' '}
      <span className="text-[var(--st-text-strong)]">
        {new Date(rank.grantedAt).toLocaleDateString()}
      </span>
      {rank.expiresAt && (
        <>
          {' '}
          · Expires{' '}
          <span className="text-[var(--st-text-strong)]">
            {new Date(rank.expiresAt).toLocaleDateString()}
          </span>
        </>
      )}
    </div>
  );
};

const ProfileBlocks = ({
  blocks
}: {
  blocks: Presentation['profileBlocks'];
}) => {
  if (blocks.length === 0) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {blocks.map((block, index) => (
        <div
          key={`${block.title}-${index}`}
          className="rounded border border-pink-900/30 bg-black/10 p-3"
        >
          {block.title && (
            <div className={`mb-2 ${LABEL_CLASS}`}>{block.title}</div>
          )}
          <div className="text-sm text-[var(--st-text)] whitespace-pre-wrap">
            {block.body}
          </div>
        </div>
      ))}
    </div>
  );
};

const RankHeading = ({ rank }: { rank: Presentation['rank'] }) => {
  if (!rank) return null;
  return (
    <span
      className="text-xs font-semibold"
      style={{ color: rank.color || undefined }}
    >
      {rank.badge} {rank.name}
    </span>
  );
};

const DonorPresentationPanel = ({
  presentation
}: {
  presentation: ProfileView['donorPresentation'];
}) => {
  if (!presentation) return null;
  return (
    <div className="rounded border border-pink-900/50 bg-gradient-to-br from-pink-950/40 via-gray-900 to-gray-900 overflow-hidden">
      <div className="bg-pink-900/20 border-b border-pink-900/40 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-pink-200">
          Donor Presentation
        </span>
        <RankHeading rank={presentation.rank} />
      </div>
      <div className="p-4 space-y-4">
        <DonorImages presentation={presentation} />
        <RankDates rank={presentation.rank} />
        <ProfileBlocks blocks={presentation.profileBlocks} />
      </div>
    </div>
  );
};

export default DonorPresentationPanel;

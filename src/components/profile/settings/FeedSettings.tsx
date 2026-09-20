import { useState } from 'react';
import {
  useGetMemberFeedsQuery,
  useRotateMyFeedTokenMutation,
  type FeedBitrate,
  type FeedFormat
} from '../../../store/services/feedApi';
import { useGetCommunitiesQuery } from '../../../store/services/communityApi';
import { useAppDispatch } from '../../../store/hooks';
import { addAlert } from '../../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../../utils/apiError';
import { bitrateLabel } from '../../../utils/edition';
import { Button, Modal } from '../../ui';

/**
 * The member's Member Feed URLs (stellar-api#262).
 *
 * Every URL carries the same bearer token — the api derives one token per
 * member per epoch and maps it into all four — so the reveal control is
 * section-wide rather than per row: unmasking any one of them discloses the
 * secret in the other three, and four separate toggles would imply a
 * separation that does not exist.
 */

/** Records over the contract's unions: a format or bitrate added upstream
 *  fails this file's typecheck rather than silently dropping an option. The
 *  key order is the contract's own, which already clusters formats by medium. */
const FORMATS: Record<FeedFormat, true> = {
  mp3: true,
  flac: true,
  wav: true,
  ogg: true,
  aac: true,
  m4a: true,
  m4b: true,
  mp4: true,
  mkv: true,
  avi: true,
  mov: true,
  zip: true,
  exe: true,
  dmg: true,
  apk: true,
  pdf: true,
  epub: true,
  mobi: true,
  cbz: true,
  cbr: true,
  jpg: true,
  png: true,
  gif: true,
  txt: true
};

const BITRATES: Record<FeedBitrate, true> = {
  Lossless: true,
  Lossless24: true,
  Kbps320: true,
  Kbps256: true,
  KbpsV0: true,
  Kbps192: true,
  KbpsV2: true,
  Kbps128: true,
  Other: true
};

const FORMAT_OPTIONS = Object.keys(FORMATS) as FeedFormat[];
const BITRATE_OPTIONS = Object.keys(BITRATES) as FeedBitrate[];

const FEED_LABELS = {
  contributions: 'New contributions',
  mine: 'My contributions',
  news: 'News',
  bookmarks: 'Bookmarks'
} as const;

type FeedName = keyof typeof FEED_LABELS;
const FEED_ORDER = Object.keys(FEED_LABELS) as FeedName[];

type Filters = {
  community: string;
  tag: string;
  format: string;
  bitrate: string;
};

const NO_FILTERS: Filters = {
  community: '',
  tag: '',
  format: '',
  bitrate: ''
};

const MASK = '••••••••';

/**
 * Hide the token, keeping the rest of the URL readable.
 *
 * Deliberately a string match rather than `new URL()`: when `STELLAR_SITE_URL`
 * is unset the api answers a RELATIVE url (stellar-api#667), which `new URL()`
 * throws on. A settings tab that white-screens on a misconfigured server would
 * be a worse bug than the one it is reporting. Leaving the origin visible also
 * keeps that misconfiguration legible instead of masking the evidence.
 */
const maskToken = (url: string) =>
  url.replace(/([?&]token=)[^&]*/, `$1${MASK}`);

/** Append the chosen filters. The url always carries `user` and `token`
 *  already, so a further parameter is always an `&`. */
const withFilters = (url: string, filters: Filters) => {
  const query = (Object.keys(filters) as (keyof Filters)[])
    .filter((key) => filters[key].trim() !== '')
    .map((key) => `${key}=${encodeURIComponent(filters[key].trim())}`)
    .join('&');
  return query ? `${url}&${query}` : url;
};

const COPY_CONFIRM_MS = 2000;

const FeedRow = ({
  label,
  url,
  revealed
}: {
  label: string;
  url: string;
  revealed: boolean;
}) => {
  const dispatch = useAppDispatch();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      // Masked text cannot be selected by hand, so say how to get at it.
      dispatch(
        addAlert(
          'Could not copy to the clipboard. Choose Show tokens and copy the URL by hand.',
          'danger'
        )
      );
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor={`feed-url-${label}`} data-st="meta" className="text-sm">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          id={`feed-url-${label}`}
          type="text"
          readOnly
          value={revealed ? url : maskToken(url)}
          onFocus={(e) => e.currentTarget.select()}
          data-st="field"
          className="w-full font-mono text-xs"
        />
        <Button variant="link" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
};

const FilterSelect = ({
  id,
  label,
  value,
  onChange,
  anyLabel,
  children
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  anyLabel: string;
  children: React.ReactNode;
}) => (
  <div>
    <label htmlFor={id} data-st="meta" className="block text-xs mb-1">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-st="field"
      className="w-full"
    >
      <option value="">{anyLabel}</option>
      {children}
    </select>
  </div>
);

/** The one free-text filter; the api caps it at 100 characters. */
const TagFilter = ({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <div>
    <label
      htmlFor="feed-filter-tag"
      data-st="meta"
      className="block text-xs mb-1"
    >
      Tag
    </label>
    <input
      id="feed-filter-tag"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={100}
      placeholder="Any tag"
      data-st="field"
      className="w-full"
    />
  </div>
);

/**
 * Filters for the contributions feed. They narrow what the api already decided
 * the owner may see — `releaseVisibleTo` runs first and a filter is ANDed with
 * it — so nothing here can widen access.
 */
const FeedFilters = ({
  filters,
  onChange
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) => {
  const { data: communities } = useGetCommunitiesQuery(1);
  const set = (key: keyof Filters) => (value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      <FilterSelect
        id="feed-filter-community"
        label="Community"
        value={filters.community}
        onChange={set('community')}
        anyLabel="Any community"
      >
        {(communities?.data ?? []).map((community) => (
          <option key={community.id} value={String(community.id)}>
            {community.name}
          </option>
        ))}
      </FilterSelect>
      <TagFilter value={filters.tag} onChange={set('tag')} />
      <FilterSelect
        id="feed-filter-format"
        label="Format"
        value={filters.format}
        onChange={set('format')}
        anyLabel="Any format"
      >
        {FORMAT_OPTIONS.map((format) => (
          <option key={format} value={format}>
            {format}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        id="feed-filter-bitrate"
        label="Bitrate"
        value={filters.bitrate}
        onChange={set('bitrate')}
        anyLabel="Any bitrate"
      >
        {BITRATE_OPTIONS.map((bitrate) => (
          <option key={bitrate} value={bitrate}>
            {bitrateLabel(bitrate)}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
};

const RotateDialog = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const [rotate, { isLoading }] = useRotateMyFeedTokenMutation();

  const handleRotate = async () => {
    try {
      // The response carries the new URLs and is written straight into the
      // feeds cache by the mutation, so nothing here refetches.
      await rotate().unwrap();
      dispatch(addAlert('Your feed URLs have been reset.', 'success'));
      onClose();
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to reset your feed URLs.',
          'danger'
        )
      );
      onClose();
    }
  };

  return (
    <Modal
      title="Reset feed URLs"
      size="sm"
      onClose={onClose}
      dismissable={!isLoading}
    >
      <div className="space-y-3">
        <p data-st="prose" className="text-sm">
          Every feed URL you have already used stops working immediately. Any
          feed reader subscribed to one will stop receiving items until you give
          it the new URL.
        </p>
        <p data-st="prose" className="text-sm">
          All four feeds share one token, so resetting replaces all four.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="link" onClick={onClose} disabled={isLoading}>
            Keep current URLs
          </Button>
          <Button variant="danger" onClick={handleRotate} disabled={isLoading}>
            {isLoading ? 'Resetting…' : 'Reset feed URLs'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const FeedList = ({
  feeds,
  revealed
}: {
  feeds: Record<FeedName, string>;
  revealed: boolean;
}) => {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);

  return (
    <div className="space-y-4">
      {FEED_ORDER.map((name) => (
        <div key={name}>
          <FeedRow
            label={FEED_LABELS[name]}
            url={
              name === 'contributions'
                ? withFilters(feeds[name], filters)
                : feeds[name]
            }
            revealed={revealed}
          />
          {name === 'contributions' && (
            <FeedFilters filters={filters} onChange={setFilters} />
          )}
        </div>
      ))}
    </div>
  );
};

const FeedSettings = () => {
  const { data, isLoading } = useGetMemberFeedsQuery();
  const [revealed, setRevealed] = useState(false);
  const [rotating, setRotating] = useState(false);

  if (isLoading) return null;

  if (!data?.enabled) {
    return (
      <div data-st="panel" className="p-5">
        <h3
          data-st="prose"
          data-st-strong
          className="text-sm uppercase tracking-wider mb-2"
        >
          Member Feeds
        </h3>
        <p data-st="meta" className="text-sm">
          Feeds are not enabled on this site.
        </p>
      </div>
    );
  }

  return (
    <div data-st="panel" className="p-5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3
          data-st="prose"
          data-st-strong
          className="text-sm uppercase tracking-wider"
        >
          Member Feeds
        </h3>
        <Button variant="link" onClick={() => setRevealed(!revealed)}>
          {revealed ? 'Hide tokens' : 'Show tokens'}
        </Button>
      </div>
      <p data-st="meta" className="text-sm mb-4">
        Subscribe to these in a feed reader. Anyone holding one of these URLs
        can read that feed without signing in, so treat them like a password.
        All four share one token.
      </p>
      <FeedList feeds={data.feeds} revealed={revealed} />
      <div className="mt-4">
        <Button variant="link-danger" onClick={() => setRotating(true)}>
          Reset feed URLs
        </Button>
      </div>
      {rotating && <RotateDialog onClose={() => setRotating(false)} />}
    </div>
  );
};

export default FeedSettings;

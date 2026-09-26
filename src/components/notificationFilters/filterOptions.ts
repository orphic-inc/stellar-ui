import type { NotificationFilter } from '../../store/services/notificationFilterApi';
import { bitrateLabel } from '../../utils/edition';

export type ReleaseType = NotificationFilter['releaseTypes'][number];
export type ReleaseCategory = NotificationFilter['releaseCategories'][number];
export type FileType = NotificationFilter['fileTypes'][number];
export type Bitrate = NotificationFilter['bitrates'][number];
export type Media = NotificationFilter['media'][number];

// Each map is a Record over the contract's enum, so a value the api adds fails
// the typecheck here instead of going missing from the form.
const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  Music: 'Music',
  Applications: 'Applications',
  EBooks: 'E-books',
  ELearningVideos: 'E-learning videos',
  Audiobooks: 'Audiobooks',
  Comedy: 'Comedy',
  Comics: 'Comics'
};

const RELEASE_CATEGORY_LABELS: Record<ReleaseCategory, string> = {
  Album: 'Album',
  Single: 'Single',
  EP: 'EP',
  Anthology: 'Anthology',
  Compilation: 'Compilation',
  DJMix: 'DJ Mix',
  Live: 'Live album',
  Remix: 'Remix',
  Bootleg: 'Bootleg',
  Interview: 'Interview',
  Mixtape: 'Mixtape',
  Demo: 'Demo',
  ConcertRecording: 'Concert recording',
  Unknown: 'Unknown'
};

const FILE_TYPE_LABELS: Record<FileType, string> = {
  mp3: 'mp3',
  flac: 'flac',
  wav: 'wav',
  ogg: 'ogg',
  aac: 'aac',
  m4a: 'm4a',
  m4b: 'm4b',
  mp4: 'mp4',
  mkv: 'mkv',
  avi: 'avi',
  mov: 'mov',
  zip: 'zip',
  exe: 'exe',
  dmg: 'dmg',
  apk: 'apk',
  pdf: 'pdf',
  epub: 'epub',
  mobi: 'mobi',
  cbz: 'cbz',
  cbr: 'cbr',
  jpg: 'jpg',
  png: 'png',
  gif: 'gif',
  txt: 'txt'
};

const BITRATE_LABELS: Record<Bitrate, string> = {
  Lossless: bitrateLabel('Lossless'),
  Lossless24: bitrateLabel('Lossless24'),
  Kbps320: bitrateLabel('Kbps320'),
  Kbps256: bitrateLabel('Kbps256'),
  KbpsV0: bitrateLabel('KbpsV0'),
  Kbps192: bitrateLabel('Kbps192'),
  KbpsV2: bitrateLabel('KbpsV2'),
  Kbps128: bitrateLabel('Kbps128'),
  Other: bitrateLabel('Other')
};

const MEDIA_LABELS: Record<Media, string> = {
  CD: 'CD',
  WEB: 'WEB',
  Vinyl: 'Vinyl',
  SACD: 'SACD',
  DVD: 'DVD',
  Cassette: 'Cassette',
  BluRay: 'Blu-ray',
  DAT: 'DAT',
  Soundboard: 'Soundboard',
  Other: 'Other'
};

export type Option<T extends string | number> = { value: T; label: string };

const toOptions = <T extends string>(labels: Record<T, string>): Option<T>[] =>
  (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: labels[value]
  }));

export const RELEASE_TYPE_OPTIONS = toOptions(RELEASE_TYPE_LABELS);
export const RELEASE_CATEGORY_OPTIONS = toOptions(RELEASE_CATEGORY_LABELS);
export const FILE_TYPE_OPTIONS = toOptions(FILE_TYPE_LABELS);
export const BITRATE_OPTIONS = toOptions(BITRATE_LABELS);
export const MEDIA_OPTIONS = toOptions(MEDIA_LABELS);

const yearRange = (from: number | null, to: number | null) => {
  if (from !== null && to !== null)
    return from === to ? `${from}` : `${from}–${to}`;
  if (from !== null) return `${from} or later`;
  if (to !== null) return `${to} or earlier`;
  return null;
};

const listed = (heading: string, values: string[]) =>
  values.length > 0 ? `${heading}: ${values.join(', ')}` : null;

/**
 * One line per set criterion, for the filter list. `communityName` resolves an
 * id from the member's communities list; an id it cannot resolve is shown as
 * unavailable rather than dropped, so the filter still reads as it matches.
 */
export const summarizeFilter = (
  filter: NotificationFilter,
  communityName: (id: number) => string | undefined
): string[] =>
  [
    listed(
      'Artists',
      filter.artistIds.map(
        (id) =>
          filter.artists.find((a) => a.id === id)?.name ??
          `Removed artist #${id}`
      )
    ),
    listed('Tags', filter.tags),
    listed('Not tags', filter.notTags),
    listed(
      'Communities',
      filter.communityIds.map(
        (id) => communityName(id) ?? `Unavailable community #${id}`
      )
    ),
    listed(
      'Types',
      filter.releaseTypes.map((v) => RELEASE_TYPE_LABELS[v])
    ),
    listed(
      'Categories',
      filter.releaseCategories.map((v) => RELEASE_CATEGORY_LABELS[v])
    ),
    listed(
      'Formats',
      filter.fileTypes.map((v) => FILE_TYPE_LABELS[v])
    ),
    listed(
      'Bitrates',
      filter.bitrates.map((v) => BITRATE_LABELS[v])
    ),
    listed(
      'Media',
      filter.media.map((v) => MEDIA_LABELS[v])
    ),
    yearRange(filter.fromYear, filter.toYear),
    filter.newReleasesOnly ? 'New releases only' : null,
    filter.excludeCompilations ? 'No compilations' : null,
    filter.mainCreditsOnly ? 'Main credits only' : null
  ].filter((line): line is string => line !== null);

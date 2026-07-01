import type { EditionIdentity, ReleaseFileQuality } from '../types';

type Bitrate = ReleaseFileQuality['bitrate'];

// Human labels for the Bitrate enum. VBR tiers spell out (VBR) so a 320 CBR
// and a V0 rip read distinctly, matching the format/quality line on a row.
const BITRATE_LABELS: Record<NonNullable<Bitrate>, string> = {
  Lossless: 'Lossless',
  Lossless24: '24bit Lossless',
  Kbps320: '320',
  Kbps256: '256',
  KbpsV0: 'V0 (VBR)',
  Kbps192: '192',
  KbpsV2: 'V2 (VBR)',
  Kbps128: '128',
  Other: 'Other'
};

export const bitrateLabel = (bitrate: Bitrate): string =>
  bitrate ? BITRATE_LABELS[bitrate] : 'Unknown';

export const isLossless = (bitrate: Bitrate): boolean =>
  bitrate === 'Lossless' || bitrate === 'Lossless24';

// The edition heading. Mirrors the tracker-era edition string: an original
// release lists label/cat/media; a remaster leads with its year; an unknown
// pressing says so. A null media is dropped rather than left as a dangling ` / `.
export const editionLabel = (edition: EditionIdentity): string => {
  const media = edition.media ?? undefined;

  if (edition.isUnknownEdition) {
    return ['Unknown Release(s)', media].filter(Boolean).join(' / ');
  }

  if (edition.isRemaster && edition.year) {
    const rest = [
      edition.recordLabel,
      edition.catalogueNumber,
      edition.title,
      media
    ]
      .filter(Boolean)
      .join(' / ');
    return rest ? `${edition.year} - ${rest}` : String(edition.year);
  }

  return [
    'Original Release',
    edition.recordLabel,
    edition.catalogueNumber,
    media
  ]
    .filter(Boolean)
    .join(' / ');
};

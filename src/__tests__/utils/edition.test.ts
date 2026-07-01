import { editionLabel, bitrateLabel, isLossless } from '../../utils/edition';
import type { EditionIdentity } from '../../types';

const edition = (
  overrides: Partial<EditionIdentity> = {}
): EditionIdentity => ({
  id: 1,
  media: 'CD',
  year: null,
  recordLabel: null,
  catalogueNumber: null,
  title: null,
  isRemaster: false,
  isUnknownEdition: false,
  ...overrides
});

// The edition heading mirrors the legacy edition string: original release,
// remaster (year-led), and unknown pressing, each suffixed with media.
describe('editionLabel', () => {
  it('labels an original release with just its media', () => {
    expect(editionLabel(edition())).toBe('Original Release / CD');
  });

  it('folds record label and catalogue number into an original release', () => {
    expect(
      editionLabel(edition({ recordLabel: 'Warner', catalogueNumber: 'W-123' }))
    ).toBe('Original Release / Warner / W-123 / CD');
  });

  it('leads a remaster with its year, then label/cat/title/media', () => {
    expect(
      editionLabel(
        edition({
          isRemaster: true,
          year: 2011,
          recordLabel: 'Rhino',
          catalogueNumber: 'R2-5',
          title: 'Deluxe Edition',
          media: 'Vinyl'
        })
      )
    ).toBe('2011 - Rhino / R2-5 / Deluxe Edition / Vinyl');
  });

  it('labels an unknown pressing distinctly', () => {
    expect(editionLabel(edition({ isUnknownEdition: true, media: null }))).toBe(
      'Unknown Release(s)'
    );
  });

  it('omits a null media rather than printing a trailing separator', () => {
    expect(editionLabel(edition({ media: null }))).toBe('Original Release');
  });
});

describe('bitrateLabel', () => {
  it('renders VBR bitrates with their tier', () => {
    expect(bitrateLabel('KbpsV0')).toBe('V0 (VBR)');
    expect(bitrateLabel('Kbps320')).toBe('320');
    expect(bitrateLabel('Lossless')).toBe('Lossless');
  });

  it('renders an ungraded (null) bitrate as a placeholder', () => {
    expect(bitrateLabel(null)).toBe('Unknown');
  });
});

describe('isLossless', () => {
  it('is true for the lossless tiers only', () => {
    expect(isLossless('Lossless')).toBe(true);
    expect(isLossless('Lossless24')).toBe(true);
    expect(isLossless('Kbps320')).toBe(false);
    expect(isLossless(null)).toBe(false);
  });
});

import { describeQuota } from '../../components/stylesheets/stylesheetQuota';

describe('describeQuota (#450)', () => {
  it('counts against a limit, leaving New open below it', () => {
    expect(describeQuota(3, 5)).toEqual({
      line: '3 of 5 stylesheet spaces used',
      blocked: null
    });
  });

  it('blocks New at the cap and says how to free a space', () => {
    expect(describeQuota(5, 5)).toEqual({
      line: '5 of 5 stylesheet spaces used',
      blocked: 'All 5 spaces are in use. Deleting one frees a space.'
    });
  });

  it('words a single space in the singular', () => {
    expect(describeQuota(1, 1)).toEqual({
      line: '1 of 1 stylesheet space used',
      blocked: 'Your one space is in use. Deleting your stylesheet frees it.'
    });
  });

  it('shows no limit for null (stellar-api#881)', () => {
    expect(describeQuota(1, null)).toEqual({
      line: '1 stylesheet (no limit)',
      blocked: null
    });
    expect(describeQuota(4, null).line).toBe('4 stylesheets (no limit)');
  });

  it('blocks New for a class with no spaces (0)', () => {
    expect(describeQuota(2, 0)).toEqual({
      line: null,
      blocked: "Your class doesn't include stylesheet spaces."
    });
  });
});

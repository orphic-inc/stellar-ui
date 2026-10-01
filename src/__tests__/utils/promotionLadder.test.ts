import { nextRung, promotionPosition } from '../../utils/promotionLadder';

// User 100 → Member 150 → (gap) → Elite 300, with a secondary Donor at 200
// that sits between them by level but is not on the ladder (#383).
const ranks = [
  { id: 1, level: 100, secondary: false },
  { id: 2, level: 150, secondary: false },
  { id: 9, level: 200, secondary: true },
  { id: 4, level: 300, secondary: false }
];
const rank = (id: number) => ranks.find((r) => r.id === id)!;

describe('nextRung', () => {
  it('is the primary rank with the lowest level above', () => {
    expect(nextRung(rank(1), ranks)?.id).toBe(2);
  });

  it('crosses a gap in levels, skipping a secondary rank in it', () => {
    expect(nextRung(rank(2), ranks)?.id).toBe(4);
  });

  it('is null at the top primary rung', () => {
    expect(nextRung(rank(4), ranks)).toBeNull();
  });

  it('is null for a secondary rank', () => {
    expect(nextRung(rank(9), ranks)).toBeNull();
  });
});

describe('promotionPosition', () => {
  const rules = [
    { id: 1, fromRankId: 2, toRankId: 9 }, // to a secondary rank
    { id: 2, fromRankId: 2, toRankId: 4 }, // the next rung
    { id: 3, fromRankId: 1, toRankId: 2 } // another rank's rule
  ];

  it('matches the current rule by the pair, not the first from this rank', () => {
    const position = promotionPosition(2, ranks, rules);
    expect(position.current?.id).toBe(2);
    expect(position.outOfDate.map((r) => r.id)).toEqual([1]);
  });

  it('lists every rule leaving a rank with no next rung as out of date', () => {
    const position = promotionPosition(4, ranks, [
      { id: 5, fromRankId: 4, toRankId: 1 }
    ]);
    expect(position.next).toBeNull();
    expect(position.current).toBeUndefined();
    expect(position.outOfDate.map((r) => r.id)).toEqual([5]);
  });

  it('reports a secondary rank and tolerates data still loading', () => {
    expect(promotionPosition(9, ranks, rules).secondary).toBe(true);
    expect(promotionPosition(1)).toEqual({
      secondary: false,
      next: null,
      current: undefined,
      outOfDate: []
    });
  });
});

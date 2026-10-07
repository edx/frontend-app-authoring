import { orderPresentValues, rankAgainst } from './orderPresentValues';

describe('orderPresentValues', () => {
  it('always includes every known value, even when absent from present', () => {
    expect(orderPresentValues(['a', 'b', 'c'], [])).toEqual(['a', 'b', 'c']);
  });

  it('appends present values outside the known set, deduped, after the known ones', () => {
    expect(orderPresentValues(['a', 'b'], ['b', 'z', 'z', 'y'])).toEqual(['a', 'b', 'z', 'y']);
  });
});

describe('rankAgainst', () => {
  it('ranks known values by their position in the known list', () => {
    expect(rankAgainst(['a', 'b', 'c'], 'b')).toBe(1);
  });

  it('ranks an unknown value after every known value instead of before (-1)', () => {
    expect(rankAgainst(['a', 'b', 'c'], 'z')).toBe(3);
  });
});

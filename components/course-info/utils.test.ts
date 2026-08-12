import { describe, expect, it } from 'vitest';
import { getHourDisplay } from './utils';

const empty = {
  theory: 0,
  lab: 0,
  practice: 0,
  exercise: 0,
  computer: 0,
  tutoring: 0,
};

describe('getHourDisplay', () => {
  it('prefers nonzero detailed hours over the total', () => {
    expect(getHourDisplay({ ...empty, theory: 32 }, 48)).toBe('details');
  });

  it('uses total hours only when every detail is zero', () => {
    expect(getHourDisplay(empty, 48)).toBe('total');
  });

  it('keeps the unsupported fallback when no hours exist', () => {
    expect(getHourDisplay(empty, 0)).toBe('unsupported');
  });
});

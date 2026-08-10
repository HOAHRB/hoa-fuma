import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/docs-paths', () => ({
  getDocsCoursePathEntries: vi.fn((courseCode: string) =>
    courseCode === '22AS31102'
      ? [
          { slugs: ['2024', '01041', 'junior-autumn', '22AS31102'] },
          {
            slugs: ['2025', 'economics', 'junior-autumn', '22AS31102'],
          },
          { slugs: ['2025', 'economics', 'senior-spring', '22AS31102'] },
        ]
      : []
  ),
}));

vi.mock('@/lib/constants', () => ({
  SEMESTER_NAMES: new Set(['junior-autumn', 'senior-spring']),
}));

vi.mock('@/lib/utils', () => ({
  isYear: (segment: string) => /^\d{4}$/.test(segment),
}));

import { findRedirect } from './redirect';
import { getDocsCoursePathEntries } from '@/lib/docs-paths';

describe('findRedirect', () => {
  it('redirects a numeric-leading one-segment course code', () => {
    expect(findRedirect(['22as31102'])).toBe(
      '/docs/2025/economics/junior-autumn/22AS31102'
    );
    expect(getDocsCoursePathEntries).toHaveBeenCalledWith('22AS31102');
  });

  it('uses the saved year and major preference for a one-segment course code', () => {
    expect(
      findRedirect(['22AS31102'], '/docs/2024/01041/junior-autumn/22AS31102')
    ).toBe('/docs/2024/01041/junior-autumn/22AS31102');
  });

  it('preserves the existing semester/course compatibility route', () => {
    expect(findRedirect(['senior-spring', '22AS31102'])).toBe(
      '/docs/2025/economics/senior-spring/22AS31102'
    );
  });

  it('does not add a three-segment redirect route', () => {
    expect(
      findRedirect(['economics', 'junior-autumn', '22AS31102'])
    ).toBeNull();
  });

  it('returns null for an unknown course code', () => {
    expect(findRedirect(['UNKNOWN'])).toBeNull();
  });
});

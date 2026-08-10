import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/docs-content', () => ({
  docsDirs: {
    '2024': '/docs/2024',
    '2025': '/docs/2025',
  },
  fileToSlugs: (year: string, file: string) => [
    year,
    file.includes('economics') ? 'economics' : '01041',
    'junior-autumn',
    file.includes('long') ? '13SE90100500' : '22AS31102',
  ],
  getDocsYearDir: vi.fn(),
  getMarkdownFiles: (dir: string) =>
    dir.endsWith('2024')
      ? ['01041/22AS31102.mdx']
      : ['economics/22AS31102.mdx', 'economics/long.mdx'],
  isSafePathSegment: vi.fn(),
}));

import { getDocsCoursePathEntries } from './docs-paths';

describe('getDocsCoursePathEntries', () => {
  it('indexes every canonical course page by normalized course code', () => {
    expect(getDocsCoursePathEntries('22as31102')).toEqual([
      {
        slugs: ['2024', '01041', 'junior-autumn', '22AS31102'],
      },
      {
        slugs: ['2025', 'economics', 'junior-autumn', '22AS31102'],
      },
    ]);
  });

  it('supports numeric-leading course codes longer than ten characters', () => {
    expect(getDocsCoursePathEntries('13SE90100500')).toEqual([
      {
        slugs: ['2025', 'economics', 'junior-autumn', '13SE90100500'],
      },
    ]);
  });

  it('returns an empty collection for an unknown course code', () => {
    expect(getDocsCoursePathEntries('UNKNOWN')).toEqual([]);
  });
});

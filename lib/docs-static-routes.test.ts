import { describe, expect, it } from 'vitest';
import { buildStaticDocsRoutes } from './docs-static-routes';

const entries = [
  { slugs: ['2024'] },
  { slugs: ['2024', 'cs', 'fresh-autumn', 'CS101'] },
  { slugs: ['2025', 'ai', 'fresh-autumn', 'CS101'] },
];

describe('buildStaticDocsRoutes', () => {
  it('enumerates real document pages', () => {
    const result = buildStaticDocsRoutes(entries);

    expect(result.params).toContainEqual({ year: '2024', slug: undefined });
    expect(result.params).toContainEqual({
      year: '2024',
      slug: ['cs', 'fresh-autumn', 'CS101'],
    });
  });

  it('enumerates and deduplicates legacy aliases', () => {
    const result = buildStaticDocsRoutes(entries);

    expect(result.params.filter((item) => item.year === 'CS101')).toEqual([
      { year: 'CS101', slug: undefined },
    ]);
    expect(result.params).toContainEqual({
      year: 'fresh-autumn',
      slug: ['CS101'],
    });
  });

  it('retains every candidate for client-side preference selection', () => {
    const result = buildStaticDocsRoutes(entries);

    expect(result.aliases.get('CS101')).toHaveLength(2);
  });
});

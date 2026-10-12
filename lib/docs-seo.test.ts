import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/docs-paths', () => ({
  getDocsPathEntries: () => [
    { slugs: ['2024', 'cs', 'autumn', '22AS31102'], file: '/old.mdx' },
    {
      slugs: ['2025', 'economics', 'autumn', '22as31102'],
      file: '/latest.mdx',
    },
    { slugs: ['2025', 'cs', 'autumn', '22AS31102'], file: '/tie.mdx' },
    { slugs: ['2026', 'cs', 'autumn', '22AS31102'], file: '/placeholder.mdx' },
    { slugs: ['2025', 'cs'], file: '/index.mdx' },
  ],
}));
vi.mock('node:fs', () => ({
  readFileSync: (file: string) =>
    file === '/placeholder.mdx'
      ? '当前培养方案中包含这门课程，但 HOA 暂未收录对应的 GitHub 仓库'
      : 'Course content',
}));

import { getDocsSeoPath } from './docs-seo';

describe('getDocsSeoPath', () => {
  it('canonicalizes duplicate course codes to the newest non-placeholder page', () => {
    expect(getDocsSeoPath(['2024', 'cs', 'autumn', '22AS31102'])).toEqual({
      canonical: '/docs/2025/cs/autumn/22AS31102',
      indexable: true,
    });
    expect(
      getDocsSeoPath(['2025', 'economics', 'autumn', '22as31102'])
    ).toEqual({
      canonical: '/docs/2025/cs/autumn/22AS31102',
      indexable: true,
    });
  });
  it('excludes placeholder, index and unknown pages from indexing', () => {
    for (const slugs of [
      ['2026', 'cs', 'autumn', '22AS31102'],
      ['2025', 'cs'],
      ['unknown'],
    ]) {
      expect(getDocsSeoPath(slugs)).toEqual({
        canonical: undefined,
        indexable: false,
      });
    }
  });
});

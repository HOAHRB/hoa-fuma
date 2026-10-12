import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/base-path', () => ({
  siteUrl: 'https://test.hitchhike.work/hoahrb/',
}));
vi.mock('@/lib/source/pages', () => ({
  pages: { getPages: () => [{ url: '/about' }] },
}));
vi.mock('@/lib/posts-summary', () => ({
  getPostSummaries: (type: string) =>
    type === 'blog'
      ? [{ url: '/blog/post', slugs: ['post'] }]
      : [
          { url: '/news/daily/one', slugs: ['daily', 'one'] },
          { url: '/news/story', slugs: ['story'] },
        ],
}));
vi.mock('@/lib/docs-paths', () => ({
  getDocsPathEntries: () => [
    { slugs: ['2024', 'cs', 'autumn', 'CODE'] },
    { slugs: ['2025', 'cs', 'autumn', 'CODE'] },
    { slugs: ['2025', 'cs'] },
  ],
}));
vi.mock('@/lib/docs-seo', () => ({
  getDocsSeoPath: (slugs: string[]) =>
    slugs.length === 4
      ? { indexable: true, canonical: '/docs/2025/cs/autumn/CODE' }
      : { indexable: false },
}));

import sitemap from './sitemap';

describe('sitemap', () => {
  it('uses the HOAHRB origin and subpath and deduplicates canonical courses', () => {
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://test.hitchhike.work/hoahrb/',
      'https://test.hitchhike.work/hoahrb/about',
      'https://test.hitchhike.work/hoahrb/blog',
      'https://test.hitchhike.work/hoahrb/blog/post',
      'https://test.hitchhike.work/hoahrb/docs/2025/cs/autumn/CODE',
      'https://test.hitchhike.work/hoahrb/news',
      'https://test.hitchhike.work/hoahrb/news/story',
    ]);
  });
});

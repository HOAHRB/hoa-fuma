import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildNavigationCatalog } from './catalog';

const mocks = vi.hoisted(() => ({ indexed: vi.fn(), live: vi.fn() }));
vi.mock('@/lib/docs-index', () => ({ readDocsIndex: mocks.indexed }));
vi.mock('./catalog-data', () => ({ getLiveNavigationCatalog: mocks.live }));
import { getCourseNavigation, getCourseVariants } from './data';

const catalog = buildNavigationCatalog([
  {
    slugs: ['2025', 'CS', 'fresh-autumn', 'A'],
    name: '甲',
    majorName: '计算机',
    repoId: 'RESOURCE',
    assessmentMethod: '考试',
  },
  {
    slugs: ['2025', 'CS', 'fresh-spring', 'B'],
    name: '乙',
    majorName: '计算机',
    repoId: 'RESOURCE',
    assessmentMethod: '考查',
  },
]);
beforeEach(() => {
  mocks.indexed.mockReset().mockReturnValue(undefined);
  mocks.live.mockReset().mockReturnValue(catalog);
});
describe('navigation data loading', () => {
  it('skips the duplicate repository shard for a repository containing only the current code', () => {
    mocks.indexed.mockImplementation((key: string) => {
      if (key === 'navigation/keys')
        return {
          courses: ['A'],
          repositories: ['RESOURCE'],
          repositoryCourses: { RESOURCE: ['A'] },
        };
      if (key === 'navigation/course/41') return catalog.courses.A;
      throw new Error(`Unexpected shard: ${key}`);
    });
    expect(
      getCourseVariants(['2025', 'CS', 'fresh-autumn', 'A'], 'RESOURCE')
    ).toEqual([catalog.courses.A]);
    expect(mocks.live).not.toHaveBeenCalled();
  });
  it('uses generated metadata in development while preserving original code navigation', () => {
    expect(
      getCourseNavigation(['2025', 'CS', 'fresh-autumn', 'a'])?.records
    ).toEqual(catalog.courses.A.data.records);
    expect(
      getCourseVariants(['2025', 'CS', 'fresh-autumn', 'A'], 'resource').map(
        (course) => course.code
      )
    ).toEqual(['A', 'B']);
    expect(getCourseVariants(['2025', 'CS'])).toEqual([]);
  });
  it('reads only generated shards in production, including absent resource and course keys', () => {
    mocks.indexed.mockImplementation((key: string) => {
      if (key === 'navigation/keys')
        return { courses: ['A', 'B'], repositories: ['RESOURCE'] };
      if (key === 'navigation/course/41') return catalog.courses.A;
      if (key === 'navigation/repository/5245534f55524345')
        return Object.values(catalog.repositories.RESOURCE);
      throw new Error(`Unexpected shard: ${key}`);
    });
    expect(
      getCourseVariants(['2025', 'CS', 'fresh-autumn', 'A'], 'RESOURCE')
    ).toHaveLength(2);
    expect(
      getCourseNavigation(['2025', 'CS', 'fresh-autumn', 'A'])?.records
    ).toHaveLength(1);
    expect(
      getCourseVariants(['2025', 'CS', 'fresh-autumn', 'A'], 'missing')
    ).toHaveLength(1);
    expect(
      getCourseVariants(['2025', 'CS', 'fresh-autumn', 'missing'])
    ).toEqual([]);
    expect(mocks.live).not.toHaveBeenCalled();
  });
});

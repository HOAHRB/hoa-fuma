import { beforeEach, expect, it, vi } from 'vitest';
import { buildRelationIndex, parseRelationArtifact } from './course-relations';

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  index: vi.fn(),
  major: vi.fn(),
  course: vi.fn(),
}));
vi.mock('node:fs', () => ({ readFileSync: mocks.read }));
vi.mock('@/lib/docs-index', () => ({ readDocsIndex: mocks.index }));
vi.mock('@/lib/major-courses-data', () => ({ getMajorCourses: mocks.major }));
vi.mock('@/lib/course-frontmatter', () => ({ getDocsCourse: mocks.course }));

const artifact = {
  version: 1,
  groups: { Related: { name: '课程群', members: ['Shared', 'Other'] } },
  series: {},
  names: { Shared: '共享名称', Other: '其他名称' },
};
const segments = ['2025', 'Civil', 'fresh-autumn', 'ORIGINAL'];
beforeEach(() => {
  vi.resetAllMocks();
  mocks.read.mockReturnValue(JSON.stringify(artifact));
  mocks.major.mockReturnValue([
    {
      href: '/docs/2025/Civil/fresh-autumn/ORIGINAL',
      code: 'ORIGINAL',
      title: '本方案名称',
      termLabel: '大一上',
    },
    {
      href: '/docs/2025/Civil/fresh-spring/ORIGINAL',
      code: 'ORIGINAL',
      title: '本方案名称',
      termLabel: '大一下',
    },
  ]);
  mocks.course.mockReturnValue({ repoId: 'Shared' });
});

it('matches mapped resource IDs within the current plan, preserving semesters and original identity', async () => {
  const { getCourseRelations } = await import('./course-relations-data');
  const panels = getCourseRelations(segments, 'Shared');
  expect(mocks.major).toHaveBeenCalledWith(['2025', 'Civil']);
  expect(panels[0].courses[0].name).toBe('共享名称');
  expect(
    panels[0].courses[0].localOfferings.map((o) => [o.code, o.term])
  ).toEqual([
    ['ORIGINAL', '大一上'],
    ['ORIGINAL', '大一下'],
  ]);
  expect(panels[0].courses[1].localOfferings).toEqual([]);
});

it('reads only the resource and current-plan shards in production', async () => {
  const slice = buildRelationIndex(parseRelationArtifact(artifact)).get(
    'Shared'
  )!;
  mocks.index.mockImplementation((key: string) => {
    if (key === 'relations/keys') return ['Shared', 'Other'];
    if (key === 'relations/plan/2025/Civil') return {};
    return slice;
  });
  const { getCourseRelations } = await import('./course-relations-data');
  expect(
    getCourseRelations(segments, 'Shared')[0].courses[0].localOfferings
  ).toEqual([]);
  expect(mocks.index.mock.calls.map(([key]) => key)).toEqual([
    'relations/keys',
    `relations/repository/${Buffer.from('Shared').toString('hex')}`,
    'relations/plan/2025/Civil',
  ]);
  expect(mocks.major).not.toHaveBeenCalled();
  expect(mocks.read).not.toHaveBeenCalled();
});

it('skips all plan work for unrelated courses and invalid paths', async () => {
  mocks.index.mockReturnValue(['Shared']);
  const { getCourseRelations } = await import('./course-relations-data');
  expect(getCourseRelations(segments, 'Unrelated')).toEqual([]);
  expect(
    getCourseRelations(['2025', '..', 'fresh-autumn', 'A'], 'Shared')
  ).toEqual([]);
  expect(getCourseRelations(['2025', 'Civil'], 'Shared')).toEqual([]);
  expect(mocks.major).not.toHaveBeenCalled();
});

it('accepts an absent artifact but reports malformed or unreadable artifacts', async () => {
  const { getLiveRelationIndex } = await import('./course-relations-data');
  mocks.read.mockImplementation(() => {
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  });
  expect(getLiveRelationIndex().size).toBe(0);
  mocks.read.mockReturnValue('{invalid');
  expect(() => getLiveRelationIndex()).toThrow();
  mocks.read.mockImplementation(() => {
    throw Object.assign(new Error('denied'), { code: 'EACCES' });
  });
  expect(() => getLiveRelationIndex()).toThrow('denied');
});

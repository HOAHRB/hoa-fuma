import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readFile } = vi.hoisted(() => ({ readFile: vi.fn() }));

vi.mock('@/lib/docs-paths', () => ({
  getDocsPathEntries: () => [
    { slugs: ['2024', 'cs', 'fresh-autumn'], file: 'term' },
    { slugs: ['2024', 'cs', 'fresh-autumn', 'A'], file: 'a' },
    { slugs: ['2024', 'cs', 'sophomore-spring', 'A'], file: 'a' },
    { slugs: ['2025', 'cs', 'fresh-autumn', 'B'], file: 'b' },
    { slugs: ['2024', 'ee', 'fresh-autumn', 'B'], file: 'b' },
    { slugs: ['2024', 'cs', 'general', 'B'], file: 'b' },
    { slugs: ['2024', 'cs', 'fresh-autumn', 'resource'], file: 'resource' },
    { slugs: ['2024', 'cs'], file: 'index' },
  ],
}));
vi.mock('node:fs', () => ({
  readFileSync: readFile,
}));

beforeEach(() => {
  vi.resetModules();
  readFile.mockReset();
  readFile.mockImplementation((file: string) =>
    file === 'term'
      ? '---\ntitle: 大一秋\n---\n'
      : file === 'a'
        ? '---\ntitle: 程序设计\ncourse:\n  courseNature: 必修\n  assessmentMethod: 考试\n  courseCategory: " 专业课 "\n  offeringCollege: " 计算机学院 "\n  credit: 0\n  totalHours: 32\n---\n'
        : file === 'b'
          ? '---\ntitle: 实践\ncourse:\n  courseNature: ""\n---\n'
          : '---\ntitle: 资源\n---\n'
  );
});

describe('major course data', () => {
  it('scopes by year, major and term, excluding shared resource categories', async () => {
    const { getMajorCourses } = await import('./major-courses-data');
    expect(
      getMajorCourses(['2024', 'cs']).map((course) => course.href)
    ).toEqual([
      '/docs/2024/cs/fresh-autumn/A',
      '/docs/2024/cs/sophomore-spring/A',
    ]);
    expect(getMajorCourses(['2024', 'cs', 'fresh-autumn'])).toHaveLength(1);
    expect(getMajorCourses(['2024'])).toEqual([]);
    expect(getMajorCourses(['2024', 'cs', 'fresh-autumn', 'A'])).toEqual([]);
    expect(getMajorCourses(['2023', 'cs'])).toEqual([]);
  });
  it('preserves zero values and represents missing metadata explicitly', async () => {
    const { getMajorCourses } = await import('./major-courses-data');
    expect(getMajorCourses(['2024', 'cs'])[0]).toMatchObject({
      credit: 0,
      hours: 32,
      nature: '必修',
      assessment: '考试',
      termLabel: '大一秋',
    });
    expect(getMajorCourses(['2025', 'cs'])[0]).toMatchObject({
      credit: null,
      hours: null,
      nature: '未标注',
      assessment: '未标注',
    });
  });
  it('reads and trims category and college while keeping legacy fields optional', async () => {
    const { getMajorCourses } = await import('./major-courses-data');
    expect(getMajorCourses(['2024', 'cs'])[0]).toMatchObject({
      courseCategory: '专业课',
      offeringCollege: '计算机学院',
    });
    expect(getMajorCourses(['2025', 'cs'])[0].courseCategory).toBeUndefined();
    expect(getMajorCourses(['2025', 'cs'])[0].offeringCollege).toBeUndefined();
  });

  it('reads only the requested major and reuses its cache across semester pages', async () => {
    const { getMajorCourses } = await import('./major-courses-data');
    getMajorCourses(['2024', 'cs', 'fresh-autumn']);
    expect(readFile.mock.calls.map(([file]) => file)).toEqual([
      'term',
      'a',
      'a',
      'resource',
    ]);
    readFile.mockClear();
    expect(getMajorCourses(['2024', 'cs'])).toHaveLength(2);
    expect(getMajorCourses(['2024', 'cs', 'sophomore-spring'])).toHaveLength(1);
    expect(readFile).not.toHaveBeenCalled();
    getMajorCourses(['2025', 'cs']);
    expect(readFile.mock.calls.map(([file]) => file)).toEqual(['b']);
  });

  it('retries after a failed read instead of caching a partial index', async () => {
    const { getMajorCourses } = await import('./major-courses-data');
    const implementation = readFile.getMockImplementation()!;
    readFile
      .mockImplementationOnce(implementation)
      .mockImplementationOnce(() => {
        throw new Error('read failed');
      });
    expect(() => getMajorCourses(['2024', 'cs'])).toThrow('read failed');
    expect(getMajorCourses(['2024', 'cs'])).toHaveLength(2);
  });
});

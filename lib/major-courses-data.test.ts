import { describe, expect, it, vi } from 'vitest';

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
  readFileSync: (file: string) =>
    file === 'term'
      ? '---\ntitle: 大一秋\n---\n'
      : file === 'a'
        ? '---\ntitle: 程序设计\ncourse:\n  courseNature: 必修\n  assessmentMethod: 考试\n  courseCategory: " 专业课 "\n  offeringCollege: " 计算机学院 "\n  credit: 0\n  totalHours: 32\n---\n'
        : file === 'b'
          ? '---\ntitle: 实践\ncourse:\n  courseNature: ""\n---\n'
          : '---\ntitle: 资源\n---\n',
}));

import { getMajorCourses } from './major-courses-data';

describe('major course data', () => {
  it('scopes by year, major and term, excluding shared resource categories', () => {
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
  it('preserves zero values and represents missing metadata explicitly', () => {
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
  it('reads and trims category and college while keeping legacy fields optional', () => {
    expect(getMajorCourses(['2024', 'cs'])[0]).toMatchObject({
      courseCategory: '专业课',
      offeringCollege: '计算机学院',
    });
    expect(getMajorCourses(['2025', 'cs'])[0].courseCategory).toBeUndefined();
    expect(getMajorCourses(['2025', 'cs'])[0].offeringCollege).toBeUndefined();
  });
});

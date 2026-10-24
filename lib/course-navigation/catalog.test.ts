import { describe, expect, it } from 'vitest';
import {
  buildNavigationCatalog,
  selectCourseVariants,
  type CourseOffering,
} from './catalog';

const offering = (
  code: string,
  term = 'fresh-autumn',
  repoId?: string
): CourseOffering => ({
  slugs: ['2025', 'CS', term, code],
  name: `课程 ${code}`,
  majorName: '计算机科学与技术',
  repoId,
  assessmentMethod: '考试',
});

describe('curriculum variant catalog', () => {
  it('preserves each offering nature, including missing values, without filling from another plan', () => {
    const catalog = buildNavigationCatalog([
      { ...offering('A'), courseNature: ' 必修 ' },
      { ...offering('A', 'fresh-spring'), courseNature: '限选' },
      { ...offering('A', 'sophomore-autumn'), courseNature: '选修' },
      { ...offering('A', 'sophomore-spring'), courseNature: '' },
      offering('A', 'sophomore-summer'),
    ]);
    expect(
      catalog.courses.A.data.records.map((record) => record.courseNature)
    ).toEqual(['必修', '限选', '选修', null, null]);
  });
  it('keeps multiple mapped codes and semesters in the same major without replacing plan identity', () => {
    const catalog = buildNavigationCatalog([
      offering('PE1', 'fresh-autumn', 'PE'),
      offering('PE2', 'fresh-spring', 'pe'),
      offering('PE2', 'sophomore-summer', 'PE'),
      offering('PE3', 'fresh-autumn', 'OTHER'),
    ]);
    const variants = selectCourseVariants(catalog, 'pe1', 'PE');
    expect(variants.map((course) => course.code)).toEqual(['PE1', 'PE2']);
    expect(
      variants[1].data.records.map((record) => [
        record.relativeTerm,
        record.openingTerm,
        record.href,
      ])
    ).toEqual([
      ['大一下', '2026 年春季', '/docs/2025/CS/fresh-spring/PE2'],
      ['大二夏季', '2027 年夏季', '/docs/2025/CS/sophomore-summer/PE2'],
    ]);
    expect(catalog.courses.PE1.data.records).toHaveLength(1);
  });
  it('does not associate equal names or transitively follow another repository', () => {
    const rows = [
      offering('A', 'fresh-autumn', 'R1'),
      offering('B', 'fresh-spring', 'R1'),
      offering('B', 'sophomore-autumn', 'R2'),
      offering('C', 'sophomore-spring', 'R2'),
    ];
    rows.forEach((row) => {
      row.name = '同名课程';
    });
    const catalog = buildNavigationCatalog(rows);
    const variants = selectCourseVariants(catalog, 'A', 'R1');
    expect(variants.map((course) => course.code)).toEqual(['A', 'B']);
    expect(variants[1].data.records).toHaveLength(1);
    // Strict identity keeps all occurrences of the original code, regardless of repo.
    expect(
      selectCourseVariants(catalog, 'B', 'R1').find(
        (course) => course.code === 'B'
      )?.data.records
    ).toHaveLength(2);
  });
  it('supports legacy repo fallback, missing assessment, last-write URLs, and excludes shared resource pages', () => {
    const last = { ...offering('A'), assessmentMethod: null };
    const catalog = buildNavigationCatalog([
      offering('A'),
      last,
      offering('B', 'general-knowledge', 'A'),
    ]);
    expect(selectCourseVariants(catalog, 'a')).toHaveLength(1);
    expect(catalog.courses.A.data.records).toHaveLength(1);
    expect(catalog.courses.A.data.records[0].assessmentMethod).toBeNull();
    expect(selectCourseVariants(catalog, 'missing')).toEqual([]);
    expect(catalog.courses.B).toBeUndefined();
  });
});

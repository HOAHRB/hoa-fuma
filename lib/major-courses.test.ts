import { describe, expect, it } from 'vitest';
import {
  groupMajorCourses,
  selectMajorCourses,
  UNKNOWN,
  type MajorCourse,
  type CourseFilters,
} from './major-courses';

const base: MajorCourse = {
  href: '/docs/2024/cs/fresh-autumn/A',
  code: 'A',
  title: '程序设计',
  term: 'fresh-autumn',
  termLabel: '第一学年秋季',
  nature: '必修',
  assessment: '考试',
  credit: 3,
  hours: 48,
};
const courses: MajorCourse[] = [
  base,
  {
    ...base,
    href: '/b',
    code: 'B',
    title: '数学',
    term: 'sophomore-spring',
    nature: '选修',
    assessment: '考查',
    credit: 2,
    hours: 32,
  },
  {
    ...base,
    href: '/c',
    code: 'C',
    title: '实践',
    term: 'fresh-summer',
    nature: '限选',
    credit: null,
    hours: null,
  },
  {
    ...base,
    href: '/d',
    code: 'D',
    title: '研讨',
    term: 'fresh-spring',
    nature: UNKNOWN,
    assessment: UNKNOWN,
    credit: 0,
    hours: 0,
  },
];
const filters: CourseFilters = {
  query: '',
  nature: '',
  assessment: '',
  term: '',
  sort: 'term',
};

describe('major course filtering and grouping', () => {
  it('combines search, nature, assessment and term without mutating input', () => {
    expect(
      selectMajorCourses(courses, {
        ...filters,
        query: '  a ',
        nature: '必修',
        assessment: '考试',
        term: 'fresh-autumn',
      })
    ).toEqual([base]);
    expect(
      selectMajorCourses(courses, { ...filters, query: '数学', nature: '必修' })
    ).toEqual([]);
    expect(courses.map((course) => course.code)).toEqual(['A', 'B', 'C', 'D']);
  });
  it('orders academic terms chronologically and renders their labels', () => {
    expect(
      selectMajorCourses(courses, filters).map((course) => course.code)
    ).toEqual(['A', 'D', 'C', 'B']);
  });
  it('sorts numbers, preserves zero and puts missing values last in both directions', () => {
    expect(
      selectMajorCourses(courses, { ...filters, sort: 'credit-asc' }).map(
        (course) => course.credit
      )
    ).toEqual([0, 2, 3, null]);
    expect(
      selectMajorCourses(courses, { ...filters, sort: 'credit-desc' }).map(
        (course) => course.credit
      )
    ).toEqual([3, 2, 0, null]);
    expect(
      selectMajorCourses(courses, { ...filters, sort: 'hours-desc' }).map(
        (course) => course.hours
      )
    ).toEqual([48, 32, 0, null]);
  });
  it('keeps limited electives and unknown metadata in their own groups', () => {
    expect(groupMajorCourses(courses, 'nature').map(([key]) => key)).toEqual([
      '必修',
      '选修',
      '限选',
      UNKNOWN,
    ]);
    expect(
      groupMajorCourses(courses, 'assessment').map(([key]) => key)
    ).toEqual(['考试', '考查', UNKNOWN]);
    expect(groupMajorCourses(courses, 'none')[0][1]).toHaveLength(4);
  });
});

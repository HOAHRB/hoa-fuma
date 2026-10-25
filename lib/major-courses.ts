export type MajorCourse = {
  href: string;
  code: string;
  title: string;
  term: string;
  termLabel: string;
  nature: string;
  assessment: string;
  credit: number | null;
  hours: number | null;
  courseCategory?: string;
  offeringCollege?: string;
};

export const UNKNOWN = '未标注';
const years = ['fresh', 'sophomore', 'junior', 'senior', 'fifth'];
const seasons = ['autumn', 'spring', 'summer'];

export function termOrder(term: string) {
  const [year, season] = term.split('-');
  const y = years.indexOf(year);
  const s = seasons.indexOf(season);
  return y < 0 || s < 0 ? 100 : y * 3 + s;
}

export type CourseSort =
  | 'term'
  | 'name'
  | 'credit-desc'
  | 'credit-asc'
  | 'hours-desc'
  | 'hours-asc';
export type CourseGroup =
  | 'term'
  | 'nature'
  | 'assessment'
  | 'offeringCollege'
  | 'courseCategory'
  | 'none';
export type CourseFilters = {
  query: string;
  nature: string;
  assessment: string;
  term: string;
  sort: CourseSort;
  courseCategory?: string;
  offeringCollege?: string;
};

export function selectMajorCourses(
  courses: MajorCourse[],
  filters: CourseFilters
) {
  const query = filters.query.trim().toLocaleLowerCase();
  return courses
    .filter(
      (course) =>
        (!query ||
          `${course.title} ${course.code}`
            .toLocaleLowerCase()
            .includes(query)) &&
        (!filters.nature || course.nature === filters.nature) &&
        (!filters.assessment || course.assessment === filters.assessment) &&
        (!filters.courseCategory ||
          course.courseCategory === filters.courseCategory) &&
        (!filters.offeringCollege ||
          course.offeringCollege === filters.offeringCollege) &&
        (!filters.term || course.term === filters.term)
    )
    .sort((a, b) => {
      let order = 0;
      if (filters.sort === 'term')
        order = termOrder(a.term) - termOrder(b.term);
      if (
        filters.sort.startsWith('credit') ||
        filters.sort.startsWith('hours')
      ) {
        const key = filters.sort.startsWith('hours') ? 'hours' : 'credit';
        const left = a[key];
        const right = b[key];
        if (left === null && right !== null) return 1;
        if (right === null && left !== null) return -1;
        if (left !== null && right !== null)
          order = filters.sort.endsWith('-asc') ? left - right : right - left;
      }
      return (
        order ||
        a.title.localeCompare(b.title, 'zh-CN', { numeric: true }) ||
        termOrder(a.term) - termOrder(b.term) ||
        a.href.localeCompare(b.href)
      );
    });
}

export function groupMajorCourses(courses: MajorCourse[], group: CourseGroup) {
  const groups = new Map<string, MajorCourse[]>();
  for (const course of courses) {
    const key =
      group === 'none'
        ? '全部课程'
        : group === 'term'
          ? course.term
          : course[group] || UNKNOWN;
    const items = groups.get(key) ?? [];
    items.push(course);
    groups.set(key, items);
  }
  return [...groups].sort(([a], [b]) => {
    if (group === 'term')
      return termOrder(a) - termOrder(b) || a.localeCompare(b, 'zh-CN');
    const preferred =
      group === 'nature'
        ? ['必修', '选修']
        : group === 'assessment'
          ? ['考试', '考查']
          : [];
    const rank = (value: string) =>
      value === UNKNOWN
        ? 100
        : preferred.includes(value)
          ? preferred.indexOf(value)
          : 50;
    return rank(a) - rank(b) || a.localeCompare(b, 'zh-CN');
  });
}

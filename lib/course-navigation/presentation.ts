import type { CourseNavigationData, ViewKey } from './schema';

type Record = CourseNavigationData['records'][number];
type CourseSource = {
  code: string;
  name: string;
  data: Pick<CourseNavigationData, 'records'>;
};

export function buildCourseNavigationScope({
  originalData,
  relatedCourses,
  currentCode,
  includeSimilar,
  selectedCode,
  view,
}: {
  originalData: Pick<CourseNavigationData, 'records'>;
  relatedCourses: CourseSource[];
  currentCode: string;
  includeSimilar: boolean;
  selectedCode?: string;
  view: ViewKey;
}) {
  const decorate = (course: CourseSource) =>
    course.data.records.map((record) => ({
      ...record,
      code: course.code,
      courseName: course.name,
    }));
  const courses = relatedCourses.map((course) => ({
    ...course,
    assessmentMethod: common(decorate(course)),
  }));
  const original = decorate({
    code: currentCode,
    name: '',
    data: originalData,
  });
  const scope = includeSimilar ? relatedCourses.flatMap(decorate) : original;
  const showingAll = includeSimilar && selectedCode === '__all';
  const selected = includeSimilar
    ? relatedCourses.find(
        (course) => course.code === (selectedCode ?? currentCode)
      )
    : undefined;
  return {
    assessmentMethod: common(scope),
    courses,
    presentation: buildNavigationPresentation(
      showingAll ? scope : selected ? decorate(selected) : original,
      view,
      showingAll
    ),
  };
}
export type DisplayRecord = Record & { code: string; courseName: string };
export type NavigationNode = {
  key: string;
  label: string;
  kind: 'primary' | 'term' | 'course';
  code?: string;
  assessmentMethod: string | null;
  children: NavigationNode[];
  items: { record: DisplayRecord; assessmentMethod: string | null }[];
};

function assessmentLabel(record?: Record) {
  return (
    [record?.courseNature?.trim(), record?.assessmentMethod?.trim()]
      .filter(Boolean)
      .join('') || null
  );
}

function common(records: DisplayRecord[]) {
  const value = assessmentLabel(records[0]);
  return value && records.every((record) => assessmentLabel(record) === value)
    ? value
    : null;
}

function termOrder(label: string) {
  const year = ['大一', '大二', '大三', '大四', '大五'].findIndex((value) =>
    label.startsWith(value)
  );
  const season = label.endsWith('上') ? 0 : label.endsWith('下') ? 1 : 2;
  return year < 0 ? 100 : year * 3 + season;
}

function openingOrder(label: string) {
  const match = /^(\d+) 年(春季|夏季|秋季)$/.exec(label);
  return match
    ? Number(match[1]) * 3 + ['春季', '夏季', '秋季'].indexOf(match[2])
    : 0;
}

export function buildNavigationPresentation(
  records: DisplayRecord[],
  view: ViewKey,
  groupByCode = false
) {
  const rootAssessment = common(records);
  function build(
    rows: DisplayRecord[],
    level: number,
    inherited: string | null
  ): NavigationNode[] {
    const groups = new Map<string, DisplayRecord[]>();
    const identity = (record: DisplayRecord) =>
      level === 0
        ? view === 'byMajor'
          ? `${record.majorName}\0${record.majorId}`
          : view === 'byEntryYear'
            ? record.entryYear
            : record.openingTerm
        : level === 1
          ? record.relativeTerm
          : record.code;
    rows.forEach((record) => {
      const key = identity(record);
      const members = groups.get(key);
      if (members) members.push(record);
      else groups.set(key, [record]);
    });
    const ordered = [...groups].sort(([a], [b]) =>
      level === 1
        ? termOrder(a) - termOrder(b)
        : level === 0 && view === 'byOpeningTerm'
          ? openingOrder(b) - openingOrder(a)
          : level === 0 && view !== 'byMajor'
            ? b.localeCompare(a, 'zh', { numeric: true })
            : a.localeCompare(b, 'zh', { numeric: true })
    );
    return ordered.map(([key, members]) => {
      const record = members[0];
      const method = common(members);
      const nextInherited = method ?? inherited;
      const leaf = level === (groupByCode ? 2 : 1);
      const sorted = [...members].sort((a, b) =>
        view === 'byMajor'
          ? b.entryYear.localeCompare(a.entryYear) ||
            a.href.localeCompare(b.href)
          : a.majorName.localeCompare(b.majorName, 'zh') ||
            a.majorId.localeCompare(b.majorId) ||
            a.href.localeCompare(b.href)
      );
      return {
        key,
        label:
          level === 0
            ? view === 'byMajor'
              ? record.majorName
              : view === 'byEntryYear'
                ? `${record.entryYear} 级`
                : record.openingTerm
            : level === 1
              ? record.relativeTerm
              : record.courseName,
        kind:
          level === 0
            ? ('primary' as const)
            : level === 1
              ? ('term' as const)
              : ('course' as const),
        code: level === 2 ? record.code : undefined,
        assessmentMethod: method === inherited ? null : method,
        children: leaf ? [] : build(members, level + 1, nextInherited),
        items: leaf
          ? sorted.map((item) => ({
              record: item,
              assessmentMethod:
                assessmentLabel(item) === nextInherited
                  ? null
                  : assessmentLabel(item),
            }))
          : [],
      };
    });
  }
  return {
    commonAssessmentMethod: rootAssessment,
    groups: build(records, 0, rootAssessment),
  };
}

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

type Dimensions = { nature: string | null; method: string | null };

function dimensions(record?: Record): Dimensions {
  return {
    nature: record?.courseNature?.trim() || null,
    method: record?.assessmentMethod?.trim() || null,
  };
}

function label(value: Dimensions) {
  return [value.nature, value.method].filter(Boolean).join('') || null;
}

function commonDimensions(records: DisplayRecord[]): Dimensions {
  const first = dimensions(records[0]);
  const shared = (key: keyof Dimensions) =>
    first[key] &&
    records.every((record) => dimensions(record)[key] === first[key])
      ? first[key]
      : null;
  return { nature: shared('nature'), method: shared('method') };
}

function remaining(value: Dimensions, inherited: Dimensions) {
  return label({
    nature: inherited.nature ? null : value.nature,
    method: inherited.method ? null : value.method,
  });
}

function common(records: DisplayRecord[]) {
  return label(commonDimensions(records));
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
  const rootAssessment = commonDimensions(records);
  function build(
    rows: DisplayRecord[],
    level: number,
    inherited: Dimensions
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
      const method = commonDimensions(members);
      const nextInherited = {
        nature: inherited.nature ?? method.nature,
        method: inherited.method ?? method.method,
      };
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
        assessmentMethod: remaining(method, inherited),
        children: leaf ? [] : build(members, level + 1, nextInherited),
        items: leaf
          ? sorted.map((item) => ({
              record: item,
              assessmentMethod: remaining(dimensions(item), nextInherited),
            }))
          : [],
      };
    });
  }
  return {
    commonAssessmentMethod: label(rootAssessment),
    groups: build(records, 0, rootAssessment),
  };
}

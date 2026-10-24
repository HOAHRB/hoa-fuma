import type { CourseNavigationData } from './schema';

export type CourseVariant = {
  code: string;
  name: string;
  data: Pick<CourseNavigationData, 'records'>;
};
export type NavigationCatalog = {
  courses: Record<string, CourseVariant>;
  repositories: Record<string, Record<string, CourseVariant>>;
};
export type CourseOffering = {
  slugs: string[];
  name: string;
  majorName: string;
  repoId?: string;
  assessmentMethod?: string | null;
  courseNature?: string | null;
};

export function buildNavigationCatalog(
  offerings: CourseOffering[]
): NavigationCatalog {
  const catalog: NavigationCatalog = {
    courses: Object.create(null),
    repositories: Object.create(null),
  };
  const unique = new Map(
    offerings.map((offering) => [offering.slugs.join('/'), offering])
  );
  const years = ['fresh', 'sophomore', 'junior', 'senior', 'fifth'];
  const seasons = ['autumn', 'spring', 'summer'];
  for (const offering of unique.values()) {
    const [year, major, term, code] = offering.slugs;
    if (offering.slugs.length !== 4 || !/^\d{4}$/.test(year)) continue;
    const [relativeYear, season] = term.split('-');
    const offset = years.indexOf(relativeYear);
    const seasonIndex = seasons.indexOf(season);
    if (offset < 0 || seasonIndex < 0 || term !== `${relativeYear}-${season}`)
      continue;
    const identity = code.toUpperCase();
    const repo = offering.repoId?.trim().toUpperCase() || identity;
    const record: CourseNavigationData['records'][number] = {
      entryYear: year,
      majorId: major,
      majorName: offering.majorName,
      relativeTerm: `${['大一', '大二', '大三', '大四', '大五'][offset]}${['上', '下', '夏季'][seasonIndex]}`,
      openingTerm: `${Number(year) + offset + (seasonIndex === 0 ? 0 : 1)} 年${['秋季', '春季', '夏季'][seasonIndex]}`,
      assessmentMethod: offering.assessmentMethod?.trim() || null,
      courseNature: offering.courseNature?.trim() || null,
      href: `/docs/${offering.slugs.join('/')}`,
    };
    const add = (target: Record<string, CourseVariant>) => {
      const variant = (target[identity] ??= {
        code,
        name: offering.name,
        data: { records: [] },
      });
      variant.data.records.push(record);
    };
    add(catalog.courses);
    add((catalog.repositories[repo] ??= Object.create(null)));
  }
  return catalog;
}

export function selectCourseVariants(
  catalog: NavigationCatalog,
  code: string,
  repoId?: string
) {
  const key = code.toUpperCase();
  const original = catalog.courses[key];
  const mapped =
    catalog.repositories[(repoId?.trim() || code).toUpperCase()] ?? {};
  return Object.values({
    ...mapped,
    ...(original ? { [key]: original } : {}),
  }).sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
}

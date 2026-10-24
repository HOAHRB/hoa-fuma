import { readFileSync } from 'node:fs';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import { getDocsPathEntries } from '@/lib/docs-paths';
import { computeYearMajorMap, type MajorEntry } from '@/lib/docs-utils';
import { join } from 'node:path';
import {
  buildNavigationCatalog,
  type CourseOffering,
  type NavigationCatalog,
} from './catalog';

let catalog: NavigationCatalog | undefined;

// Used during index generation and local development; production reads shards.
export function getLiveNavigationCatalog(): NavigationCatalog {
  if (catalog) return catalog;
  const entries = getDocsPathEntries();
  const mapping = JSON.parse(
    readFileSync(join(process.cwd(), 'lib/data/major_mapping.json'), 'utf8')
  ) as Record<string, Record<string, MajorEntry>>;
  const majors = computeYearMajorMap(entries, mapping);
  const offerings: CourseOffering[] = [];
  for (const { slugs, file } of entries) {
    if (slugs.length !== 4) continue;
    const data = frontmatter(readFileSync(file, 'utf8')).data as {
      title?: unknown;
      course?: unknown;
    };
    const course = data.course;
    if (!course || typeof course !== 'object') continue;
    const metadata = course as Record<string, unknown>;
    offerings.push({
      slugs,
      name: typeof data.title === 'string' ? data.title : slugs[3],
      majorName:
        majors[slugs[0]]?.find((major) => major.id === slugs[1])?.name ??
        slugs[1],
      repoId: typeof metadata.repoId === 'string' ? metadata.repoId : undefined,
      assessmentMethod:
        typeof metadata.assessmentMethod === 'string'
          ? metadata.assessmentMethod
          : null,
      courseNature:
        typeof metadata.courseNature === 'string'
          ? metadata.courseNature
          : null,
    });
  }
  catalog = buildNavigationCatalog(offerings);
  return catalog;
}

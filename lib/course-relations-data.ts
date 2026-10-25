import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readDocsIndex } from '@/lib/docs-index';
import { getDocsCourse } from '@/lib/course-frontmatter';
import { getMajorCourses } from '@/lib/major-courses-data';
import {
  buildRelationIndex,
  buildRelationPanels,
  parseRelationArtifact,
  type RelationOffering,
  type RelationPanel,
  type RelationSlice,
} from '@/lib/course-relations';

export function getLiveRelationIndex() {
  let source: string;
  try {
    source = readFileSync(
      join(process.cwd(), 'lib/data/course_relations.json'),
      'utf8'
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return new Map<string, RelationSlice>();
  }
  return buildRelationIndex(parseRelationArtifact(JSON.parse(source)));
}

// Called once per major at build time; production requests read its small shard.
export function getLocalRelationOfferings(
  major: string[],
  members: Set<string>
): Record<string, RelationOffering[]> {
  const offerings: Record<string, RelationOffering[]> = Object.create(null);
  if (!members.size) return offerings;
  for (const course of getMajorCourses(major)) {
    const segments = course.href.slice('/docs/'.length).split('/');
    const repo = getDocsCourse(segments)?.repoId ?? course.code;
    if (!members.has(repo)) continue;
    (offerings[repo] ??= []).push({
      name: course.title,
      code: course.code,
      term: course.termLabel,
      href: course.href,
    });
  }
  return offerings;
}

export function getCourseRelations(
  segments: string[],
  repoId: string
): RelationPanel[] {
  if (
    segments.length !== 4 ||
    segments.some((s) => !s || s === '.' || s === '..' || /[\\/]/.test(s))
  )
    return [];
  const keys = readDocsIndex<string[]>('relations/keys');
  if (keys && !keys.includes(repoId)) return [];
  const slice = keys
    ? readDocsIndex<RelationSlice>(
        `relations/repository/${Buffer.from(repoId).toString('hex')}`
      )
    : getLiveRelationIndex().get(repoId);
  if (!slice) return [];
  const major = segments.slice(0, 2);
  const offerings = keys
    ? (readDocsIndex<Record<string, RelationOffering[]>>(
        `relations/plan/${major.join('/')}`
      ) ?? {})
    : getLocalRelationOfferings(major, new Set(Object.keys(slice.names)));
  return buildRelationPanels(slice, offerings);
}

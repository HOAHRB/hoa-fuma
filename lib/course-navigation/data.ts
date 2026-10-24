import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readDocsIndex } from '@/lib/docs-index';
import { getLiveNavigationCatalog } from './catalog-data';
import { selectCourseVariants, type CourseVariant } from './catalog';
import {
  parseNavigationArtifact,
  selectCourseNavigation,
  type NavigationArtifact,
} from './schema';

let artifact: NavigationArtifact | undefined;

type NavigationKeys = {
  courses: string[];
  repositories: string[];
  repositoryCourses?: Record<string, string[]>;
};

function indexedCourse(code: string) {
  const keys = readDocsIndex<NavigationKeys>('navigation/keys');
  if (!keys) return undefined;
  return keys.courses.includes(code)
    ? readDocsIndex<CourseVariant>(
        `navigation/course/${Buffer.from(code).toString('hex')}`
      )
    : null;
}

export function getCourseNavigation(segments: string[]) {
  if (
    segments.length !== 4 ||
    !/^(fresh|sophomore|junior|senior|fifth)-(autumn|spring|summer)$/.test(
      segments[2]
    )
  )
    return undefined;
  const code = segments[3].toUpperCase();
  const indexed = indexedCourse(code);
  const live =
    indexed === undefined ? getLiveNavigationCatalog().courses[code] : indexed;
  if (live) return live.data;
  if (!artifact) {
    const path = join(process.cwd(), 'lib/data/course_navigation.json');
    try {
      artifact = parseNavigationArtifact(
        existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined
      );
    } catch {
      artifact = { version: 1, courses: {} };
    }
  }
  return selectCourseNavigation(artifact, segments);
}

export function getCourseVariants(
  segments: string[],
  repoId?: string
): CourseVariant[] {
  if (
    segments.length !== 4 ||
    !/^(fresh|sophomore|junior|senior|fifth)-(autumn|spring|summer)$/.test(
      segments[2]
    )
  )
    return [];
  const code = segments[3].toUpperCase();
  const repo = (repoId?.trim() || code).toUpperCase();
  const keys = readDocsIndex<NavigationKeys>('navigation/keys');
  const repositoryCodes = keys?.repositoryCourses?.[repo];
  // A single-code repository cannot add variants to that code's complete index.
  if (repositoryCodes?.length === 1 && repositoryCodes[0] === code) {
    const original = indexedCourse(code);
    return original ? [original] : [];
  }
  const indexed = keys
    ? keys.repositories.includes(repo)
      ? readDocsIndex<CourseVariant[]>(
          `navigation/repository/${Buffer.from(repo).toString('hex')}`
        )
      : []
    : undefined;
  if (indexed !== undefined) {
    const original = indexedCourse(code);
    return [
      ...indexed.filter((course) => course.code.toUpperCase() !== code),
      ...(original ? [original] : []),
    ].sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
  }
  return selectCourseVariants(getLiveNavigationCatalog(), code, repo);
}

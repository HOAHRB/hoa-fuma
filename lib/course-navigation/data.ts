import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseNavigationArtifact,
  selectCourseNavigation,
  type NavigationArtifact,
} from './schema';

let artifact: NavigationArtifact | undefined;

export function getCourseNavigation(segments: string[]) {
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

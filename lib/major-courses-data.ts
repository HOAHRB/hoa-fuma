import { readFileSync } from 'node:fs';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import { getDocsPathEntries } from '@/lib/docs-paths';
import { UNKNOWN, termOrder, type MajorCourse } from './major-courses';

let index: Map<string, MajorCourse[]> | undefined;

export function getMajorCourses(segments: string[]): MajorCourse[] {
  if (segments.length !== 2 && segments.length !== 3) return [];
  if (!index) {
    index = new Map();
    const entries = getDocsPathEntries();
    const termTitles = new Map<string, string>();
    for (const { slugs, file } of entries) {
      if (slugs.length !== 3 || termOrder(slugs[2]) === 100) continue;
      const { title } = frontmatter(readFileSync(file, 'utf8')).data as {
        title?: unknown;
      };
      if (typeof title === 'string' && title.trim())
        termTitles.set(slugs.join('/'), title);
    }
    for (const { slugs, file } of entries) {
      if (slugs.length !== 4 || termOrder(slugs[2]) === 100) continue;
      const data = frontmatter(readFileSync(file, 'utf8')).data as {
        title?: unknown;
        course?: Record<string, unknown>;
      };
      // Shared resource pages without course metadata are not curriculum entries.
      if (!data.course || typeof data.course !== 'object') continue;
      const text = (value: unknown) =>
        typeof value === 'string' && value.trim() ? value.trim() : UNKNOWN;
      const number = (value: unknown) =>
        typeof value === 'number' && Number.isFinite(value) && value >= 0
          ? value
          : null;
      const course: MajorCourse = {
        href: `/docs/${slugs.join('/')}`,
        code: slugs[3],
        title: typeof data.title === 'string' ? data.title : slugs[3],
        term: slugs[2],
        termLabel: termTitles.get(slugs.slice(0, 3).join('/')) ?? slugs[2],
        nature: text(data.course.courseNature),
        assessment: text(data.course.assessmentMethod),
        credit: number(data.course.credit),
        hours: number(data.course.totalHours),
        courseCategory:
          typeof data.course.courseCategory === 'string'
            ? data.course.courseCategory.trim() || undefined
            : undefined,
        offeringCollege:
          typeof data.course.offeringCollege === 'string'
            ? data.course.offeringCollege.trim() || undefined
            : undefined,
      };
      for (const key of [
        slugs.slice(0, 2).join('/'),
        slugs.slice(0, 3).join('/'),
      ]) {
        const courses = index.get(key) ?? [];
        courses.push(course);
        index.set(key, courses);
      }
    }
  }
  return index.get(segments.join('/')) ?? [];
}

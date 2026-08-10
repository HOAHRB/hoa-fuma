import { SEMESTER_NAMES } from '@/lib/constants';
import { isYear } from '@/lib/utils';
import { getDocsCoursePathEntries } from '@/lib/docs-paths';

function isSemester(segment: string): boolean {
  return SEMESTER_NAMES.has(segment);
}

function parseCookiePath(cookiePath: string): {
  year?: string;
  major?: string;
} {
  try {
    const segments = cookiePath.split('/').filter(Boolean);
    const yearIdx = segments.findIndex((s) => isYear(s));
    if (yearIdx === -1) return {};

    const year = segments[yearIdx];
    const major = segments[yearIdx + 1] ?? undefined;
    return { year, major };
  } catch {
    return {};
  }
}

export function findRedirect(
  segments: string[],
  cookiePath?: string
): string | null {
  if (segments.length === 0 || segments.length > 2) return null;

  let courseCode: string;
  let semester: string | undefined;

  if (segments.length === 2) {
    // docs/<semester>/<course_code>
    if (!isSemester(segments[0])) return null;
    semester = segments[0];
    courseCode = segments[1].toUpperCase();
  } else {
    // docs/<course_code>
    courseCode = segments[0].toUpperCase();
  }

  const candidates = getDocsCoursePathEntries(courseCode);
  const matches = semester
    ? candidates.filter((page) => page.slugs[2] === semester)
    : [...candidates];
  if (matches.length === 0) return null;

  if (cookiePath) {
    const { year: prefYear, major: prefMajor } = parseCookiePath(cookiePath);
    if (prefYear && prefMajor) {
      const exactMatch = matches.find(
        (m) => m.slugs[0] === prefYear && m.slugs[1] === prefMajor
      );
      if (exactMatch) {
        return '/docs/' + exactMatch.slugs.join('/');
      }

      const yearMatch = matches.find((m) => m.slugs[0] === prefYear);
      if (yearMatch) {
        return '/docs/' + yearMatch.slugs.join('/');
      }

      const majorMatch = matches.find((m) => m.slugs[1] === prefMajor);
      if (majorMatch) {
        return '/docs/' + majorMatch.slugs.join('/');
      }
    }
  }

  const sorted = matches.sort((a, b) => b.slugs[0].localeCompare(a.slugs[0]));
  const best = sorted[0];
  if (best) {
    return '/docs/' + best.slugs.join('/');
  }

  return null;
}

import {
  docsDirs,
  fileToSlugs,
  getDocsYearDir,
  getMarkdownFiles,
  isSafePathSegment,
  type DocsYear,
} from '@/lib/docs-content';

export type DocsPathEntry = {
  slugs: string[];
};

let docsPathEntries: DocsPathEntry[] | undefined;
let docsPathSet: Set<string> | undefined;
let docsCoursePathIndex: Map<string, DocsPathEntry[]> | undefined;

function getDocsPathEntries(): DocsPathEntry[] {
  if (docsPathEntries) return docsPathEntries;

  const entries: DocsPathEntry[] = [];

  for (const [year, yearDir] of Object.entries(docsDirs)) {
    for (const file of getMarkdownFiles(yearDir)) {
      entries.push({ slugs: fileToSlugs(year as DocsYear, file) });
    }
  }

  docsPathEntries = entries;
  return entries;
}

function getDocsPathSet() {
  if (!docsPathSet) {
    docsPathSet = new Set(
      getDocsPathEntries().map((entry) => entry.slugs.join('/'))
    );
  }

  return docsPathSet;
}

function getDocsCoursePathIndex() {
  if (!docsCoursePathIndex) {
    docsCoursePathIndex = new Map();

    for (const entry of getDocsPathEntries()) {
      if (entry.slugs.length !== 4) continue;

      const courseCode = entry.slugs[3]?.toUpperCase();
      if (!courseCode) continue;

      const entries = docsCoursePathIndex.get(courseCode);
      if (entries) {
        entries.push(entry);
      } else {
        docsCoursePathIndex.set(courseCode, [entry]);
      }
    }
  }

  return docsCoursePathIndex;
}

export function getDocsCoursePathEntries(
  courseCode: string
): readonly DocsPathEntry[] {
  return getDocsCoursePathIndex().get(courseCode.toUpperCase()) ?? [];
}

export function docsPathExists(segments: string[]): boolean {
  const [year, ...rest] = segments;
  if (!year) return false;

  const yearDir = getDocsYearDir(year);
  if (!yearDir || rest.some((segment) => !isSafePathSegment(segment))) {
    return false;
  }

  return getDocsPathSet().has(segments.join('/'));
}

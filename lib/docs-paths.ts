import {
  docsDirs,
  fileToSlugs,
  getMarkdownFiles,
  type DocsYear,
} from '@/lib/docs-content';

export type DocsPathEntry = {
  slugs: string[];
};

let docsPathEntries: DocsPathEntry[] | undefined;

export function getDocsPathEntries(): DocsPathEntry[] {
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

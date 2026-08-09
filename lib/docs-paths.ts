import { docsManifest } from '@/lib/docs-manifest';

export type DocsPathEntry = {
  slugs: string[];
};

const docsPathEntries: DocsPathEntry[] = docsManifest.paths.map((slugs) => ({
  slugs,
}));
const docsPathSet = new Set(
  docsPathEntries.map((entry) => entry.slugs.join('/'))
);

export function getDocsPathEntries(): DocsPathEntry[] {
  return docsPathEntries;
}

export function docsPathExists(segments: string[]): boolean {
  if (
    segments.length === 0 ||
    segments.some(
      (segment) => segment.length === 0 || segment === '.' || segment === '..'
    )
  ) {
    return false;
  }

  return docsPathSet.has(segments.join('/'));
}

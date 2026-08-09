import type { Root } from 'fumadocs-core/page-tree';
import { docsManifest } from '@/lib/docs-manifest';

export function getDocsPageTree(): Root {
  return docsManifest.pageTree;
}

export function getAvailableYears(): string[] {
  return docsManifest.years;
}

export function getYearPageTree(year: string): Root | undefined {
  return docsManifest.yearPageTrees[year];
}

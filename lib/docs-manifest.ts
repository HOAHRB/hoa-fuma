import type { Root } from 'fumadocs-core/page-tree';
import generatedManifest from '../.source/docs-manifest.json';

type DocsManifest = {
  pageTree: Root;
  yearPageTrees: Record<string, Root>;
  years: string[];
  paths: string[][];
  majorIdsByYear: Record<string, string[]>;
};

export const docsManifest = generatedManifest as unknown as DocsManifest;

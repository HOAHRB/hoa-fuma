import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildDocsManifest } from './docs-manifest.mjs';

const tempRoots: string[] = [];

function write(root: string, path: string, content: string) {
  const file = join(root, ...path.split('/'));
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, content);
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('buildDocsManifest', () => {
  it('preserves custom tree ordering, card titles, and normalized paths', () => {
    const root = mkdtempSync(join(tmpdir(), 'hoa-fuma-docs-manifest-'));
    tempRoots.push(root);

    write(root, 'notes/ignored.mdx', '---\ntitle: Ignored\n---');
    write(
      root,
      '2025/meta.json',
      JSON.stringify({ title: '2025 Plan', pages: ['overview', 'cs', '...'] })
    );
    write(
      root,
      '2025/index.mdx',
      `---
title: 2025 Index
---

<Card href="/docs/2025/cs" title="Computer Science" />
<Card title="Overview Card" href="/docs/2025/overview" />
`
    );
    write(root, '2025/overview.mdx', '---\ntitle: Overview fallback\n---');
    write(
      root,
      '2025/cs/meta.json',
      JSON.stringify({
        title: 'CS fallback',
        root: true,
        pages: ['sophomore-spring', 'fresh-autumn'],
      })
    );
    write(root, '2025/cs/index.mdx', '---\ntitle: CS Index\n---');
    write(root, '2025/cs/fresh-autumn.mdx', '---\ntitle: Fresh Autumn\n---');
    write(
      root,
      '2025/cs/sophomore-spring.md',
      '---\ntitle: Sophomore Spring\n---'
    );
    write(root, '2024/index.mdx', '---\ntitle: 2024 Index\n---');

    const manifest = buildDocsManifest(root);

    expect(manifest.years).toEqual(['2025', '2024']);
    expect(manifest.majorIdsByYear).toEqual({ '2024': [], '2025': ['cs'] });
    expect(manifest.paths).toEqual([
      ['2024'],
      ['2025', 'cs', 'fresh-autumn'],
      ['2025', 'cs'],
      ['2025', 'cs', 'sophomore-spring'],
      ['2025'],
      ['2025', 'overview'],
    ]);

    const yearFolder = manifest.pageTree.children[1];
    expect(yearFolder).toMatchObject({
      type: 'folder',
      name: '2025 Plan',
      index: { type: 'page', name: '2025 Index', url: '/docs/2025' },
    });
    expect(yearFolder.children[0]).toMatchObject({
      type: 'page',
      name: 'Overview Card',
      url: '/docs/2025/overview',
    });
    expect(yearFolder.children[1]).toMatchObject({
      type: 'folder',
      name: 'CS fallback',
    });
    expect(
      yearFolder.children[1].children.map((node: { url: string }) => node.url)
    ).toEqual([
      '/docs/2025/cs',
      '/docs/2025/cs/fresh-autumn',
      '/docs/2025/cs/sophomore-spring',
    ]);
    expect(manifest.yearPageTrees['2025']).toMatchObject({
      type: 'root',
      name: '2025 Plan',
    });
  });
});

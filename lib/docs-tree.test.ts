import { afterAll, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const fixture = vi.hoisted(() => ({ dir: '' }));
vi.mock('@/lib/docs-content', () => ({
  docsDirs: { '2023': fixture.dir },
  isSafePathSegment: (value: string) =>
    value.length > 0 && value !== '.' && value !== '..',
}));

describe('scoped major navigation tree', () => {
  it('loads only the requested major, preserves URLs and caches the result', async () => {
    fixture.dir = mkdtempSync(join(tmpdir(), 'major-tree-'));
    for (const major of ['01041', '01042']) {
      const dir = join(fixture.dir, major);
      mkdirSync(dir);
      writeFileSync(
        join(dir, 'meta.json'),
        JSON.stringify({ title: major, root: true })
      );
      writeFileSync(join(dir, 'index.mdx'), `---\ntitle: ${major}\n---\n`);
      writeFileSync(join(dir, 'fresh-autumn.mdx'), '---\ntitle: 大一秋\n---\n');
      const semester = join(dir, 'fresh-spring');
      mkdirSync(semester);
      writeFileSync(join(semester, 'index.mdx'), '---\ntitle: 大一春\n---\n');
      writeFileSync(join(semester, 'CS101.mdx'), '---\ntitle: 课程\n---\n');
    }
    const { getMajorPageTree, getYearPageTree } = await import('./docs-tree');
    const tree = getMajorPageTree('2023', '01041');
    expect(tree?.children).toHaveLength(1);
    const json = JSON.stringify(tree);
    expect(json).toContain('/docs/2023/01041/fresh-autumn');
    expect(json).not.toContain('01042');
    expect(getMajorPageTree('2023', '01041')).toBe(tree);
    expect(getMajorPageTree('2023', 'missing')).toBeUndefined();
    expect(getMajorPageTree('2023', '../01041')).toBeUndefined();
    expect(getMajorPageTree('2022', '01041')).toBeUndefined();
    const overview = JSON.stringify(getYearPageTree('2023'));
    expect(overview).toContain('/docs/2023/01041');
    expect(overview).toContain('/docs/2023/01042');
    expect(overview).not.toContain('CS101');
    expect(json).toContain('/docs/2023/01041/fresh-spring/CS101');
  });
});
afterAll(() => {
  if (fixture.dir) rmSync(fixture.dir, { recursive: true, force: true });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ files: new Map<string, unknown>() }));
const read = vi.hoisted(() => vi.fn());
vi.mock('node:fs', () => ({ readFileSync: read }));
vi.mock('@/lib/docs-content', () => ({
  docsDirs: { '2023': '/content/docs/2023' },
  isSafePathSegment: (value: string) =>
    value !== '.' && value !== '..' && !!value,
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'production');
  fixture.files.clear();
  read.mockReset();
  read.mockImplementation((file: string) => {
    const key = file.replaceAll('\\', '/').split('/docs-index/')[1];
    if (!fixture.files.has(key)) throw new Error(`Unexpected read: ${file}`);
    return JSON.stringify({ version: 1, data: fixture.files.get(key) });
  });
});
afterEach(() => vi.unstubAllEnvs());

describe('production docs indexes', () => {
  it('uses SEO metadata without opening any document bodies and caches it', async () => {
    fixture.files.set('seo.json', {
      '/docs/2023/cs/fresh-autumn/CS101': '/docs/2025/cs/fresh-autumn/CS101',
    });
    const { getDocsSeoPath } = await import('./docs-seo');
    expect(getDocsSeoPath(['2023', 'cs', 'fresh-autumn', 'CS101'])).toEqual({
      canonical: '/docs/2025/cs/fresh-autumn/CS101',
      indexable: true,
    });
    expect(getDocsSeoPath(['2023'])).toEqual({
      canonical: undefined,
      indexable: false,
    });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('loads only the selected major tree and rejects unknown or unsafe majors', async () => {
    fixture.files.set('majors.json', { '2023/cs': true });
    const tree = { type: 'root', name: '2023', children: [] };
    fixture.files.set('major/2023/cs.json', tree);
    const { getMajorPageTree } = await import('./docs-tree');
    expect(getMajorPageTree('2023', 'cs')).toEqual(tree);
    expect(getMajorPageTree('2023', 'cs')).toEqual(tree);
    expect(getMajorPageTree('2023', 'missing')).toBeUndefined();
    expect(getMajorPageTree('2023', '../cs')).toBeUndefined();
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('filters a major course shard by semester without scanning paths or parsing MDX', async () => {
    fixture.files.set('majors.json', { '2023/cs': true });
    const courses = [
      { term: 'fresh-autumn', code: 'CS101' },
      { term: 'fresh-spring', code: 'CS102' },
    ];
    fixture.files.set('courses/2023/cs.json', courses);
    const { getMajorCourses } = await import('./major-courses-data');
    expect(getMajorCourses(['2023', 'cs'])).toEqual(courses);
    expect(getMajorCourses(['2023', 'cs', 'fresh-spring'])).toEqual([
      courses[1],
    ]);
    expect(getMajorCourses(['2023', 'missing'])).toEqual([]);
    expect(getMajorCourses(['2023', '../cs'])).toEqual([]);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('does not cache failed reads and reports missing production artifacts', async () => {
    const { readDocsIndex } = await import('./docs-index');
    expect(() => readDocsIndex('seo')).toThrow('Unexpected read');
    fixture.files.set('seo.json', { restored: true });
    expect(readDocsIndex('seo')).toEqual({ restored: true });
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('rejects incompatible or incomplete indexes instead of scanning content', async () => {
    const { readDocsIndex } = await import('./docs-index');
    read.mockReturnValueOnce('{"version":2,"data":{}}');
    expect(() => readDocsIndex('seo')).toThrow('Unsupported docs index');
    read.mockReturnValueOnce('{"version":1}');
    expect(() => readDocsIndex('seo')).toThrow('Unsupported docs index');
  });

  it('reconstructs source paths relative to the deployment directory', async () => {
    fixture.files.set('paths.json', [
      {
        slugs: ['2023', 'cs'],
        file: '2023/cs/index.mdx',
      },
    ]);
    const { getDocsPathEntries } = await import('./docs-paths');
    const entries = getDocsPathEntries();
    expect(entries[0].slugs).toEqual(['2023', 'cs']);
    expect(entries[0].file.replaceAll('\\', '/')).toBe(
      `${process.cwd().replaceAll('\\', '/')}/content/docs/2023/cs/index.mdx`
    );
    expect(getDocsPathEntries()).toBe(entries);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('keeps development on live content even if generated files exist', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { readDocsIndex } = await import('./docs-index');
    expect(readDocsIndex('seo')).toBeUndefined();
    expect(read).not.toHaveBeenCalled();
  });

  it('evicts old shards while keeping recently accessed shards', async () => {
    const { readDocsIndex } = await import('./docs-index');
    for (let i = 0; i < 64; i++) {
      fixture.files.set(`shard-${i}.json`, i);
      readDocsIndex(`shard-${i}`);
    }
    readDocsIndex('shard-0');
    fixture.files.set('extra.json', true);
    readDocsIndex('extra');
    readDocsIndex('shard-0');
    expect(read).toHaveBeenCalledTimes(65);
    readDocsIndex('shard-1');
    expect(read).toHaveBeenCalledTimes(66);
  });

  it('evicts by serialized size and does not retain oversized artifacts', async () => {
    const { readDocsIndex } = await import('./docs-index');
    fixture.files.set('a.json', 'a'.repeat(9 * 1024 * 1024));
    fixture.files.set('b.json', 'b'.repeat(9 * 1024 * 1024));
    readDocsIndex('a');
    readDocsIndex('b');
    readDocsIndex('a');
    expect(read).toHaveBeenCalledTimes(3);
    fixture.files.set('large.json', 'x'.repeat(17 * 1024 * 1024));
    readDocsIndex('large');
    readDocsIndex('large');
    expect(read).toHaveBeenCalledTimes(5);
  });
});

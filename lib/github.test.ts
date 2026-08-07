import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getLatestCommit,
  getRecentRepos,
  listCourseRepositories,
} from './github';

const repository = (name: string, overrides = {}) => ({
  name,
  archived: false,
  is_template: false,
  pushed_at: '2026-08-04T00:00:00Z',
  html_url: `https://github.com/HOAHRB-Courses/${name}`,
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('listCourseRepositories', () => {
  it('excludes dot-prefixed, archived, and template repositories', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify([
            repository('CS101'),
            repository('.github'),
            repository('OLD101', { archived: true }),
            repository('course-template', { is_template: true }),
          ]),
          { status: 200 }
        )
      );

    const repositories = await listCourseRepositories(fetchMock);

    expect(repositories.map((repo) => repo.name)).toEqual(['CS101']);
  });

  it('follows the next link until all pages are collected', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([repository('CS101')]), {
          status: 200,
          headers: {
            Link: '<https://api.github.test/page/2>; rel="next", <https://api.github.test/page/2>; rel="last"',
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([repository('MATH101')]), { status: 200 })
      );

    const repositories = await listCourseRepositories(fetchMock);

    expect(repositories.map((repo) => repo.name)).toEqual(['CS101', 'MATH101']);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.github.com/orgs/HOAHRB-Courses/repos?type=all&per_page=100&page=1',
      'https://api.github.test/page/2',
    ]);
  });
});

it('returns no recent repositories when discovery fails', async () => {
  const consoleError = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 500 }))
  );

  await expect(getRecentRepos(17)).resolves.toEqual([]);
  expect(consoleError).toHaveBeenCalledOnce();
});

it('loads course commits from the courses organization', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(getLatestCommit('CS101')).resolves.toBeNull();
  expect(fetchMock.mock.calls[0]?.[0]).toBe(
    'https://api.github.com/repos/HOAHRB-Courses/CS101/commits?per_page=50'
  );
});

it('uses a build-time fetch without Next revalidation metadata', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);

  await getLatestCommit('STATIC-SNAPSHOT-TEST');

  const options = fetchMock.mock.calls[0]?.[1];
  expect(options).not.toHaveProperty('next');
  expect(options).toHaveProperty('signal');
});

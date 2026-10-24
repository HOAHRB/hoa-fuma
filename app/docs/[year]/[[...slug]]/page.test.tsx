import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  course: {} as { repoId?: string } | undefined,
  latestCommit: vi.fn(),
  navigation: vi.fn(),
  variants: vi.fn(),
}));

vi.mock('@/lib/base-path', () => ({ siteHref: (path: string) => path }));
vi.mock('@/lib/source/docs', () => ({
  source: {
    getPage: () => ({
      data: {
        title: 'Original course',
        load: async () => ({ body: () => null }),
      },
    }),
  },
}));
vi.mock('fumadocs-ui/layouts/docs/page', () => ({
  DocsBody: 'div',
  DocsDescription: 'div',
  DocsPage: 'div',
  DocsTitle: 'h1',
}));
vi.mock('fumadocs-ui/mdx', () => ({ createRelativeLink: () => 'a' }));
vi.mock('@/lib/github', () => ({ getLatestCommit: mocks.latestCommit }));
vi.mock('@/components/latest-commit', () => ({ LatestCommit: () => null }));
vi.mock('@/lib/constants', () => ({ COURSE_GITHUB_ORG: 'HOAHRB-Courses' }));
vi.mock('@/components/page-actions', () => ({ PageActions: 'actions' }));
vi.mock('@/components/mdx', () => ({
  getMDXComponents: () => ({}),
  NoPrefetchLink: 'a',
}));
vi.mock('@/lib/course-frontmatter', () => ({
  getDocsCourse: () => mocks.course,
}));
vi.mock('@/lib/visible-text', () => ({ hasVisibleText: () => false }));
vi.mock('@/lib/docs-seo', () => ({ getDocsSeoPath: vi.fn() }));
vi.mock('@/lib/course-navigation/data', () => ({
  getCourseNavigation: mocks.navigation,
  getCourseVariants: mocks.variants,
}));
vi.mock('@/components/course-navigation', () => ({
  CourseNavigation: () => null,
}));
vi.mock('@/components/major-course-list', () => ({
  MajorCourseList: () => null,
}));
vi.mock('@/lib/major-courses-data', () => ({ getMajorCourses: () => [] }));

beforeEach(() => {
  mocks.latestCommit.mockReset().mockResolvedValue(null);
  mocks.navigation.mockReset().mockReturnValue(undefined);
  mocks.variants.mockReset().mockReturnValue([]);
});

it('passes real repository variants to navigation while keeping the original route as current', async () => {
  mocks.course = { repoId: 'RESOURCE' };
  const data = { records: [] };
  const variants = [
    { code: 'ORIGINAL', name: '原始课程', data },
    { code: 'OTHER', name: '其他课号', data },
  ];
  mocks.navigation.mockReturnValue(data);
  mocks.variants.mockReturnValue(variants);
  const { default: Page } = await import('./page');
  const page = await Page({
    params: Promise.resolve({
      year: '2025',
      slug: ['CS', 'fresh-autumn', 'ORIGINAL'],
    }),
  });
  expect(mocks.variants).toHaveBeenCalledWith(
    ['2025', 'CS', 'fresh-autumn', 'ORIGINAL'],
    'RESOURCE'
  );
  const navigation = page.props.children[2].props.children.at(-1);
  expect(navigation.props).toMatchObject({
    data,
    relatedCourses: variants,
    currentHref: '/docs/2025/CS/fresh-autumn/ORIGINAL',
  });
});

it('does not serialize the same records twice when there are no other variants', async () => {
  mocks.course = { repoId: 'RESOURCE' };
  const data = { records: [] };
  mocks.navigation.mockReturnValue(data);
  mocks.variants.mockReturnValue([{ code: 'ORIGINAL', name: '课程', data }]);
  const { default: Page } = await import('./page');
  const page = await Page({
    params: Promise.resolve({
      year: '2025',
      slug: ['CS', 'fresh-autumn', 'ORIGINAL'],
    }),
  });
  const navigation = page.props.children[2].props.children.at(-1);
  expect(navigation.props.data).toBe(data);
  expect(navigation.props.relatedCourses).toBeUndefined();
});

it.each([
  [{ repoId: 'RESOURCE' }, 'RESOURCE'],
  [{}, 'ORIGINAL'],
] as const)(
  'uses the resource ID for GitHub, with legacy fallback: %j',
  async (course, repo) => {
    mocks.course = course;
    const { default: Page } = await import('./page');
    const page = await Page({
      params: Promise.resolve({
        year: '2025',
        slug: ['CS', 'fresh-autumn', 'ORIGINAL'],
      }),
    });
    expect(mocks.latestCommit).toHaveBeenCalledWith(repo);
    const body = page.props.children[2];
    expect(body.props.children[0].props.children.props.githubUrl).toBe(
      `https://github.com/HOAHRB-Courses/${repo}`
    );
  }
);

it('does not query GitHub for a navigation page', async () => {
  mocks.course = undefined;
  const { default: Page } = await import('./page');
  await Page({ params: Promise.resolve({ year: '2025', slug: ['CS'] }) });
  expect(mocks.latestCommit).not.toHaveBeenCalled();
});

it('shows the original course code beside the title with responsive wrapping', async () => {
  mocks.course = { repoId: 'RESOURCE' };
  const { default: Page } = await import('./page');
  const page = await Page({
    params: Promise.resolve({
      year: '2025',
      slug: ['CS', 'fresh-autumn', 'ORIGINAL-LONG-CODE'],
    }),
  });
  const heading = page.props.children[0];
  expect(heading.props.children[0].props.children).toBe('Original course');
  expect(heading.props.children[1].props.children).toBe('ORIGINAL-LONG-CODE');
  expect(heading.props.className).toContain('flex-wrap');
  expect(heading.props.className).toContain('items-baseline');
  expect(heading.props.children[1].props.className).toContain('basis-full');
  expect(heading.props.children[1].props.className).toContain('sm:basis-auto');
  expect(heading.props.children[1].props.className).toContain('shrink-0');
});

it('does not show a course code below navigation page titles', async () => {
  mocks.course = undefined;
  const { default: Page } = await import('./page');
  const page = await Page({
    params: Promise.resolve({ year: '2025', slug: ['CS'] }),
  });
  expect(page.props.children[0].props.children[1]).toBeUndefined();
});

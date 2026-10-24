import { siteHref } from '@/lib/base-path';
import { source } from '@/lib/source/docs';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getLatestCommit } from '@/lib/github';
import { LatestCommit } from '@/components/latest-commit';
import { COURSE_GITHUB_ORG } from '@/lib/constants';
import { PageActions } from '@/components/page-actions';
import { getMDXComponents, NoPrefetchLink } from '@/components/mdx';
import { getDocsCourse } from '@/lib/course-frontmatter';
import { hasVisibleText } from '@/lib/visible-text';
import { getDocsSeoPath } from '@/lib/docs-seo';
import {
  getCourseNavigation,
  getCourseVariants,
} from '@/lib/course-navigation/data';
import { CourseNavigation } from '@/components/course-navigation';
import { MajorCourseList } from '@/components/major-course-list';
import { getMajorCourses } from '@/lib/major-courses-data';

export default async function Page(props: {
  params: Promise<{ year: string; slug?: string[] }>;
}) {
  const params = await props.params;

  const segments = [params.year, ...(params.slug ?? [])];
  const page = source.getPage(segments);
  if (!page) notFound();

  const pageBody = await page.data.load();
  const MDX = pageBody.body;

  const course = getDocsCourse(segments);
  const courseCode = course ? segments.at(-1) : undefined;
  const navigation = getCourseNavigation(segments);
  const variants = course ? getCourseVariants(segments, course.repoId) : [];
  const majorCourses = getMajorCourses(segments);
  // Older generated pages use the repository ID as their route segment.
  const repoName = course
    ? (course.repoId ?? params.slug?.at(-1) ?? null)
    : null;
  const latestCommit = repoName ? await getLatestCommit(repoName) : null;

  const githubUrl = repoName
    ? `https://github.com/${COURSE_GITHUB_ORG}/${repoName}`
    : null;

  return (
    <DocsPage toc={pageBody.toc} full={page.data.full}>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <DocsTitle className="max-w-full min-w-0">{page.data.title}</DocsTitle>
        {courseCode && (
          <p className="text-fd-muted-foreground m-0 max-w-full shrink-0 basis-full font-mono text-sm wrap-anywhere sm:basis-auto">
            {courseCode}
          </p>
        )}
      </div>
      {(latestCommit || hasVisibleText(page.data.description)) && (
        <DocsDescription className="mb-0 text-base">
          {latestCommit ? (
            <LatestCommit commit={latestCommit} />
          ) : (
            page.data.description
          )}
        </DocsDescription>
      )}
      <DocsBody>
        {repoName && githubUrl && (
          <div className="mb-2">
            <PageActions githubUrl={githubUrl} />
          </div>
        )}
        {(segments.length !== 3 || majorCourses.length === 0) && (
          <MDX
            components={getMDXComponents(
              {
                a: createRelativeLink(source, page, NoPrefetchLink),
              },
              {
                course,
              }
            )}
          />
        )}
        {majorCourses.length > 0 && (
          <MajorCourseList
            key={segments.join('/')}
            courses={majorCourses}
            semesterPage={segments.length === 3}
          />
        )}
        {navigation && (
          <CourseNavigation
            key={segments.join('/')}
            data={navigation}
            relatedCourses={variants.length > 1 ? variants : undefined}
            currentHref={`/docs/${segments.join('/')}`}
          />
        )}
      </DocsBody>
    </DocsPage>
  );
}

// Generate on first visit; do not fetch GitHub metadata for every course at build time.
export function generateStaticParams(): { year: string; slug?: string[] }[] {
  return [];
}

export async function generateMetadata(props: {
  params: Promise<{ year: string; slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const slugs = [params.year, ...(params.slug ?? [])];
  const page = source.getPage(slugs);
  if (!page) notFound();
  const seo = getDocsSeoPath(slugs);
  const course = seo.indexable ? getDocsCourse(slugs) : undefined;
  const title = course
    ? `${page.data.title} ${slugs.at(-1)} · 课程资料 | HOAHRB`
    : page.data.title;
  const description =
    page.data.description ||
    (course ? `查看 ${page.data.title}的课程资料与课程信息。` : undefined);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: seo.canonical ?? page.url,
      images: siteHref('/apple-icon.png'),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: siteHref('/apple-icon.png'),
    },
    alternates: { canonical: seo.canonical ?? page.url },
    robots: seo.indexable ? undefined : { index: false, follow: true },
  };
}

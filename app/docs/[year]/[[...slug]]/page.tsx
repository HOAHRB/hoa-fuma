import { getPageImage, source } from '@/lib/source/docs';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getLatestCommit } from '@/lib/github';
import { LatestCommit } from '@/components/latest-commit';
import { COURSE_GITHUB_ORG } from '@/lib/constants';
import { PageActions } from '@/components/page-actions';
import { findRedirect } from '@/lib/redirect';
import { isYear } from '@/lib/utils';
import { getMDXComponents, NoPrefetchLink } from '@/components/mdx';
import { getDocsCourse } from '@/lib/course-frontmatter';

const SHOW_LATEST_COMMIT = false;

export default async function Page(props: {
  params: Promise<{ year: string; slug?: string[] }>;
}) {
  const params = await props.params;

  if (!isYear(params.year)) {
    const segments = [params.year, ...(params.slug ?? [])];
    const target = findRedirect(segments);
    if (target) {
      redirect(target);
    }
    notFound();
  }

  const segments = [params.year, ...(params.slug ?? [])];
  const page = source.getPage(segments);
  if (!page) notFound();

  const pageBody = await page.data.load();
  const MDX = pageBody.body;

  const course = getDocsCourse(segments);
  const repoName = course ? (params.slug?.at(-1) ?? null) : null;
  const latestCommit =
    SHOW_LATEST_COMMIT && repoName ? await getLatestCommit(repoName) : null;

  const githubUrl = repoName
    ? `https://github.com/${COURSE_GITHUB_ORG}/${repoName}`
    : null;

  return (
    <DocsPage toc={pageBody.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0 text-base">
        {latestCommit ? (
          <LatestCommit commit={latestCommit} />
        ) : (
          page.data.description
        )}
      </DocsDescription>
      <DocsBody>
        {repoName && githubUrl && (
          <div className="mb-2">
            <PageActions githubUrl={githubUrl} />
          </div>
        )}
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
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ year: string; slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage([params.year, ...(params.slug ?? [])]);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}

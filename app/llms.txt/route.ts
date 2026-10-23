import { siteHref } from '@/lib/base-path';
import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  PROJECT_URL,
  FEEDBACK_URL,
} from '@/lib/brand';
import { readFileSync } from 'node:fs';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import { getDocsPathEntries } from '@/lib/docs-paths';
import { getDocsSeoPath } from '@/lib/docs-seo';
import { getPostSummaries } from '@/lib/posts-summary';
import { pages } from '@/lib/source/pages';

export const dynamic = 'force-static';
export const revalidate = 3600;

function link(title: string, url: string, description?: string) {
  const label = title.replace(/\s+/g, ' ').replace(/[\\[\]]/g, '\\$&');
  const note = description ? `: ${description.replace(/\s+/g, ' ')}` : '';
  return `- [${label}](${siteHref(url)})${note}`;
}

export function GET() {
  const courses = getDocsPathEntries().flatMap(({ slugs, file }) => {
    const url = `/docs/${slugs.join('/')}`;
    const { canonical, indexable } = getDocsSeoPath(slugs);
    if (!indexable || canonical !== url) return [];

    const data = frontmatter(readFileSync(file, 'utf8')).data as {
      title: string;
      description?: string;
    };
    return [
      link(`${slugs.at(-1)} ${data.title}`, `${url}.md`, data.description),
    ];
  });

  const sections = [
    `# ${SITE_TITLE}`,
    `> ${SITE_DESCRIPTION} 本站非学校官方教务系统。`,
    '课程按入学年份、专业和学期组织。下方列出各课程的规范页面；具体培养方案请从课程文档入口按入学年份和专业查阅。',
    '## 项目',
    [
      link('课程文档', '/docs'),
      ...pages
        .getPages()
        .map((page) =>
          link(page.data.title, `${page.url}.md`, page.data.description)
        ),
      link('参与与反馈', '/about#参与与反馈'),
      link('问题反馈', FEEDBACK_URL),
      link('GitHub', PROJECT_URL),
    ].join('\n'),
    '## 课程',
    courses.sort().join('\n'),
    '## 博客',
    getPostSummaries('blog')
      .map((post) => link(post.title, `${post.url}.md`, post.description))
      .sort()
      .join('\n'),
    '## 新闻',
    getPostSummaries('news')
      .filter((post) => !['weekly', 'daily'].includes(post.slugs[0]))
      .map((post) => link(post.title, `${post.url}.md`, post.description))
      .sort()
      .join('\n'),
  ];

  return new Response(`${sections.join('\n\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

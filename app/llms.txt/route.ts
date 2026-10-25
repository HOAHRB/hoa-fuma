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
    '## 如何理解课程数据',
    [
      '本站以专业培养方案为主体。实体课程是某个专业、某个年级培养方案中的具体课程记录；同课号在不同方案中的名称、学分、学时、课程性质、考核方式和成绩构成可能不同。跨专业索引和规范页面是浏览与检索入口，不代表独立于培养方案的统一课程定义。',
      '宏课程是实体课程通过文档映射归并到的共同资料入口，以资料仓库 ID 标识。例如，计算思维与信息基础、计算思维与人工智能等可以共用计算思维文档。是否归并同时考虑内容、难度、考核方式和独立资料需求；共用资料不表示课程等价、可互相替代或具有相同考核要求。',
      '专业课程页面使用培养方案原始课号及本方案课程名称；映射只决定正文、下载资料和 GitHub 仓库入口，不替换课程元数据或教务简介。宏课程展示名称来自课程仓库文档，不能覆盖实体课程名称。',
      '课程群是多个宏课程之间无序的内容与资料关联；课程系列是多个宏课程组成的有序单链，不包含分支或并行，也不等同于培养方案的分轨道课程或学校规定的先修要求。同一宏课程可以属于多个群或系列。体育（1—6）已共用一个宏课程时，其内部顺序通过文档和开设学期表达。',
      '课程群和系列的成员由维护者在 major-data 的 course_relations.toml 中确认，分别使用 groups 和 series 表，条目包含 name 和 members。后端校验并生成关系数据，前端在构建时生成反向索引及本方案课程入口。页面在正文后显示所属关系，成员入口仅列本方案课程及 GitHub 资料仓库，不携带跨专业开设记录。不能仅凭课程名称、领域、资料映射或开课学期推断关系。已录入的关系以 course_relations.toml 为准。',
      '培养方案及课程数据由 hoa-major-data 维护，源自本部教务系统；课程正文和下载资料由 HOAHRB-Courses 仓库维护。方案 TOML 的 info 是元信息来源，文件名和专业索引是投影；当前站点发布普通本科主修方案，其他类别数据保留不等于已发布。',
      '专业课程成绩构成仅取对应方案课程的 grade_details。缺失或为空表示暂无信息，不能推断期末考试占比为 100%，也不能用共享资料正文中的成绩徽章或中央 grades_summary.json 补全。中央汇总保留按仓库 ID 索引的语义，供共享分类页使用。',
    ].join('\n\n'),
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

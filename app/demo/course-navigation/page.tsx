import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import {
  DocsBody,
  DocsPage,
  DocsTitle,
  DocsDescription,
} from 'fumadocs-ui/layouts/docs/page';
import { CourseNavigation } from '@/components/course-navigation';
import type { CourseNavigationData } from '@/lib/course-navigation/schema';
import { baseOptions } from '@/lib/layout.shared';

const majors = ['自动化', '计算机科学与技术', '电气工程及其自动化'];
const terms = ['大一上', '大一下', '大二上', '大二下'];

function navigation(
  index: number,
  code: string
): Pick<CourseNavigationData, 'records'> {
  const records = [2025, 2024, 2023].flatMap((year) =>
    majors.map((majorName, major) => ({
      entryYear: String(year),
      majorId: `M${major}`,
      majorName,
      relativeTerm: terms[index % 4],
      openingTerm: `${year + Math.floor(((index % 4) + 1) / 2)} 年${index % 2 ? '春季' : '秋季'}`,
      courseNature: ['必修', '限选', '选修'][index % 3],
      assessmentMethod:
        index === 2
          ? year === 2025
            ? '考试'
            : '考查'
          : index === 3
            ? [null, '考试', '考查'][major]
            : index % 3 === 0
              ? '考查'
              : '考试',
      href: `/demo/course-navigation?course=${code}&year=${year}&major=${major}`,
    }))
  );
  return { records };
}

export default async function Demo({
  searchParams,
}: {
  searchParams: Promise<{ many?: string }>;
}) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const many = (await searchParams).many === '1';
  const courses = Array.from({ length: many ? 12 : 4 }, (_, index) => {
    const code =
      index === 11
        ? 'PHYSICAL-EDUCATION-SPECIAL-2025-0012'
        : `PE${1001 + index}`;
    return {
      code,
      name:
        index < 4
          ? `体育（${['一', '二', '三', '四'][index]}）`
          : `体育专项（${index - 3}）`,
      data: navigation(index, code),
    };
  });
  return (
    <DocsLayout
      {...baseOptions()}
      tree={{
        name: '课程导航演示',
        children: [
          {
            type: 'folder',
            name: '2025 级 · 自动化',
            defaultOpen: true,
            children: [
              {
                type: 'page',
                name: '体育（一）',
                url: '/demo/course-navigation',
              },
            ],
          },
        ],
      }}
    >
      <DocsPage toc={[]} full>
        <DocsTitle>体育（一）</DocsTitle>
        <DocsDescription>课程关联导航 · 开发演示</DocsDescription>
        <DocsBody>
          <div className="not-prose flex flex-wrap gap-2 text-sm">
            <Link
              href="/demo/course-navigation/preview"
              className="bg-fd-secondary rounded-lg px-3 py-2"
            >
              标志场景预览
            </Link>
            <Link
              href="/demo/course-navigation"
              className="bg-fd-secondary rounded-lg px-3 py-2"
            >
              4 个课号
            </Link>
            <Link
              href="/demo/course-navigation?many=1"
              className="bg-fd-secondary rounded-lg px-3 py-2"
            >
              12 个课号
            </Link>
          </div>
          <p className="text-fd-muted-foreground text-sm">
            使用模拟体育课程验证映射展示，开启“包括变体课程”后可切换单门课程或查看全部变体。
          </p>
          <CourseNavigation
            key={String(many)}
            data={courses[0].data}
            currentHref={courses[0].data.records[0].href}
            relatedCourses={courses}
          />
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}

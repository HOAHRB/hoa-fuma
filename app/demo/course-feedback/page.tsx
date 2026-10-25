import { notFound } from 'next/navigation';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { baseOptions } from '@/lib/layout.shared';
import { Paragraph, NoPrefetchLink } from '@/components/mdx';
import { CourseNavigation } from '@/components/course-navigation';

export default function Demo() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return (
    <DocsLayout
      {...baseOptions()}
      tree={{ name: '占位课程预览', children: [] }}
    >
      <DocsPage toc={[]}>
        <DocsTitle>体育（一）</DocsTitle>
        <DocsBody>
          <p>
            这门课程（<code>PE1001</code>
            ）还留着一些空白，等上过这门课的你添上几笔。
          </p>
          <Paragraph>
            <NoPrefetchLink href="/about#参与与反馈">参与与反馈</NoPrefetchLink>
          </Paragraph>
          <p>
            可以是教材与参考书、授课内容和课程建议，也可以是你希望当初有人告诉自己的事。
          </p>
          <CourseNavigation
            currentHref="/docs/2025/automation/fresh-autumn/PE1001"
            data={{
              records: [2025, 2024, 2023].map((year) => ({
                entryYear: String(year),
                majorId: 'automation',
                majorName: '自动化',
                relativeTerm: '大一上',
                openingTerm: `${year} 年秋季`,
                assessmentMethod: '考查',
                href: `/docs/${year}/automation/fresh-autumn/PE1001`,
              })),
            }}
          />
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}

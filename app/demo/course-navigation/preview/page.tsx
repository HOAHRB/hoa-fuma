import { notFound } from 'next/navigation';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { baseOptions } from '@/lib/layout.shared';
import { AssessmentPreview } from '@/components/course-navigation/assessment-preview';

export default function Preview() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return (
    <DocsLayout
      {...baseOptions()}
      tree={{ name: '课程标志场景预览', children: [] }}
    >
      <DocsPage toc={[]} full>
        <DocsTitle>课程标志 · 场景抽样</DocsTitle>
        <DocsBody>
          <AssessmentPreview />
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}

import { notFound } from 'next/navigation';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { baseOptions } from '@/lib/layout.shared';
import { RelationsDemo } from './relations-demo';

export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return (
    <DocsLayout
      {...baseOptions()}
      tree={{ name: '课程关系演示', children: [] }}
    >
      <DocsPage toc={[]} full>
        <DocsTitle>课程群与课程系列</DocsTitle>
        <DocsBody>
          <RelationsDemo />
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}

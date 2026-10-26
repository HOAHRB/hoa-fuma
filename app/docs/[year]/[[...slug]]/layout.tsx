import { DocsPathMemory } from '@/components/docs/docs-path-memory';
import { SidebarBanner } from '@/components/sidebar/sidebar-banner';
import { baseOptions } from '@/lib/layout.shared';
import { getDocsPageTree, getMajorPageTree, getYearPageTree } from '@/lib/docs';
import { getYearMajorMap } from '@/lib/docs-home';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { isYear } from '@/lib/utils';
import { traceStep } from '@/lib/request-trace';

export default async function Layout(props: {
  children: ReactNode;
  params: Promise<{ year: string; slug?: string[] }>;
}) {
  const { year, slug } = await props.params;

  if (!isYear(year)) {
    return (
      <DocsLayout
        tree={getDocsPageTree()}
        {...baseOptions()}
        sidebar={{
          tabs: false,
          prefetch: false,
        }}
      >
        <DocsPathMemory />
        {props.children}
      </DocsLayout>
    );
  }

  const treeAsRoot = traceStep('docs.layout.tree', () =>
    slug?.[0] ? getMajorPageTree(year, slug[0]) : getYearPageTree(year)
  );
  if (!treeAsRoot) {
    return notFound();
  }

  return (
    <DocsLayout
      tree={treeAsRoot}
      {...baseOptions()}
      sidebar={{
        tabs: false,
        prefetch: false,
        banner: (
          <SidebarBanner
            key="sidebar-banner"
            yearMajorMap={traceStep('docs.layout.majorMap', () =>
              getYearMajorMap()
            )}
            currentYear={year}
          />
        ),
      }}
    >
      <DocsPathMemory />
      {props.children}
    </DocsLayout>
  );
}

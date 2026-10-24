import Link from 'next/link';
import type { CSSProperties } from 'react';
import styles from './course-palette.module.css';
import { MapPin } from 'lucide-react';
import { CurrentCourse } from './current-course';
import { CoursePill } from '@/components/course-pill';
import type { NavigationNode } from '@/lib/course-navigation/presentation';
import type { ViewKey } from '@/lib/course-navigation/schema';

export function Assessment({
  value,
  plain = false,
  compact = false,
}: {
  value: string | null;
  plain?: boolean;
  compact?: boolean;
}) {
  if (!value) return null;
  return plain ? (
    <span
      data-assessment
      className="text-fd-muted-foreground text-xs font-normal whitespace-nowrap"
    >
      {value}
    </span>
  ) : (
    <span
      data-assessment
      className="inline-flex items-center gap-1 font-normal whitespace-nowrap"
    >
      {(
        value
          .match(/^(必修|限选|选修)?(考试|考查)?$/)
          ?.slice(1)
          .filter(Boolean) ?? [value]
      ).map((part) => (
        <CoursePill
          key={part}
          tone={part}
          className={compact ? 'px-1.5 py-0 text-[11px] leading-4' : undefined}
        >
          {part}
        </CoursePill>
      ))}
    </span>
  );
}

export function NavigationGroups({
  groups,
  view,
  currentHref,
  currentCode,
}: {
  groups: NavigationNode[];
  view: ViewKey;
  currentHref: string;
  currentCode?: string;
}) {
  const codes = new Set<string>();
  function collect(nodes: NavigationNode[]) {
    for (const node of nodes) {
      if (node.code) codes.add(node.code);
      collect(node.children);
    }
  }
  collect(groups);
  const orderedCodes = [...codes].sort();
  const hues = new Map(
    orderedCodes.map((code, index) => [
      code,
      (25 + (index * 360) / orderedCodes.length) % 360,
    ])
  );
  function items(node: NavigationNode) {
    return (
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {node.items.map(({ record, assessmentMethod }) => {
          const content = (
            <>
              <span className="flex items-start gap-1.5">
                {record.href === currentHref && (
                  <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                )}
                <span className="min-w-0 break-words">
                  {view === 'byMajor'
                    ? `${record.entryYear} 级`
                    : record.majorName}
                </span>
              </span>
              <Assessment value={assessmentMethod} compact />
            </>
          );
          const classes =
            'flex max-w-full min-w-0 flex-col gap-1 rounded-lg px-2 py-1 text-sm leading-snug';
          return record.href === currentHref ? (
            <span
              key={record.href}
              aria-current="page"
              className={`${classes} bg-fd-primary/10 text-fd-primary`}
            >
              {content}
            </span>
          ) : (
            <Link
              key={record.href}
              href={record.href}
              prefetch={false}
              className={`${classes} text-fd-muted-foreground hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 focus-visible:ring-fd-ring transition-colors focus-visible:ring-2 focus-visible:outline-none`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    );
  }
  function nodeContent(node: NavigationNode) {
    return (
      <>
        {node.children.map((child) =>
          child.kind === 'course' ? (
            <div
              key={child.key}
              data-course-code={child.code}
              data-current={child.code === currentCode}
              style={
                {
                  '--course-hue': hues.get(child.code ?? '') ?? 25,
                } as CSSProperties
              }
              className={`${styles.block} px-2 py-1.5`}
            >
              <div className="mb-1 flex flex-wrap items-baseline gap-x-2 text-xs">
                <span>{child.label}</span>
                <span className="font-mono break-all">{child.code}</span>
                {child.code === currentCode && <CurrentCourse />}
                <Assessment value={child.assessmentMethod} />
              </div>
              {items(child)}
            </div>
          ) : null
        )}
        {items(node)}
      </>
    );
  }
  return groups.map((group) => {
    const compact = group.children.length === 1 ? group.children[0] : undefined;
    return (
      <div key={group.key} className="min-w-0 px-3 py-2">
        <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-medium">{group.label}</h3>
          {compact && (
            <span className="text-fd-muted-foreground text-xs">
              {compact.label}
            </span>
          )}
          <Assessment value={group.assessmentMethod} />
          {compact && <Assessment value={compact.assessmentMethod} />}
        </div>
        {compact ? (
          <div className="space-y-1.5">{nodeContent(compact)}</div>
        ) : (
          <div className="space-y-2">
            {group.children.map((term) => (
              <div
                key={term.key}
                className="grid min-w-0 gap-1 md:grid-cols-[minmax(6rem,auto)_1fr]"
              >
                <div className="flex flex-wrap items-baseline gap-2 py-1 text-xs">
                  <span className="text-fd-muted-foreground">{term.label}</span>
                  <Assessment value={term.assessmentMethod} />
                </div>
                <div className="min-w-0 space-y-1.5">{nodeContent(term)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  });
}

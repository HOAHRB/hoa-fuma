'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Dialog } from '@base-ui/react/dialog';
import { useMediaQuery } from 'fumadocs-core/utils/use-media-query';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Info,
  MapPin,
} from 'lucide-react';
import { BottomDrawerContent } from '@/components/ui/bottom-drawer';
import { COURSE_GITHUB_ORG } from '@/lib/constants';
import type { RelatedCourse, RelationPanel } from '@/lib/course-relations';

type Preview = { onVisit?: (label: string) => void };

function CourseEntry({
  course,
  current,
  currentHref,
  onVisit,
}: {
  course: RelatedCourse;
  current: boolean;
  currentHref: string;
} & Preview) {
  const [open, setOpen] = useState(false);
  const mobile = useMediaQuery('(width < 640px)') === true;
  const headingId = useId();
  const trigger = (
    <span className="flex min-w-0 items-center gap-1.5 text-sm">
      {current && (
        <MapPin aria-label="当前页面课程" className="size-3.5 shrink-0" />
      )}
      <span className="text-start wrap-anywhere">{course.name}</span>
      <ChevronDown
        aria-hidden
        className="text-fd-muted-foreground size-3.5 shrink-0"
      />
    </span>
  );
  const buttonClass = `focus-visible:ring-fd-ring flex max-w-full min-w-0 items-center rounded-md border px-2 py-1.5 transition-colors hover:bg-fd-accent focus-visible:ring-2 focus-visible:outline-none ${current ? 'border-fd-primary/30 bg-fd-primary/10 text-fd-primary' : 'border-fd-border bg-fd-card'}`;
  const linkClass =
    'hover:bg-fd-accent focus-visible:ring-fd-ring flex w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-sm focus-visible:ring-2 focus-visible:outline-none';
  const content = (
    <div className="not-prose flex min-w-0 flex-col gap-2">
      {!mobile && (
        <p id={headingId} className="text-sm font-medium wrap-anywhere">
          {course.name}
        </p>
      )}
      <div>
        <p className="text-fd-muted-foreground mb-1 text-xs">本方案课程</p>
        {course.localOfferings.length ? (
          course.localOfferings.map((offering) => (
            <Link
              key={offering.href}
              href={offering.href}
              prefetch={false}
              aria-current={offering.href === currentHref ? 'page' : undefined}
              onClick={(event) => {
                if (onVisit) {
                  event.preventDefault();
                  onVisit(`本方案 · ${offering.name} · ${offering.code}`);
                }
                setOpen(false);
              }}
              className={linkClass}
            >
              <span className="min-w-0">
                <span className="block wrap-anywhere">{offering.name}</span>
                <span className="text-fd-muted-foreground block text-xs wrap-anywhere">
                  {offering.term} ·{' '}
                  <span className="font-mono">{offering.code}</span>
                </span>
              </span>
              <ArrowRight
                aria-hidden
                className="text-fd-muted-foreground size-4 shrink-0"
              />
            </Link>
          ))
        ) : (
          <p className="text-fd-muted-foreground px-2 py-1 text-xs">
            本方案未开设，可直接查看资料仓库。
          </p>
        )}
      </div>
      <div className="border-fd-border border-t pt-2">
        <a
          href={`https://github.com/${COURSE_GITHUB_ORG}/${encodeURIComponent(course.id)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            if (onVisit) {
              event.preventDefault();
              onVisit(`GitHub · ${COURSE_GITHUB_ORG}/${course.id}`);
            }
            setOpen(false);
          }}
          className={linkClass}
        >
          <span>GitHub 资料仓库</span>
          <ExternalLink aria-hidden className="size-4 shrink-0" />
        </a>
      </div>
    </div>
  );
  return mobile ? (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={buttonClass}>{trigger}</Dialog.Trigger>
      <BottomDrawerContent title={course.name} closeLabel="关闭课程入口">
        {content}
      </BottomDrawerContent>
    </Dialog.Root>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={buttonClass}>{trigger}</PopoverTrigger>
      <PopoverContent
        aria-labelledby={headingId}
        className="bg-fd-popover max-h-[70vh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto p-2"
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

function RelationHelp({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`${label}说明`}
        className="text-fd-muted-foreground hover:text-fd-foreground focus-visible:ring-fd-ring rounded p-0.5 focus-visible:ring-2 focus-visible:outline-none"
      >
        <Info aria-hidden className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="bg-fd-popover w-64 max-w-[calc(100vw-2rem)] px-3 py-2 text-xs">
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function CourseRelations({
  panels,
  currentRepoId,
  currentHref,
  onVisit,
}: {
  panels: RelationPanel[];
  currentRepoId: string;
  currentHref: string;
} & Preview) {
  if (!panels.length) return null;
  return (
    <div className="not-prose my-3 space-y-3">
      {panels.map((panel) => {
        const ordered = panel.kind === 'series';
        const label = ordered ? '课程系列' : '课程群';
        const List = ordered ? 'ol' : 'ul';
        return (
          <section
            key={`${panel.kind}/${panel.id}`}
            aria-label={`${label}：${panel.name}`}
            className="border-fd-border overflow-hidden rounded-lg border"
          >
            <div className="bg-fd-muted/50 border-fd-border flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b px-3 py-2">
              <div className="flex items-center gap-1">
                <h2 className="text-sm font-semibold">{label}</h2>
                <RelationHelp label={label}>
                  {ordered
                    ? '查看此系列的前置和后续课程'
                    : '查看内容相近的其他课程与资料'}
                </RelationHelp>
              </div>
              <span className="text-fd-muted-foreground text-xs wrap-anywhere">
                {panel.name}
              </span>
            </div>
            <List className="flex min-w-0 flex-wrap items-center gap-1.5 p-3">
              {panel.courses.map((course, index) => (
                <li
                  key={course.id}
                  className="flex max-w-full min-w-0 items-center gap-1.5"
                >
                  {ordered && index > 0 && (
                    <ArrowRight
                      aria-hidden
                      className="text-fd-muted-foreground size-3.5 shrink-0"
                    />
                  )}
                  <CourseEntry
                    course={course}
                    current={course.id === currentRepoId}
                    currentHref={currentHref}
                    onVisit={onVisit}
                  />
                </li>
              ))}
            </List>
          </section>
        );
      })}
    </div>
  );
}

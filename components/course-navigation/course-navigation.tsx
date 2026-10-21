'use client';

import { useId, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import type {
  CourseNavigationData,
  NavigationItem,
  ViewKey,
} from '@/lib/course-navigation/schema';

const STORAGE_KEY = 'hoa-course-navigation-view';
const DEFAULT_VIEW: ViewKey = 'byEntryYear';
const OPTIONS = [
  ['byMajor', '按专业'],
  ['byEntryYear', '按入学年份'],
  ['byOpeningTerm', '按开课时间'],
] as const;

let fallbackView: ViewKey = DEFAULT_VIEW;
function getViewSnapshot(): ViewKey {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return OPTIONS.some(([key]) => key === saved)
      ? (saved as ViewKey)
      : DEFAULT_VIEW;
  } catch {
    return fallbackView;
  }
}
function subscribeView(callback: () => void) {
  window.addEventListener('hoa-navigation-view', callback);
  return () => window.removeEventListener('hoa-navigation-view', callback);
}

function saveView(key: ViewKey) {
  fallbackView = key;
  try {
    sessionStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* Keep the in-page choice. */
  }
  window.dispatchEvent(new Event('hoa-navigation-view'));
}

function Assessment({ value }: { value: string | null }) {
  return value ? (
    <span className="text-fd-muted-foreground text-xs font-normal">
      {value}
    </span>
  ) : null;
}

export function CourseNavigation({
  data,
  currentHref,
}: {
  data: CourseNavigationData;
  currentHref: string;
}) {
  const view = useSyncExternalStore<ViewKey>(
    subscribeView,
    getViewSnapshot,
    () => DEFAULT_VIEW
  );
  const [expanded, setExpanded] = useState(true);
  const regionId = useId();

  function selectView(key: ViewKey) {
    saveView(key);
  }

  function renderItems(items: NavigationItem[]) {
    return (
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {items.map((item) => {
          const record = data.records[item.recordIndex];
          const label =
            view === 'byMajor' ? `${record.entryYear} 级` : record.majorName;
          const content = (
            <>
              <span className="flex items-start gap-1.5">
                {record.href === currentHref && (
                  <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                )}
                <span className="min-w-0 break-words">{label}</span>
              </span>
              <Assessment value={item.assessmentMethod} />
            </>
          );
          const classes =
            'flex max-w-full min-w-0 flex-col gap-0.5 rounded-lg px-2 py-1 text-sm leading-snug';
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

  return (
    <section
      aria-label="包含此课程的其他专业"
      className="not-prose border-fd-border my-6 min-w-0 overflow-hidden rounded-lg border text-sm"
    >
      <div className="bg-fd-muted/50 border-fd-border flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="font-semibold">包含此课程的其他专业</h2>
          <Assessment value={data.commonAssessmentMethod} />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <div
            role="group"
            aria-label="索引方式"
            className="flex flex-wrap gap-0.5"
          >
            {OPTIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => selectView(key)}
                className={`focus-visible:ring-fd-ring rounded-lg px-2 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none ${view === key ? 'bg-fd-primary/10 text-fd-primary' : 'text-fd-muted-foreground hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label={expanded ? '折叠导航' : '展开导航'}
            aria-expanded={expanded}
            aria-controls={regionId}
            onClick={() => setExpanded(!expanded)}
            className="text-fd-muted-foreground hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 focus-visible:ring-fd-ring rounded-lg p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {expanded ? (
              <ChevronUp aria-hidden className="size-4" />
            ) : (
              <ChevronDown aria-hidden className="size-4" />
            )}
          </button>
        </div>
      </div>
      <div
        id={regionId}
        hidden={!expanded}
        className="divide-fd-border divide-y"
      >
        {data.views[view].groups.map((group) => (
          <div key={group.key} className="min-w-0 px-3 py-2">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-medium">{group.label}</h3>
              <Assessment value={group.assessmentMethod} />
              {group.secondaryLabel && (
                <span className="text-fd-muted-foreground text-xs">
                  {group.secondaryLabel}
                </span>
              )}
              <Assessment value={group.secondaryAssessmentMethod} />
            </div>
            {group.secondaryLabel ? (
              renderItems(group.items)
            ) : (
              <div className="space-y-1">
                {group.subgroups.map((subgroup) => (
                  <div
                    key={subgroup.key}
                    className="grid min-w-0 gap-1 md:grid-cols-[minmax(6rem,auto)_1fr]"
                  >
                    <div className="flex flex-wrap items-baseline gap-2 py-1 text-xs">
                      <span className="text-fd-muted-foreground">
                        {subgroup.label}
                      </span>
                      <Assessment value={subgroup.assessmentMethod} />
                    </div>
                    {renderItems(subgroup.items)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { ChevronDown, ChevronUp, Info, TriangleAlert } from 'lucide-react';
import { Tooltip } from '@base-ui/react/tooltip';
import { Switch } from '@/components/ui/switch';
import { CourseSelector } from './course-selector';
import { CurrentCourse } from './current-course';
import { Assessment, NavigationGroups } from './navigation-groups';
import { buildCourseNavigationScope } from '@/lib/course-navigation/presentation';
import type {
  CourseNavigationData,
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

const VARIANTS_STORAGE_KEY = 'hoa-course-navigation-include-variants';
let fallbackIncludeVariants = true;
function getVariantsSnapshot() {
  try {
    return sessionStorage.getItem(VARIANTS_STORAGE_KEY) !== 'false';
  } catch {
    return fallbackIncludeVariants;
  }
}
function subscribeVariants(callback: () => void) {
  window.addEventListener('hoa-navigation-variants', callback);
  return () => window.removeEventListener('hoa-navigation-variants', callback);
}
function saveVariants(checked: boolean) {
  fallbackIncludeVariants = checked;
  try {
    sessionStorage.setItem(VARIANTS_STORAGE_KEY, String(checked));
  } catch {
    /* Retain the choice while navigating even when storage is unavailable. */
  }
  window.dispatchEvent(new Event('hoa-navigation-variants'));
}

export function CourseNavigation({
  data: originalData,
  currentHref,
  relatedCourses = [],
  heading = '课程开设情况',
}: {
  data: Pick<CourseNavigationData, 'records'>;
  currentHref: string;
  heading?: string;
  relatedCourses?: {
    code: string;
    name: string;
    data: Pick<CourseNavigationData, 'records'>;
  }[];
}) {
  const includeVariants = useSyncExternalStore(
    subscribeVariants,
    getVariantsSnapshot,
    () => true
  );
  const includeSimilar = includeVariants && relatedCourses.length > 1;
  const [selectedCode, setSelectedCode] = useState<string>();
  const currentCode =
    relatedCourses.find((course) =>
      course.data.records.some((record) => record.href === currentHref)
    )?.code ?? currentHref.split('/').at(-1);
  const view = useSyncExternalStore<ViewKey>(
    subscribeView,
    getViewSnapshot,
    () => DEFAULT_VIEW
  );
  const scope = useMemo(
    () =>
      buildCourseNavigationScope({
        originalData,
        relatedCourses,
        currentCode: currentCode ?? '',
        includeSimilar,
        selectedCode,
        view,
      }),
    [
      originalData,
      relatedCourses,
      currentCode,
      includeSimilar,
      selectedCode,
      view,
    ]
  );
  const { presentation } = scope;
  const selectedVariant = includeSimilar
    ? scope.courses.find(
        (course) => course.code === selectedCode && course.code !== currentCode
      )
    : undefined;
  const [expanded, setExpanded] = useState(true);
  const [tabsOverflow, setTabsOverflow] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const regionId = useId();

  useEffect(() => {
    const tabs = tabsRef.current;
    const container = tabs?.parentElement;
    if (!tabs || !container) return;
    function measure() {
      if (!tabs || !container || container.clientWidth === 0) return;
      const style = getComputedStyle(container);
      const available =
        container.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const buttons = Array.from(tabs.children);
      const required =
        buttons.reduce(
          (width, button) => width + button.getBoundingClientRect().width,
          0
        ) +
        Math.max(0, buttons.length - 1) * 4;
      if (required > 0) setTabsOverflow(required > available);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    for (const button of Array.from(tabs.children)) observer.observe(button);
    measure();
    return () => observer.disconnect();
  }, [includeSimilar, expanded, relatedCourses]);

  function selectView(key: ViewKey) {
    saveView(key);
  }

  return (
    <section
      aria-label={heading}
      className="not-prose border-fd-border my-6 min-w-0 overflow-hidden rounded-lg border text-sm"
    >
      <div className="bg-fd-muted/50 border-fd-border flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="font-semibold">{heading}</h2>
          <Assessment value={scope.assessmentMethod} />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          {relatedCourses.length > 1 && (
            <div className="mr-2 flex items-center gap-1.5">
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  size="sm"
                  checked={includeSimilar}
                  onCheckedChange={(checked) => {
                    saveVariants(checked);
                    setSelectedCode(currentCode);
                  }}
                />
                包括变体课程
              </label>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    aria-label="关联方式说明"
                    className="text-fd-muted-foreground rounded p-1"
                  >
                    <Info aria-hidden className="size-3.5" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Positioner sideOffset={6} className="z-50">
                      <Tooltip.Popup className="bg-fd-popover text-fd-popover-foreground border-fd-border max-w-64 rounded-lg border px-3 py-2 text-xs shadow-md">
                        开启后，也显示映射到同一资料仓库的其他课号。
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
          )}
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
        {includeSimilar && relatedCourses.length > 1 && (
          <div className="bg-fd-muted/30 relative px-3 pt-2">
            <div className={`mb-2 ${tabsOverflow ? '' : 'sm:hidden'}`}>
              <CourseSelector
                courses={scope.courses}
                currentCode={currentCode}
                value={selectedCode ?? currentCode ?? ''}
                onChange={setSelectedCode}
              />
            </div>
            <div
              role="tablist"
              ref={tabsRef}
              aria-hidden={tabsOverflow || undefined}
              inert={tabsOverflow || undefined}
              aria-label="关联课程"
              className={`${tabsOverflow ? 'pointer-events-none invisible absolute top-0 left-3 flex w-max' : 'hidden sm:flex'} flex-nowrap gap-1`}
            >
              <button
                type="button"
                role="tab"
                id={`${regionId}-__all`}
                aria-controls={`${regionId}-records`}
                aria-selected={selectedCode === '__all'}
                onClick={() => setSelectedCode('__all')}
                className={`border-fd-border rounded-t-lg border px-3 py-1 text-sm ${selectedCode === '__all' ? 'bg-fd-background' : 'text-fd-muted-foreground'}`}
              >
                全部
              </button>
              {scope.courses.map((course) => (
                <button
                  type="button"
                  role="tab"
                  key={course.code}
                  id={`${regionId}-${course.code}`}
                  aria-controls={`${regionId}-records`}
                  aria-selected={course.code === (selectedCode ?? currentCode)}
                  onClick={() => setSelectedCode(course.code)}
                  className={`border-fd-border focus-visible:ring-fd-ring relative -mb-px flex shrink-0 flex-col items-start rounded-t-lg border px-3 py-1 text-sm leading-5 focus-visible:ring-2 focus-visible:outline-none ${course.code === (selectedCode ?? currentCode) ? 'bg-fd-background border-b-transparent' : 'bg-fd-muted/40 text-fd-muted-foreground'}`}
                >
                  <span className="flex items-center gap-1.5">
                    {course.name}
                    {course.code === currentCode && <CurrentCourse />}
                  </span>
                  <small className="text-fd-muted-foreground flex items-baseline gap-2 text-xs leading-4">
                    {course.code}
                    <Assessment value={course.assessmentMethod} plain />
                  </small>
                </button>
              ))}
            </div>
          </div>
        )}
        <div
          id={`${regionId}-records`}
          role={includeSimilar ? 'tabpanel' : undefined}
          aria-labelledby={
            includeSimilar
              ? `${regionId}-${selectedCode ?? currentCode}`
              : undefined
          }
          className="divide-fd-border divide-y"
        >
          {selectedVariant && (
            <div
              role="status"
              className="flex items-center gap-2 border-l-2 border-l-amber-500 bg-amber-50 px-3 py-1.5 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-300"
            >
              <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
              <span>
                正在查看变体课程，开课安排与考核要求可能与本专业不同。
              </span>
              <button
                type="button"
                onClick={() => setSelectedCode(currentCode)}
                className="focus-visible:ring-fd-ring ml-auto shrink-0 rounded underline decoration-current/40 underline-offset-4 hover:decoration-current focus-visible:ring-2 focus-visible:outline-none"
              >
                返回原课程
              </button>
            </div>
          )}
          <NavigationGroups
            groups={presentation.groups}
            view={view}
            currentHref={currentHref}
            currentCode={currentCode}
          />
        </div>
      </div>
    </section>
  );
}

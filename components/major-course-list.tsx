'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from 'fumadocs-ui/components/ui/popover';
import { Dialog } from '@base-ui/react/dialog';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  groupMajorCourses,
  selectMajorCourses,
  termOrder,
  type CourseGroup,
  type CourseSort,
  type MajorCourse,
} from '@/lib/major-courses';

const control =
  'border-fd-border bg-fd-background focus-visible:ring-fd-ring min-w-0 w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none';

const pillColors: Record<string, string> = {
  必修: 'bg-[#d2e8ef] text-[#2b5d70] dark:bg-[#27443f] dark:text-[#bcebdc]',
  限选: 'bg-[#e2e8f2] text-[#506683] dark:bg-[#363b52] dark:text-[#cdd0ef]',
  考试: 'bg-[#e3d9ef] text-[#62427e] dark:bg-[#443452] dark:text-[#e5cff8]',
};

const categoryColors: Record<string, string> = {
  专业基础: 'bg-[#e9e2bf] text-[#65591f] dark:bg-[#494424] dark:text-[#eadf9f]',
  专业核心: 'bg-[#efd8ce] text-[#82462f] dark:bg-[#57362d] dark:text-[#f2c4b1]',
  思政: 'bg-[#eed9dc] text-[#793e48] dark:bg-[#542c35] dark:text-[#f5bfc9]',
  体育: 'bg-[#dde8d7] text-[#3d6030] dark:bg-[#284735] dark:text-[#b6e3c4]',
  英语: 'bg-[#dce6f3] text-[#304f79] dark:bg-[#273d59] dark:text-[#bbd8ff]',
};

function Pill({
  children,
  tone,
  category = false,
}: {
  children: ReactNode;
  tone?: string;
  category?: boolean;
}) {
  const palette = category ? categoryColors : pillColors;
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs',
        (tone && Object.hasOwn(palette, tone) && palette[tone]) ||
          'bg-fd-muted text-fd-muted-foreground'
      )}
    >
      {children}
    </span>
  );
}

function MoreFilters({
  count,
  children,
}: {
  count: number;
  children: ReactNode;
}) {
  const triggerContent = (
    <>
      <SlidersHorizontal aria-hidden className="size-4 shrink-0" />
      <span>更多筛选</span>
      {count > 0 && (
        <span className="bg-fd-primary text-fd-primary-foreground flex size-4 items-center justify-center rounded-full text-[10px]">
          {count}
        </span>
      )}
    </>
  );
  const triggerClass =
    control +
    ' flex items-center justify-center gap-1.5 whitespace-nowrap hover:bg-fd-accent';
  return (
    <>
      <div className="col-span-2 hidden md:col-span-1 md:block">
        <Popover>
          <PopoverTrigger className={triggerClass}>
            {triggerContent}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            aria-label="更多筛选"
            className="w-80 max-w-[calc(100vw-2rem)] p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-medium">更多筛选</span>
              <PopoverClose
                aria-label="关闭更多筛选"
                className="focus-visible:ring-fd-ring hover:bg-fd-accent rounded p-1 focus-visible:ring-2"
              >
                <X aria-hidden className="size-4" />
              </PopoverClose>
            </div>
            {children}
          </PopoverContent>
        </Popover>
      </div>
      <div className="col-span-2 md:hidden">
        <Dialog.Root>
          <Dialog.Trigger className={triggerClass}>
            {triggerContent}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Popup className="bg-fd-background text-fd-foreground border-fd-border fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none">
              <div className="mb-5 flex items-center justify-between">
                <Dialog.Title className="font-semibold">更多筛选</Dialog.Title>
                <Dialog.Close
                  aria-label="关闭更多筛选"
                  className="focus-visible:ring-fd-ring hover:bg-fd-accent rounded p-2 focus-visible:ring-2"
                >
                  <X aria-hidden className="size-4" />
                </Dialog.Close>
              </div>
              {children}
              <Dialog.Close
                className={
                  control + ' bg-fd-primary text-fd-primary-foreground mt-5'
                }
              >
                查看结果
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}

export function MajorCourseList({
  courses,
  semesterPage = false,
}: {
  courses: MajorCourse[];
  semesterPage?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [nature, setNature] = useState('');
  const [assessment, setAssessment] = useState('');
  const [term, setTerm] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [offeringCollege, setOfferingCollege] = useState('');
  const [group, setGroup] = useState<CourseGroup>(
    semesterPage ? 'none' : 'term'
  );
  const [sort, setSort] = useState<CourseSort>(semesterPage ? 'name' : 'term');
  const termTitles = new Map(
    courses.map((course) => [course.term, course.termLabel])
  );
  const filtered = selectMajorCourses(courses, {
    query,
    nature,
    assessment,
    term,
    sort,
    courseCategory,
    offeringCollege,
  });
  const groups = groupMajorCourses(filtered, group);
  const values = (key: 'nature' | 'assessment') =>
    [...new Set(courses.map((course) => course[key]))].sort((a, b) =>
      a.localeCompare(b, 'zh-CN')
    );
  const terms = [...new Set(courses.map((course) => course.term))].sort(
    (a, b) => termOrder(a) - termOrder(b) || a.localeCompare(b)
  );
  const categories = [
    ...new Set(
      courses
        .map((course) => course.courseCategory)
        .filter((value): value is string => Boolean(value))
    ),
  ].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const colleges = [
    ...new Set(
      courses
        .map((course) => course.offeringCollege)
        .filter((value): value is string => Boolean(value))
    ),
  ].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const active =
    query || nature || assessment || term || courseCategory || offeringCollege;

  const advancedCount = [courseCategory, offeringCollege, term].filter(
    Boolean
  ).length;
  const hasAdvanced =
    categories.length > 0 || colleges.length > 0 || !semesterPage;
  const advancedFields = (
    <div className="grid min-w-0 gap-4 [&_select]:w-full">
      {' '}
      {categories.length > 0 && (
        <label className="flex min-w-0 flex-col gap-1 text-xs">
          课程类别
          <select
            value={courseCategory}
            onChange={(event) => setCourseCategory(event.target.value)}
            className={control}
          >
            <option value="">全部类别</option>
            {categories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      )}
      {colleges.length > 0 && (
        <label className="flex min-w-0 flex-col gap-1 text-xs">
          开课学院
          <select
            value={offeringCollege}
            onChange={(event) => setOfferingCollege(event.target.value)}
            className={`${control} max-w-full`}
          >
            <option value="">全部学院</option>
            {colleges.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      )}
      {!semesterPage && (
        <label className="flex min-w-0 flex-col gap-1 text-xs">
          开课学期
          <select
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className={control}
          >
            <option value="">全部学期</option>
            {terms.map((value) => (
              <option key={value} value={value}>
                {termTitles.get(value)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
  const activeFilters = [
    { label: '搜索', value: query, clear: () => setQuery('') },
    { label: '性质', value: nature, clear: () => setNature('') },
    { label: '考核', value: assessment, clear: () => setAssessment('') },
    {
      label: '类别',
      value: courseCategory,
      clear: () => setCourseCategory(''),
    },
    {
      label: '学院',
      value: offeringCollege,
      clear: () => setOfferingCollege(''),
    },
    {
      label: '学期',
      value: term ? (termTitles.get(term) ?? term) : '',
      clear: () => setTerm(''),
    },
  ].filter(({ value }) => Boolean(value));

  return (
    <section
      aria-label="专业课程列表"
      className="not-prose my-6 min-w-0 space-y-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-semibold">课程列表</h2>
          <p role="status" className="text-fd-muted-foreground text-sm">
            显示 {filtered.length} / {courses.length} 门次
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:w-72">
          {' '}
          <label className="flex min-w-0 flex-col gap-1 text-xs">
            分类方式
            <select
              value={group}
              onChange={(event) => setGroup(event.target.value as CourseGroup)}
              className={control}
            >
              {!semesterPage && <option value="term">按学期</option>}
              <option value="nature">按必修 / 选修</option>
              <option value="assessment">按考试 / 考查</option>
              {colleges.length > 0 && (
                <option value="offeringCollege">按开课学院</option>
              )}
              {categories.length > 0 && (
                <option value="courseCategory">按课程类别</option>
              )}
              <option value="none">不分类</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs">
            排序方式
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CourseSort)}
              className={control}
            >
              {!semesterPage && <option value="term">学期顺序</option>}
              <option value="name">课程名称</option>
              <option value="credit-desc">学分从高到低</option>
              <option value="credit-asc">学分从低到高</option>
              <option value="hours-desc">学时从多到少</option>
            </select>
          </label>
        </div>
      </div>
      <div className="bg-fd-muted/30 border-fd-border grid grid-cols-2 items-end gap-2 rounded-xl border p-3 md:grid-cols-[minmax(0,1fr)_7rem_8rem_auto]">
        <label className="col-span-2 flex min-w-0 flex-col gap-1 text-xs md:col-span-1">
          搜索课程
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="课程名称或代码"
            className={control}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs">
          课程性质
          <select
            value={nature}
            onChange={(event) => setNature(event.target.value)}
            className={control}
          >
            <option value="">全部性质</option>
            {values('nature').map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs">
          考核方式
          <select
            value={assessment}
            onChange={(event) => setAssessment(event.target.value)}
            className={control}
          >
            <option value="">全部考核方式</option>
            {values('assessment').map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        {hasAdvanced && (
          <MoreFilters count={advancedCount}>{advancedFields}</MoreFilters>
        )}
      </div>
      {activeFilters.length > 0 && (
        <div
          aria-label="已选筛选"
          className="flex flex-wrap items-center gap-2"
        >
          {activeFilters.map(({ label, value, clear }) => (
            <button
              key={label}
              type="button"
              aria-label={`移除${label}：${value}`}
              onClick={clear}
              className="bg-fd-primary/10 text-fd-primary focus-visible:ring-fd-ring flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="min-w-0 break-words">
                {label}：{value}
              </span>
              <X aria-hidden className="size-3 shrink-0" />
            </button>
          ))}
          {active && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setNature('');
                setAssessment('');
                setTerm('');
                setCourseCategory('');
                setOfferingCollege('');
              }}
              className="text-fd-muted-foreground hover:text-fd-foreground focus-visible:ring-fd-ring rounded px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
            >
              清除全部
            </button>
          )}
        </div>
      )}
      {!filtered.length && (
        <p className="text-fd-muted-foreground py-8 text-center text-sm">
          没有符合条件的课程，请调整或清除筛选。
        </p>
      )}
      {groups.map(([key, items]) => (
        <div key={key} className="space-y-2">
          <h3 className="flex flex-wrap items-center gap-2 font-medium break-words">
            {group === 'term' ? termTitles.get(key) : key}
            <span className="text-fd-muted-foreground text-xs font-normal">
              {items.length} 门次
            </span>
          </h3>
          <ul className="grid list-none gap-2 p-0 sm:grid-cols-2">
            {items.map((course) => (
              <li key={course.href} className="min-w-0">
                <Link
                  href={course.href}
                  prefetch={false}
                  className="border-fd-border hover:border-fd-muted-foreground/50 focus-visible:ring-fd-ring flex h-full flex-col gap-2 rounded-xl border bg-white p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none dark:bg-transparent"
                >
                  <span className="font-medium break-words">
                    {course.title}
                  </span>
                  <span className="text-fd-muted-foreground text-xs break-all">
                    {course.code}
                  </span>
                  {course.offeringCollege && (
                    <span className="text-fd-muted-foreground text-xs break-words">
                      {course.offeringCollege}
                    </span>
                  )}
                  {(course.credit !== null || course.hours !== null) && (
                    <span className="text-fd-muted-foreground text-xs">
                      {[
                        course.credit !== null ? `${course.credit} 学分` : null,
                        course.hours !== null ? `${course.hours} 学时` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                  <span className="flex flex-wrap gap-1.5">
                    <Pill tone={course.nature}>{course.nature}</Pill>
                    <Pill tone={course.assessment}>{course.assessment}</Pill>
                    {!semesterPage && group !== 'term' && (
                      <Pill>{course.termLabel}</Pill>
                    )}
                    {course.courseCategory &&
                      course.courseCategory !== '其他' && (
                        <Pill tone={course.courseCategory} category>
                          {course.courseCategory}
                        </Pill>
                      )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

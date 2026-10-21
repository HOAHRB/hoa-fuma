'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  groupMajorCourses,
  selectMajorCourses,
  termLabel,
  termOrder,
  type CourseGroup,
  type CourseSort,
  type MajorCourse,
} from '@/lib/major-courses';

const control =
  'border-fd-border bg-fd-background focus-visible:ring-fd-ring rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none';

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="bg-fd-muted text-fd-muted-foreground rounded-full px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

export function MajorCourseList({ courses }: { courses: MajorCourse[] }) {
  const [query, setQuery] = useState('');
  const [nature, setNature] = useState('');
  const [assessment, setAssessment] = useState('');
  const [term, setTerm] = useState('');
  const [group, setGroup] = useState<CourseGroup>('term');
  const [sort, setSort] = useState<CourseSort>('term');
  const filtered = selectMajorCourses(courses, {
    query,
    nature,
    assessment,
    term,
    sort,
  });
  const groups = groupMajorCourses(filtered, group);
  const values = (key: 'nature' | 'assessment') =>
    [...new Set(courses.map((course) => course[key]))].sort((a, b) =>
      a.localeCompare(b, 'zh-CN')
    );
  const terms = [...new Set(courses.map((course) => course.term))].sort(
    (a, b) => termOrder(a) - termOrder(b) || a.localeCompare(b)
  );
  const active = query || nature || assessment || term;

  return (
    <section
      aria-label="专业课程列表"
      className="not-prose my-6 min-w-0 space-y-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">课程列表</h2>
        <p role="status" className="text-fd-muted-foreground text-sm">
          显示 {filtered.length} / {courses.length} 门次
        </p>
      </div>
      <div className="bg-fd-muted/30 border-fd-border flex flex-wrap items-end gap-3 rounded-xl border p-3">
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs">
          搜索课程
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="课程名称或代码"
            className={control}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
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
        <label className="flex flex-col gap-1 text-xs">
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
        <label className="flex flex-col gap-1 text-xs">
          开课学期
          <select
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className={control}
          >
            <option value="">全部学期</option>
            {terms.map((value) => (
              <option key={value} value={value}>
                {termLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          分类方式
          <select
            value={group}
            onChange={(event) => setGroup(event.target.value as CourseGroup)}
            className={control}
          >
            <option value="term">按学期</option>
            <option value="nature">按必修 / 选修</option>
            <option value="assessment">按考试 / 考查</option>
            <option value="none">不分类</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          排序方式
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as CourseSort)}
            className={control}
          >
            <option value="term">学期顺序</option>
            <option value="name">课程名称</option>
            <option value="credit-desc">学分从高到低</option>
            <option value="credit-asc">学分从低到高</option>
            <option value="hours-desc">学时从多到少</option>
          </select>
        </label>
        {active && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setNature('');
              setAssessment('');
              setTerm('');
            }}
            className={`${control} hover:bg-fd-accent`}
          >
            清除筛选
          </button>
        )}
      </div>
      {!filtered.length && (
        <p className="text-fd-muted-foreground py-8 text-center text-sm">
          没有符合条件的课程，请调整或清除筛选。
        </p>
      )}
      {groups.map(([key, items]) => (
        <div key={key} className="space-y-2">
          <h3 className="flex items-center gap-2 font-medium">
            {group === 'term' ? termLabel(key) : key}
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
                  className="border-fd-border hover:bg-fd-accent/50 focus-visible:ring-fd-ring flex h-full flex-col gap-2 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="font-medium break-words">
                    {course.title}
                  </span>
                  <span className="text-fd-muted-foreground text-xs break-all">
                    {course.code}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <Pill>{course.nature}</Pill>
                    <Pill>{course.assessment}</Pill>
                    <Pill>
                      {course.credit === null
                        ? '学分未标注'
                        : `${course.credit} 学分`}
                    </Pill>
                    <Pill>
                      {course.hours === null
                        ? '学时未标注'
                        : `${course.hours} 学时`}
                    </Pill>
                    {group !== 'term' && <Pill>{course.termLabel}</Pill>}
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

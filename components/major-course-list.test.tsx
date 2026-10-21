// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MajorCourseList } from './major-course-list';
import type { MajorCourse } from '@/lib/major-courses';

const base: MajorCourse = {
  href: '/docs/2024/cs/fresh-autumn/A',
  code: 'A',
  title: '程序设计',
  term: 'fresh-autumn',
  termLabel: '第一学年秋季',
  nature: '必修',
  assessment: '考试',
  credit: 3,
  hours: 48,
};
const courses = [
  base,
  {
    ...base,
    href: '/docs/2024/cs/fresh-spring/B',
    code: 'B',
    title: '实践',
    nature: '选修',
    assessment: '考查',
    credit: 1,
    hours: 16,
    term: 'fresh-spring',
    termLabel: '第一学年春季',
  },
];

describe('major course list interaction', () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  beforeEach(async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    await act(() => root.render(<MajorCourseList courses={courses} />));
  });
  afterEach(async () => {
    await act(() => root.unmount());
    host.remove();
  });
  const select = async (label: string, value: string) => {
    const node = [...host.querySelectorAll('label')]
      .find((item) => item.firstChild?.textContent === label)!
      .querySelector('select')!;
    await act(() => {
      node.value = value;
      node.dispatchEvent(new Event('change', { bubbles: true }));
    });
  };
  const links = () => [...host.querySelectorAll('a')];

  it('filters in combination, explains empty results, and clears filters', async () => {
    expect(links()).toHaveLength(2);
    expect(links()[0].textContent).toContain('3 学分');
    expect(links()[0].textContent).toContain('48 学时');
    await select('课程性质', '选修');
    expect(links()).toHaveLength(1);
    expect(links()[0].getAttribute('href')).toBe(courses[1].href);
    await select('考核方式', '考试');
    expect(links()).toHaveLength(0);
    expect(host.textContent).toContain('没有符合条件的课程');
    await act(() => host.querySelector('button')!.click());
    expect(links()).toHaveLength(2);
  });
  it('changes grouping and sorts courses within each group', async () => {
    await select('分类方式', 'assessment');
    expect(
      [...host.querySelectorAll('h3')].map((node) => node.textContent)
    ).toEqual(['考试1 门次', '考查1 门次']);
    expect(links()[0].textContent).toContain('第一学年秋季');
    await select('分类方式', 'none');
    await select('排序方式', 'credit-asc');
    expect(links()[0].textContent).toContain('实践');
    expect(host.querySelectorAll('h3')).toHaveLength(1);
  });
  it('omits redundant term controls and pills on semester pages', async () => {
    await act(() =>
      root.render(
        <MajorCourseList key="semester" courses={[base]} semesterPage />
      )
    );
    expect(host.textContent).not.toContain('开课学期');
    expect(host.textContent).not.toContain('按学期');
    expect(host.textContent).not.toContain('学期顺序');
    expect(host.textContent).not.toContain(base.termLabel);
    expect(links()).toHaveLength(1);
    await select('分类方式', 'nature');
    expect(host.querySelector('h3')?.textContent).toBe('必修1 门次');
    await select('排序方式', 'credit-desc');
    expect(links()).toHaveLength(1);
  });
});

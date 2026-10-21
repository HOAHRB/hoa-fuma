// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fixture } from '@/lib/course-navigation/fixture';
import { CourseNavigation } from './course-navigation';

describe('navigation interaction', () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    sessionStorage.clear();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => {
    await act(() => root.unmount());
    host.remove();
  });
  const button = (label: string) =>
    [...host.querySelectorAll('button')].find(
      (node) => node.textContent === label
    )!;
  const render = () =>
    act(() =>
      root.render(
        <CourseNavigation
          data={fixture}
          currentHref={fixture.records[0].href}
        />
      )
    );

  it('defaults to entry year when there is no saved choice', async () => {
    await render();
    expect(button('按入学年份').getAttribute('aria-pressed')).toBe('true');
    expect(button('按专业').getAttribute('aria-pressed')).toBe('false');
    expect(host.textContent).toContain('2024 级');
    expect(host.textContent).toContain('2023 级');
  });

  it('changes views, remembers the choice, and restores it on another page', async () => {
    await render();
    await act(() => button('按开课时间').click());
    expect(host.textContent).toContain('2025 年秋季');
    expect(host.textContent).not.toContain('2024 级');
    expect(sessionStorage.getItem('hoa-course-navigation-view')).toBe(
      'byOpeningTerm'
    );
    await act(() => root.unmount());
    root = createRoot(host);
    await render();
    expect(button('按开课时间').getAttribute('aria-pressed')).toBe('true');
  });

  it('rejects an invalid stored view and keeps a complete default view', async () => {
    await render();
    await act(() => button('按开课时间').click());
    await act(() => root.unmount());
    sessionStorage.setItem('hoa-course-navigation-view', 'broken');
    root = createRoot(host);
    await render();
    expect(button('按入学年份').getAttribute('aria-pressed')).toBe('true');
    expect(host.textContent).toContain('2023 级');
  });

  it('folds the full template without losing the selected view', async () => {
    await render();
    const disclosure =
      host.querySelector<HTMLButtonElement>('[aria-controls]')!;
    await act(() => disclosure.click());
    expect(disclosure.getAttribute('aria-expanded')).toBe('false');
    expect(
      document.getElementById(disclosure.getAttribute('aria-controls')!)?.hidden
    ).toBe(true);
    await act(() => disclosure.click());
    expect(disclosure.getAttribute('aria-expanded')).toBe('true');
    expect(host.textContent).toContain('2023 级');
  });

  it('retains older relationships and the current marker in every view', async () => {
    await act(() =>
      root.render(
        <CourseNavigation
          data={fixture}
          currentHref={fixture.records[1].href}
        />
      )
    );
    for (const label of ['按专业', '按入学年份', '按开课时间']) {
      await act(() => button(label).click());
      expect(host.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
      expect(host.querySelectorAll('a')).toHaveLength(1);
      expect(host.querySelector('a')?.getAttribute('href')).toBe(
        fixture.records[0].href
      );
    }
  });

  it('uses sidebar colors for current items, links and selected views', async () => {
    await render();
    expect(host.querySelector('section')?.getAttribute('aria-label')).toBe(
      '包含此课程的其他专业'
    );
    for (const label of ['按专业', '按入学年份', '按开课时间']) {
      await act(() => button(label).click());
      const current = host.querySelector('[aria-current="page"]')!;
      expect(current.classList.contains('bg-fd-primary/10')).toBe(true);
      expect(current.classList.contains('text-fd-primary')).toBe(true);
      expect(current.classList.contains('ring-1')).toBe(false);
      expect(current.classList.contains('font-semibold')).toBe(false);
      expect(
        host.querySelector('a')?.classList.contains('text-fd-muted-foreground')
      ).toBe(true);
      expect(button(label).classList.contains('bg-fd-primary/10')).toBe(true);
      expect(button(label).classList.contains('text-fd-primary')).toBe(true);
    }
  });
});

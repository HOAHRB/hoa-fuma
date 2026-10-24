// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture } from '@/lib/course-navigation/fixture';
import { CourseNavigation } from './course-navigation';

vi.mock('fumadocs-core/utils/use-media-query', () => ({
  useMediaQuery: () => false,
}));

describe('variant course warning', () => {
  let root: ReturnType<typeof createRoot>;
  let host: HTMLDivElement;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      }
    );
    sessionStorage.clear();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  async function click(label: string) {
    const button = [...host.querySelectorAll('button')].find((button) =>
      button.textContent?.includes(label)
    );
    expect(button).toBeDefined();
    await act(() => button!.click());
  }

  it('warns for a different code and clears on return, all variants, or disabling variants', async () => {
    await act(() =>
      root.render(
        <CourseNavigation
          data={fixture}
          currentHref={fixture.records[0].href}
          relatedCourses={[
            { code: 'CS101', name: '课程甲', data: fixture },
            {
              code: 'CS102',
              name: '课程乙',
              data: {
                records: fixture.records.map((record) => ({
                  ...record,
                  href: record.href.replace('CS101', 'CS102'),
                })),
              },
            },
          ]}
        />
      )
    );
    expect(host.querySelector('[role="status"]')).toBeNull();

    await click('课程乙');
    const warning = host.querySelector('[role="status"]');
    expect(warning?.textContent).toContain(
      '正在查看变体课程，开课安排与考核要求可能与本专业不同。'
    );
    expect(warning?.textContent).not.toContain('CS102');
    expect(warning?.textContent).not.toContain('CS101');

    await click('返回原课程');
    expect(host.querySelector('[role="status"]')).toBeNull();
    expect(
      host.querySelector('[role="tab"][aria-selected="true"]')?.textContent
    ).toContain('CS101');

    await click('课程乙');
    await click('全部');
    expect(host.querySelector('[role="status"]')).toBeNull();

    await click('课程乙');
    await act(() =>
      host.querySelector<HTMLButtonElement>('[role="switch"]')!.click()
    );
    expect(host.querySelector('[role="status"]')).toBeNull();
  });
});

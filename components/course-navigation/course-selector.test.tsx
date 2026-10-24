// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CourseSelector } from './course-selector';

const viewport = vi.hoisted(() => ({ mobile: true }));
vi.mock('fumadocs-core/utils/use-media-query', () => ({
  useMediaQuery: () => viewport.mobile,
}));

describe('responsive course selector', () => {
  let root: ReturnType<typeof createRoot>;
  let host: HTMLDivElement;
  afterEach(async () => {
    await act(() => root.unmount());
    host.remove();
  });
  it.each([true, false])('selects a course with mobile=%s', async (mobile) => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    viewport.mobile = mobile;
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    const onChange = vi.fn();
    await act(() =>
      root.render(
        <CourseSelector
          courses={[
            { code: 'A', name: '课程甲', assessmentMethod: '必修考试' },
            { code: 'B', name: '课程乙', assessmentMethod: '限选考查' },
          ]}
          value="A"
          currentCode="A"
          onChange={onChange}
        />
      )
    );
    expect(host.querySelector('[data-assessment]')?.textContent).toBe(
      '必修考试'
    );
    expect(host.querySelector('[data-assessment]')?.className).not.toContain(
      'bg-'
    );
    expect(host.querySelector('[data-assessment]')?.className).not.toContain(
      'rounded-full'
    );
    await act(() =>
      host.querySelector<HTMLButtonElement>('[aria-label="查看课程"]')!.click()
    );
    expect(
      Boolean(document.querySelector('[aria-label="关闭课程选择器"]'))
    ).toBe(mobile);
    const input = document.querySelector('input');
    expect(input).not.toBeNull();
    expect(
      document
        .querySelector('[role="dialog"], [data-slot="popover-content"]')
        ?.querySelector('[data-assessment]')
    ).toBeFalsy();
    if (mobile) expect(document.activeElement).not.toBe(input);
    const choice = [
      ...document.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent === '课程乙B')!;
    expect(choice).toBeDefined();
    await act(() => choice.click());
    expect(onChange).toHaveBeenCalledWith('B');
  });
});

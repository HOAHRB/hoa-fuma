// @vitest-environment jsdom
import { act, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MajorSelector } from './major-selector';

const sidebar = vi.hoisted(() => ({
  mode: 'drawer',
  closeOnRedirect: { current: true },
}));

vi.mock('fumadocs-ui/components/sidebar/base', () => ({
  useSidebar: () => sidebar,
}));
vi.mock('fumadocs-core/link', () => ({
  default: ({
    prefetch: _prefetch,
    ...props
  }: ComponentProps<'a'> & { prefetch?: boolean }) => (
    <a
      {...props}
      onClick={(event) => {
        event.preventDefault();
        props.onClick?.(event);
      }}
    />
  ),
}));

describe('responsive major selector', () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    sidebar.mode = 'drawer';
    sidebar.closeOnRedirect.current = true;
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => {
    await act(() => root.unmount());
    host.remove();
  });
  async function open() {
    await act(() =>
      root.render(
        <MajorSelector
          year="2024"
          currentMajorId="CS"
          options={[
            {
              id: 'CS',
              name: '计算机科学',
              college: '计算机学院',
              studyLevel: 'undergrad',
            },
            {
              id: 'SE',
              name: '软件工程',
              college: '计算机学院',
              studyLevel: 'undergrad',
            },
          ]}
        />
      )
    );
    await act(() => host.querySelector('button')!.click());
    return document.querySelector<HTMLElement>('[role="dialog"]')!;
  }

  it('opens a mobile drawer, filters majors and closes after selection', async () => {
    const dialog = await open();
    expect(dialog.className).toContain('bottom-0');
    expect(dialog.textContent).toContain('选择专业');
    const input = dialog.querySelector('input')!;
    expect(document.activeElement).not.toBe(input);
    await act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, '软件');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const links = [...dialog.querySelectorAll('a')];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/docs/2024/SE',
    ]);
    await act(() => links[0].click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(sidebar.closeOnRedirect.current).toBe(false);
  });

  it('allows closing the drawer without selecting a major', async () => {
    const dialog = await open();
    await act(() =>
      dialog
        .querySelector<HTMLButtonElement>('[aria-label="关闭专业选择器"]')!
        .click()
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(sidebar.closeOnRedirect.current).toBe(true);
  });

  it('retains the desktop popover', async () => {
    sidebar.mode = 'full';
    const dialog = await open();
    expect(dialog.className).toContain('w-[360px]');
    expect(dialog.className).not.toContain('bottom-0');
    expect(dialog.querySelector('[aria-label="关闭专业选择器"]')).toBeNull();
    expect(dialog.querySelectorAll('a')).toHaveLength(2);
  });
});

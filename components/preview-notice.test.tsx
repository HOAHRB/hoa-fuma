// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PreviewNotice } from './preview-notice';
import { PROJECT_URL } from '@/lib/brand';

describe('preview notice', () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  function render() {
    return act(() => {
      root.render(
        <StrictMode>
          <PreviewNotice />
        </StrictMode>
      );
    });
  }

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => callback(performance.now()), 16)
    );
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(() => root.unmount());
    toast.dismiss();
    await act(() => vi.runOnlyPendingTimers());
    host.remove();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows one native notification in Strict Mode and waits for manual dismissal', async () => {
    await render();
    await act(() => vi.advanceTimersByTime(100));
    expect(host.querySelectorAll('[data-sonner-toast]')).toHaveLength(1);
    expect(host.textContent).toContain('预览站点说明');
    expect(host.textContent).toContain('页面访问和搜索服务可能频繁出现');
    expect(host.querySelector('a')?.getAttribute('href')).toBe(PROJECT_URL);
    expect(host.querySelector('a')?.textContent).toBe('GitHub 仓库');

    await act(() => vi.advanceTimersByTime(60_000));
    expect(host.querySelectorAll('[data-sonner-toast]')).toHaveLength(1);
  });

  it('fully removes the notice after closing and does not restore it on rerender', async () => {
    await render();
    await act(() => vi.advanceTimersByTime(100));
    const close = host.querySelector<HTMLButtonElement>(
      'button[aria-label="关闭通知"]'
    )!;
    expect(close).not.toBeNull();
    await act(() => close.click());
    await act(() => vi.advanceTimersByTime(1000));
    expect(host.querySelector('[data-sonner-toast]')).toBeNull();
    expect(host.querySelector('button')).toBeNull();
    expect(host.textContent).not.toContain('预览站点说明');
    expect(host.textContent).not.toContain('查看公告');

    await render();
    await act(() => vi.advanceTimersByTime(60_000));
    expect(host.querySelector('[data-sonner-toast]')).toBeNull();
    expect(host.querySelector('a')).toBeNull();
  });
});

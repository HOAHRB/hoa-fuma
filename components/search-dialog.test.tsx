// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog } from '@base-ui/react/dialog';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationProvider } from './navigation-provider';
import { SearchDialog } from './search-dialog';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
  useParams: () => ({}),
}));

describe('search feedback', () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let resolveRequest: (response: Response) => void;
  let fetchMock: ReturnType<typeof vi.fn>;
  let dialogHandle: ReturnType<typeof Dialog.createHandle>;

  async function renderDialog(open = true) {
    await act(() =>
      root.render(
        <NavigationProvider>
          <SearchDialog
            api="/api/search-feedback-test"
            open={open}
            onOpenChange={() => {}}
            delayMs={100}
            dialogHandle={dialogHandle}
          />
        </NavigationProvider>
      )
    );
  }

  beforeEach(async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.useFakeTimers();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    dialogHandle = Dialog.createHandle();
    await renderDialog();
  });

  afterEach(async () => {
    await act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function dialog() {
    return document.querySelector<HTMLElement>('[role="dialog"]')!;
  }

  async function typeSearch(value: string) {
    const input = dialog().querySelector('input')!;
    await act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  async function sendRequest() {
    await act(() => {
      vi.advanceTimersByTime(100);
    });
    await act(() => vi.dynamicImportSettled());
  }

  async function respond(body: unknown, status = 200) {
    await act(async () => {
      resolveRequest(
        new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      await vi.dynamicImportSettled();
    });
  }

  it('shows feedback during debounce and the request, then displays results', async () => {
    await typeSearch('数学反馈测试');
    expect(dialog().textContent).toContain('正在搜索…');
    expect(dialog().querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(dialog().querySelector('.animate-spin')).not.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(dialog().textContent).not.toContain('未找到相关结果');
    await sendRequest();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(dialog().textContent).toContain('正在搜索…');
    await respond([
      {
        id: 'math',
        type: 'page',
        content: '高等数学',
        url: '/docs/math',
      },
    ]);
    expect(dialog().textContent).toContain('高等数学');
    expect(dialog().textContent).not.toContain('正在搜索…');
    expect(dialog().querySelector('[aria-busy="true"]')).toBeNull();
    expect(dialog().querySelector('.animate-spin')).toBeNull();
  });

  it('does not show a previous empty result message while a new search is pending', async () => {
    await typeSearch('空结果反馈测试');
    await sendRequest();
    await respond([]);
    expect(dialog().textContent).toContain('未找到相关结果');
    await typeSearch('新的反馈测试');
    expect(dialog().textContent).toContain('正在搜索…');
    expect(dialog().textContent).not.toContain('未找到相关结果');
  });

  it('stops the loading feedback and reports a failed request', async () => {
    await typeSearch('失败反馈测试');
    await sendRequest();
    await respond({ error: 'Unavailable' }, 503);
    expect(dialog().textContent).toContain('搜索失败，请稍后重试。');
    expect(dialog().textContent).not.toContain('正在搜索…');
    expect(dialog().textContent).not.toContain('未找到相关结果');
    expect(dialog().querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('retries a failed search when reopened instead of retaining the error', async () => {
    await typeSearch('重新打开失败搜索测试');
    await sendRequest();
    await respond({ error: 'Unavailable' }, 503);
    expect(dialog().textContent).toContain('搜索失败，请稍后重试。');

    await renderDialog(false);
    await sendRequest();
    expect(fetchMock).toHaveBeenCalledOnce();
    await renderDialog();
    expect(dialog().textContent).toContain('正在搜索…');
    expect(dialog().textContent).not.toContain('搜索失败，请稍后重试。');
    await sendRequest();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await respond([
      {
        id: 'recovered',
        type: 'page',
        content: '恢复后的搜索结果',
        url: '/docs/recovered',
      },
    ]);
    expect(dialog().textContent).toContain('恢复后的搜索结果');
    expect(dialog().textContent).not.toContain('搜索失败，请稍后重试。');
  });

  it('keeps successful results when reopened without another request', async () => {
    await typeSearch('重新打开成功搜索测试');
    await sendRequest();
    await respond([
      {
        id: 'cached',
        type: 'page',
        content: '缓存的搜索结果',
        url: '/docs/cached',
      },
    ]);

    await renderDialog(false);
    await renderDialog();
    await sendRequest();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(dialog().textContent).toContain('缓存的搜索结果');
    expect(dialog().textContent).not.toContain('正在搜索…');
  });

  it('clears feedback immediately and ignores late results when the query is cleared', async () => {
    await typeSearch('清空反馈测试');
    await sendRequest();
    await typeSearch('');
    expect(dialog().textContent).not.toContain('正在搜索…');
    await respond([
      {
        id: 'late',
        type: 'page',
        content: '过期搜索结果',
        url: '/docs/late',
      },
    ]);
    expect(dialog().textContent).not.toContain('过期搜索结果');
    expect(dialog().querySelector('[aria-busy="true"]')).toBeNull();
  });
});

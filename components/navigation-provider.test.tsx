// @vitest-environment jsdom
import {
  act,
  Suspense,
  use,
  useEffect,
  useState,
  type ComponentProps,
} from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationProvider, useNavigationRouter } from './navigation-provider';
import Link from './navigation-link';

const { router } = vi.hoisted(() => ({
  router: {
    bfcacheId: 0,
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  },
}));

// Exercise our onNavigate integration without Next's bundler-only router runtime.
vi.mock('next/link', () => ({
  default: ({
    onClick,
    onNavigate,
    scroll: _scroll,
    replace: _replace,
    href,
    ...props
  }: ComponentProps<typeof import('next/link').default>) => (
    <a
      {...props}
      href={String(href)}
      onClick={(event) => {
        onClick?.(event);
        const modified =
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
        const cancelled = event.defaultPrevented;
        event.preventDefault();
        if (cancelled || modified) return;
        onNavigate?.({ preventDefault() {} });
      }}
    />
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/',
  useParams: () => ({}),
}));

describe('navigation feedback', () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let finish: () => void;
  let navigate: (page: Promise<string>) => void;
  let waiting: Promise<string>;

  function Page({ value }: { value: string | Promise<string> }) {
    return <p>{typeof value === 'string' ? value : use(value)}</p>;
  }

  function Controls() {
    const navigation = useNavigationRouter();
    return (
      <>
        <button onClick={() => navigation.push('/docs')}>跳转</button>
        <Link href="/docs" scroll={false}>
          课程
        </Link>
        <Link href="/cancelled" onNavigate={(event) => event.preventDefault()}>
          取消
        </Link>
        <Link href="#section">页内锚点</Link>
      </>
    );
  }

  function App() {
    const [page, setPage] = useState<string | Promise<string>>('原页面');
    useEffect(() => {
      navigate = (value) => setPage(value);
    }, []);
    return (
      <NavigationProvider>
        <Controls />
        <Suspense fallback="加载中">
          <Page value={page} />
        </Suspense>
      </NavigationProvider>
    );
  }

  beforeEach(async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.clearAllMocks();
    waiting = new Promise<string>((resolve) => {
      finish = () => resolve('新页面');
    });
    router.push.mockImplementation(() => navigate(waiting));
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    await act(() => root.render(<App />));
  });

  afterEach(async () => {
    await act(() => root.unmount());
    host.remove();
  });

  it('keeps the current page visible and ends feedback when programmatic navigation commits', async () => {
    expect(host.querySelector('.navigation-progress')).toBeNull();
    await act(() => host.querySelector('button')!.click());
    expect(host.textContent).toContain('原页面');
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      '正在加载页面'
    );
    expect(host.querySelector('.navigation-progress')).not.toBeNull();
    await act(async () => {
      finish();
      await waiting;
    });
    expect(host.textContent).toContain('新页面');
    expect(host.querySelector('.navigation-progress')).toBeNull();
  });

  it('tracks link navigation while preserving scroll options', async () => {
    await act(() => host.querySelector('a')!.click());
    expect(router.push).toHaveBeenCalledWith(
      new URL('/docs', location.href).href,
      { scroll: false }
    );
    expect(host.querySelector('.navigation-progress')).not.toBeNull();
    await act(async () => {
      finish();
      await waiting;
    });
    expect(host.querySelector('.navigation-progress')).toBeNull();
  });

  it('does not start navigation or feedback when onNavigate cancels it', async () => {
    await act(() => host.querySelectorAll('a')[1].click());
    expect(router.push).not.toHaveBeenCalled();
    expect(host.querySelector('.navigation-progress')).toBeNull();
  });

  it('leaves modified clicks to the browser', async () => {
    await act(() => {
      host.querySelector('a')!.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        })
      );
    });
    expect(router.push).not.toHaveBeenCalled();
    expect(host.querySelector('.navigation-progress')).toBeNull();
  });

  it('does not show a page loader for hash-only navigation', async () => {
    await act(() => host.querySelectorAll('a')[2].click());
    expect(router.push).not.toHaveBeenCalled();
    expect(host.querySelector('.navigation-progress')).toBeNull();
  });

  it('waits for the latest destination during consecutive navigations', async () => {
    await act(() => host.querySelector('button')!.click());
    const firstFinish = finish;
    const firstWaiting = waiting;
    waiting = new Promise<string>((resolve) => {
      finish = () => resolve('最终页面');
    });
    await act(() => host.querySelector('button')!.click());
    await act(async () => {
      firstFinish();
      await firstWaiting;
    });
    expect(host.querySelector('.navigation-progress')).not.toBeNull();
    await act(async () => {
      finish();
      await waiting;
    });
    expect(host.textContent).toContain('最终页面');
    expect(host.querySelector('.navigation-progress')).toBeNull();
  });
});

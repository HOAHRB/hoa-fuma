'use client';

import { FrameworkProvider, type Framework } from 'fumadocs-core/framework';
import Image from 'next/image';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useContext, useMemo, useTransition, type ReactNode } from 'react';
import Link from './navigation-link';
import { NavigationContext } from './navigation-context';

export function useNavigationRouter() {
  const router = useRouter();
  const startTransition = useContext(NavigationContext)?.startTransition;

  return useMemo(() => {
    if (!startTransition) return router;
    return {
      ...router,
      push: (...args: Parameters<typeof router.push>) =>
        startTransition(() => router.push(...args)),
      replace: (...args: Parameters<typeof router.replace>) =>
        startTransition(() => router.replace(...args)),
      refresh: () => startTransition(() => router.refresh()),
    };
  }, [router, startTransition]);
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const context = useMemo(
    () => ({ startTransition, router }),
    [startTransition, router]
  );

  return (
    <NavigationContext value={context}>
      <FrameworkProvider
        Link={Link}
        Image={Image as Framework['Image']}
        useRouter={useNavigationRouter}
        usePathname={usePathname}
        useParams={useParams}
      >
        <div role="status" aria-live="polite" aria-atomic="true">
          {pending && (
            <>
              <div className="navigation-progress" aria-hidden="true" />
              <span className="sr-only">正在加载页面…</span>
            </>
          )}
        </div>
        {children}
      </FrameworkProvider>
    </NavigationContext>
  );
}

'use client';

import NextLink from 'next/link';
import { useContext, useRef, type ComponentProps } from 'react';
import { NavigationContext } from './navigation-context';

export default function Link({
  href = '#',
  onClick,
  onNavigate,
  replace,
  scroll,
  ...props
}: Omit<ComponentProps<typeof NextLink>, 'href'> & {
  href?: ComponentProps<typeof NextLink>['href'];
}) {
  const navigation = useContext(NavigationContext);
  const destination = useRef('');

  return (
    <NextLink
      {...props}
      href={href}
      replace={replace}
      scroll={scroll}
      onClick={(event) => {
        destination.current = event.currentTarget.href;
        onClick?.(event);
      }}
      onNavigate={(event) => {
        let cancelled = false;
        onNavigate?.({
          preventDefault() {
            cancelled = true;
            event.preventDefault();
          },
        });
        if (cancelled || !navigation) return;

        const url = new URL(destination.current);
        // Hash-only and current-page links retain Next's native scroll behavior.
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        )
          return;

        event.preventDefault();
        navigation.startTransition(() => {
          navigation.router[replace ? 'replace' : 'push'](url.href, { scroll });
        });
      }}
    />
  );
}

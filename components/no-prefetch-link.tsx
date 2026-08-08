'use client';

import NextLink from 'next/link';
import type { AnchorHTMLAttributes } from 'react';

export function NoPrefetchLink({
  href = '#',
  prefetch: _prefetch,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) {
  return <NextLink href={href} {...props} prefetch={false} />;
}

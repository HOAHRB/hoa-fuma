'use client';

import NextLink from 'next/link';
import type { ComponentProps } from 'react';

export function NoPrefetchLink(props: ComponentProps<typeof NextLink>) {
  return <NextLink {...props} prefetch={false} />;
}

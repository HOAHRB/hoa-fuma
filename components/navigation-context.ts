'use client';

import { createContext, type TransitionStartFunction } from 'react';
import type { useRouter } from 'next/navigation';

export const NavigationContext = createContext<{
  startTransition: TransitionStartFunction;
  router: ReturnType<typeof useRouter>;
} | null>(null);

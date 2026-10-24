'use client';

import type { ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import styles from './selector-drawer.module.css';

export function BottomDrawerContent({
  title,
  closeLabel,
  children,
  footer,
}: {
  title: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className={`${styles.backdrop} fixed inset-0 z-50 bg-black/40`} />
      <Dialog.Popup className={`${styles.popup} bg-fd-background text-fd-foreground border-fd-border fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col gap-3 rounded-t-2xl border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none`}>
        <div className="flex shrink-0 items-center justify-between">
          <Dialog.Title className="font-semibold">{title}</Dialog.Title>
          <Dialog.Close aria-label={closeLabel} className="hover:bg-fd-accent focus-visible:ring-fd-ring rounded-md p-2 focus-visible:ring-2">
            <X aria-hidden className="size-5" />
          </Dialog.Close>
        </div>
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0">{footer}</div>}
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

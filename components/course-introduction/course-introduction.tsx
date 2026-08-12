'use client';

import { BookOpen, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { CourseIntroductionData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getIntroductionView } from './utils';

export function CourseIntroduction({
  data,
  className,
}: {
  data?: CourseIntroductionData;
  className?: string;
}) {
  const introduction = data ?? { zh: '', en: '' };
  const view = getIntroductionView(introduction);
  const [open, setOpen] = useState(false);

  if (view.empty) {
    return (
      <section
        className={cn(
          'not-prose bg-fd-secondary/50 my-6 rounded-lg border px-5 py-4',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <BookOpen className="size-4 shrink-0 text-blue-500" />
          <div>
            <h4 className="text-sm font-semibold">课程介绍暂缺</h4>
            <p className="text-muted-foreground mt-1 text-xs">
              教务系统暂未提供中文或英文课程简介
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        'not-prose bg-fd-secondary/50 my-6 overflow-hidden rounded-lg border',
        className
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="hover:bg-fd-accent/50 flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors"
      >
        <span className="flex min-w-0 items-center gap-3">
          <BookOpen className="size-4 shrink-0 text-blue-500" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">课程介绍</span>
            <span className="text-muted-foreground mt-1 block truncate text-xs">
              {view.preview}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="space-y-4 border-t px-5 py-4">
          {view.showZh && (
            <section>
              <h5 className="text-muted-foreground mb-2 text-xs font-semibold">
                中文简介
              </h5>
              <p className="text-sm leading-7 whitespace-pre-wrap">
                {introduction.zh.trim()}
              </p>
            </section>
          )}
          {view.showEn && (
            <section className={cn(view.showZh && 'border-t pt-4')}>
              <h5 className="text-muted-foreground mb-2 text-xs font-semibold">
                English Introduction
              </h5>
              <p className="text-sm leading-7 whitespace-pre-wrap">
                {introduction.en.trim()}
              </p>
            </section>
          )}
        </div>
      )}
    </section>
  );
}

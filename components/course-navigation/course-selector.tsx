'use client';

import { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { BottomDrawerContent } from '@/components/ui/bottom-drawer';
import { useMediaQuery } from 'fumadocs-core/utils/use-media-query';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import { BookOpenText, Check, ChevronDown, Search, X } from 'lucide-react';
import { Assessment } from './navigation-groups';
import { CurrentCourse } from './current-course';

export function CourseSelector({
  courses,
  value,
  currentCode,
  onChange,
}: {
  courses: { code: string; name: string; assessmentMethod: string | null }[];
  value: string;
  currentCode?: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const isMobile = useMediaQuery('(width < 640px)') === true;
  const selected = courses.find((course) => course.code === value);
  const filtered = courses.filter((course) =>
    `${course.name} ${course.code}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );
  function choose(code: string) {
    onChange(code);
    setOpen(false);
    setQuery('');
  }
  const triggerClass =
    'bg-fd-secondary/50 text-fd-muted-foreground hover:bg-fd-accent focus-visible:ring-fd-ring flex w-full max-w-full items-center gap-3 rounded-lg border px-2 py-1.5 text-start transition-colors focus-visible:ring-2';
  const trigger = (
    <>
      <BookOpenText aria-hidden className="text-fd-primary size-4 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="text-fd-foreground max-w-full text-sm font-medium wrap-anywhere">
          {selected?.name ?? '全部变体'}
        </span>
        {selected && (
          <span className="text-fd-muted-foreground max-w-full font-mono text-xs leading-5 wrap-anywhere">
            {selected.code}
          </span>
        )}
        {selected && selected.code === currentCode && <CurrentCourse />}
      </span>
      {selected && (
        <span className="flex shrink-0 items-center self-center">
          <Assessment value={selected.assessmentMethod} plain />
        </span>
      )}
      <ChevronDown className="text-fd-muted-foreground size-3.5 shrink-0" />
    </>
  );
  const content = (
    <>
      <div className="focus-within:border-fd-primary/50 focus-within:ring-fd-ring flex items-center gap-2 rounded-md border px-2 py-1.5 focus-within:ring-2">
        <Search
          aria-hidden
          className="text-fd-muted-foreground size-4 shrink-0"
        />
        <input
          autoFocus={!isMobile}
          aria-label="搜索课程或课号"
          placeholder="搜索课程或课号"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm"
        />
        {query && (
          <button
            type="button"
            aria-label="清除搜索"
            onClick={() => setQuery('')}
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <button
        type="button"
        aria-pressed={value === '__all'}
        onClick={() => choose('__all')}
        className={`focus-visible:ring-fd-ring hover:bg-fd-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm focus-visible:ring-2 focus-visible:outline-none ${value === '__all' ? 'bg-fd-primary/10 text-fd-primary hover:bg-fd-primary/15' : ''}`}
      >
        <span className="flex-1">全部变体</span>
        {value === '__all' && <Check className="text-fd-primary size-3.5" />}
      </button>
      <div className="fd-scroll-container min-h-0 flex-1 overflow-y-auto overscroll-contain border-t pt-1 sm:max-h-[min(360px,45dvh)]">
        {filtered.map((course) => (
          <button
            key={course.code}
            type="button"
            aria-pressed={value === course.code}
            onClick={() => choose(course.code)}
            className={`focus-visible:ring-fd-ring hover:bg-fd-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start focus-visible:ring-2 focus-visible:outline-none ${value === course.code ? 'bg-fd-primary/10 text-fd-primary hover:bg-fd-primary/15' : ''}`}
          >
            <span className="min-w-0 flex-1 text-sm break-words">
              {course.name}
              <span className="text-fd-muted-foreground flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className="min-w-0 font-mono wrap-anywhere">
                  {course.code}
                </span>
                {course.code === currentCode && <CurrentCourse />}
              </span>
            </span>
            {value === course.code && (
              <Check className="text-fd-primary size-3.5 shrink-0" />
            )}
          </button>
        ))}
        {!filtered.length && (
          <p className="text-fd-muted-foreground py-6 text-center text-sm">
            未找到相关课程
          </p>
        )}
      </div>
    </>
  );
  if (isMobile) {
    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger aria-label="查看课程" className={triggerClass}>
          {trigger}
        </Dialog.Trigger>
        <BottomDrawerContent title="选择课程" closeLabel="关闭课程选择器">
          {content}
        </BottomDrawerContent>
      </Dialog.Root>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label="查看课程" className={triggerClass}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="flex w-[300px] max-w-[calc(100vw-2rem)] flex-col gap-2 p-2">
        {content}
      </PopoverContent>
    </Popover>
  );
}

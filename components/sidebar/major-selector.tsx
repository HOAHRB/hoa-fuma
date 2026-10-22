'use client';

import { useState } from 'react';
import Link from 'fumadocs-core/link';
import { useSidebar } from 'fumadocs-ui/components/sidebar/base';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import {
  BookOpenText,
  ChevronRight,
  ChevronsUpDown,
  Search,
  X,
} from 'lucide-react';
import type { MajorOption } from '@/lib/docs-utils';
import {
  normalizeMajorColleges,
  updateMajorSearch,
  type MajorSearchState,
} from './major-selector-state';

function Highlight({ text, query }: { text: string; query: string }) {
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-yellow-200/60 text-inherit">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function MajorSelector({
  options,
  currentMajorId,
  year,
}: {
  options: MajorOption[];
  currentMajorId?: string;
  year: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState<MajorSearchState>({
    query: '',
    mode: 'grouped',
    modeBeforeSearch: 'grouped',
  });
  const majors = normalizeMajorColleges(options);
  const selected = majors.find((major) => major.id === currentMajorId);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([selected?.college ?? ''])
  );
  const [searchCollapsed, setSearchCollapsed] = useState<Set<string>>(
    new Set()
  );
  const { closeOnRedirect } = useSidebar();
  const query = search.query.trim();
  const filtered = majors.filter((major) =>
    [major.id, major.name, major.college ?? ''].some((text) =>
      text.toLowerCase().includes(query.toLowerCase())
    )
  );
  const groups = new Map<string, MajorOption[]>();
  for (const major of filtered) {
    if (major.college)
      groups.set(major.college, [...(groups.get(major.college) ?? []), major]);
  }
  const ordered = [...groups].sort(([a], [b]) =>
    a === b
      ? 0
      : a === selected?.college
        ? -1
        : b === selected?.college
          ? 1
          : a.localeCompare(b, 'zh')
  );
  function changeQuery(value: string) {
    setSearch((previous) => updateMajorSearch(previous, value));
    setSearchCollapsed(new Set());
  }
  function item(major: MajorOption, nested = false) {
    return (
      <Link
        key={major.id}
        href={`/docs/${year}/${major.id}`}
        prefetch={false}
        aria-current={major.id === currentMajorId ? 'page' : undefined}
        onClick={() => {
          closeOnRedirect.current = false;
          setOpen(false);
          changeQuery('');
        }}
        className={`hover:bg-fd-accent flex items-start gap-2 rounded-md px-2 py-1.5 text-sm ${nested ? 'ps-6' : ''} ${major.id === currentMajorId ? 'bg-fd-accent text-fd-accent-foreground' : ''}`}
      >
        <span className="min-w-0 flex-1 break-words">
          <Highlight text={major.name} query={query} />
          {!nested && major.college && (
            <span className="text-fd-muted-foreground block text-xs">
              <Highlight text={major.college} query={query} />
            </span>
          )}
        </span>
        <span className="text-fd-muted-foreground shrink-0 pt-0.5 font-mono text-[11px]">
          <Highlight text={major.id} query={query} />
        </span>
      </Link>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="bg-fd-secondary/50 hover:bg-fd-accent flex items-center gap-2 rounded-lg border p-2 text-start">
        <BookOpenText className="text-fd-primary size-4 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {selected?.name ?? '选择专业'}
          </span>
          {selected?.college && (
            <span className="text-fd-muted-foreground block truncate text-xs">
              {selected.college}
            </span>
          )}
        </span>
        <ChevronsUpDown className="text-fd-muted-foreground size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 p-2">
        <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
          <Search
            aria-hidden="true"
            className="text-fd-muted-foreground size-4 shrink-0"
          />
          <input
            autoFocus
            aria-label="搜索专业或学院"
            placeholder="搜索专业或学院"
            value={search.query}
            onChange={(event) => changeQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label="清除搜索"
              onClick={() => changeQuery('')}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div
          className="bg-fd-secondary flex gap-1 rounded-md p-0.5"
          role="group"
          aria-label="浏览方式"
        >
          {(['grouped', 'all'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={search.mode === mode}
              onClick={() => setSearch((previous) => ({ ...previous, mode }))}
              className={`flex-1 rounded px-2 py-1 text-xs ${search.mode === mode ? 'bg-fd-background shadow-sm' : 'text-fd-muted-foreground'}`}
            >
              {mode === 'grouped' ? '按学院' : '不分组'}
            </button>
          ))}
        </div>
        <div className="fd-scroll-container max-h-[min(470px,45dvh)] overflow-y-auto">
          {search.mode === 'all' ? (
            filtered.map((major) => item(major))
          ) : (
            <>
              {ordered.map(([college, members]) => {
                const isOpen = query
                  ? !searchCollapsed.has(college)
                  : expanded.has(college);
                return (
                  <div key={college}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => {
                        const setter = query ? setSearchCollapsed : setExpanded;
                        setter((previous) => {
                          const next = new Set(previous);
                          if (next.has(college)) next.delete(college);
                          else next.add(college);
                          return next;
                        });
                      }}
                      className="text-fd-muted-foreground hover:bg-fd-accent flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-start text-xs"
                    >
                      <ChevronRight
                        aria-hidden="true"
                        className={`size-3.5 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                      />
                      <span>
                        <Highlight text={college} query={query} />
                      </span>
                    </button>
                    {isOpen && members.map((major) => item(major, true))}
                  </div>
                );
              })}
              {filtered
                .filter((major) => !major.college)
                .map((major) => item(major))}
            </>
          )}
          {!filtered.length && (
            <p className="text-fd-muted-foreground py-6 text-center text-sm">
              当前年份未找到相关专业
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

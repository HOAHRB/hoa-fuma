import type { MajorOption } from '@/lib/docs-utils';

export type MajorSearchState = {
  query: string;
  mode: 'grouped' | 'all';
  modeBeforeSearch: 'grouped' | 'all';
};

export function updateMajorSearch(
  state: MajorSearchState,
  query: string
): MajorSearchState {
  const active = Boolean(query.trim());
  const wasActive = Boolean(state.query.trim());
  if (active && !wasActive)
    return { query, mode: 'all', modeBeforeSearch: state.mode };
  if (!active && wasActive)
    return { ...state, query, mode: state.modeBeforeSearch };
  return { ...state, query };
}

export function normalizeMajorColleges(options: MajorOption[]): MajorOption[] {
  const counts = new Map<string, number>();
  for (const major of options) {
    if (major.college)
      counts.set(major.college, (counts.get(major.college) ?? 0) + 1);
  }
  return options.map((major) => ({
    ...major,
    college:
      major.college && counts.get(major.college)! > 1
        ? major.college
        : undefined,
  }));
}

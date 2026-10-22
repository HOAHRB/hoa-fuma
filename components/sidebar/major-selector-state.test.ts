import { describe, expect, it } from 'vitest';
import {
  normalizeMajorColleges,
  updateMajorSearch,
  type MajorSearchState,
} from './major-selector-state';

const initial: MajorSearchState = {
  query: '',
  mode: 'grouped',
  modeBeforeSearch: 'grouped',
};
describe('major selector search', () => {
  it('ungroups on first input, preserves manual grouping while typing, and restores the prior mode on clear', () => {
    const searching = updateMajorSearch(initial, '计算');
    expect(searching.mode).toBe('all');
    const manual = { ...searching, mode: 'grouped' as const };
    expect(updateMajorSearch(manual, '计算机').mode).toBe('grouped');
    expect(updateMajorSearch(manual, '').mode).toBe('grouped');
  });
  it('restores an initially ungrouped view and treats whitespace as empty', () => {
    const searching = updateMajorSearch({ ...initial, mode: 'all' }, '010');
    expect(
      updateMajorSearch({ ...searching, mode: 'grouped' }, '  ').mode
    ).toBe('all');
    expect(updateMajorSearch(initial, ' ').mode).toBe('grouped');
  });
  it('suppresses only singleton colleges with exactly the same major name before filtering', () => {
    const options = normalizeMajorColleges([
      { id: '1', name: '自动化', college: '航天学院', studyLevel: 'undergrad' },
      { id: '2', name: '飞行器', college: '航天学院', studyLevel: 'undergrad' },
      { id: '3', name: '实验班', college: '实验学院', studyLevel: 'undergrad' },
      { id: '4', name: '英才班', college: '英才班', studyLevel: 'undergrad' },
      {
        id: '5',
        name: '航天学院',
        college: '航天学院',
        studyLevel: 'undergrad',
      },
      { id: '6', name: '无学院专业', studyLevel: 'undergrad' },
    ]);
    expect(options[2].college).toBe('实验学院');
    expect(options[3].college).toBeUndefined();
    expect(options[4].college).toBe('航天学院');
    expect(options[5].college).toBeUndefined();
    expect(options.filter((major) => major.name === '自动化')[0].college).toBe(
      '航天学院'
    );
  });
});

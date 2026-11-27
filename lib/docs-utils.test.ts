import { describe, expect, it } from 'vitest';
import {
  computeYearMajorMap,
  selectYearMajor,
  type MajorOption,
} from './docs-utils';

describe('year switching', () => {
  const current: MajorOption = {
    id: 'CS',
    name: '计算机科学',
    college: '计算机学院',
    studyLevel: 'undergrad',
  };
  const first: MajorOption = {
    id: 'ME',
    name: '机械工程',
    college: '机电学院',
    studyLevel: 'undergrad',
  };
  const sameCollege = { ...current, id: 'SE', name: '软件工程' };
  const sameName = { ...current, id: 'CS2', college: '新学院' };
  const sameCode = { ...current, name: '计算机科学与技术', college: '新学院' };

  it.each([
    { options: [first, sameCollege, sameName, sameCode], expected: sameCode },
    { options: [first, sameCollege, sameName], expected: sameName },
    { options: [first, sameCollege], expected: sameCollege },
    { options: [first], expected: first },
    { options: [], expected: undefined },
  ])(
    'selects the best available match: $expected.id',
    ({ options, expected }) => {
      expect(selectYearMajor(options, 'undergrad', current)).toBe(expected);
    }
  );

  it('keeps the study level even when another level matches the major', () => {
    expect(
      selectYearMajor(
        [{ ...current, studyLevel: 'postgrad' }, first],
        'undergrad',
        current
      )
    ).toBe(first);
    expect(
      selectYearMajor(
        [{ ...current, studyLevel: 'postgrad' }],
        'undergrad',
        current
      )
    ).toBeUndefined();
  });

  it('uses the first option when the current major or college is unknown', () => {
    expect(selectYearMajor([first, sameCode], 'undergrad')).toBe(first);
    expect(
      selectYearMajor([first, sameCode], 'undergrad', {
        ...current,
        id: 'unknown',
        name: '未知专业',
        college: undefined,
      })
    ).toBe(first);
  });
});

describe('major navigation index', () => {
  it('includes only available majors and carries college metadata for nested and direct entries', () => {
    const result = computeYearMajorMap(
      [
        { slugs: ['2023', '01'] },
        { slugs: ['2023', '02'] },
        { slugs: ['2024', 'missing'] },
      ],
      {
        '2023': {
          '01': { name: '自动化', school_name: '航天学院' },
          group: {
            name: '学科',
            school_name: '计算学部',
            study_level: 'postgrad',
            majors: [{ name: '计算机', major_ID: '02' }],
          },
          absent: { name: '未开设' },
        },
      }
    );
    expect(result['2023']).toEqual([
      {
        id: '01',
        name: '自动化',
        college: '航天学院',
        studyLevel: 'undergrad',
      },
      { id: '02', name: '计算机', college: '计算学部', studyLevel: 'postgrad' },
    ]);
    expect(result['2024'][0]).toEqual({
      id: 'missing',
      name: 'missing',
      studyLevel: 'undergrad',
    });
  });
});

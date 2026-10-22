import { describe, expect, it } from 'vitest';
import { computeYearMajorMap } from './docs-utils';

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

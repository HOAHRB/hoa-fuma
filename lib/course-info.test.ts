import { describe, expect, it } from 'vitest';
import { courseInfoSchema } from './course-info';

const validCourse = {
  credit: 3,
  assessmentMethod: 'Exam',
  courseNature: 'Required',
  hourDistribution: {
    theory: 32,
    lab: 8,
    practice: 0,
    exercise: 0,
    computer: 0,
    tutoring: 0,
  },
  gradingScheme: [{ name: 'Final', percent: 100 }],
};

describe('courseInfoSchema', () => {
  it('accepts complete course metadata', () => {
    expect(courseInfoSchema.parse(validCourse)).toEqual(validCourse);
  });

  it('rejects malformed grading data and incomplete hour distributions', () => {
    expect(
      courseInfoSchema.safeParse({
        ...validCourse,
        gradingScheme: [{ name: 'Final', percent: '100' }],
      }).success
    ).toBe(false);
    expect(
      courseInfoSchema.safeParse({
        ...validCourse,
        hourDistribution: { theory: 32 },
      }).success
    ).toBe(false);
  });
});

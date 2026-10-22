import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readFile } = vi.hoisted(() => ({ readFile: vi.fn() }));

vi.mock('node:fs', () => ({
  existsSync: () => true,
  readFileSync: readFile,
}));
vi.mock('@/lib/docs-content', () => ({
  getDocsYearDir: () => '/docs/2025',
  isSafePathSegment: () => true,
}));

const course = {
  credit: 2,
  assessmentMethod: '考试',
  courseNature: '必修',
  hourDistribution: {
    theory: 32,
    lab: 0,
    practice: 0,
    exercise: 0,
    computer: 0,
    tutoring: 0,
  },
  gradingScheme: [],
};

beforeEach(() => {
  vi.resetModules();
  readFile.mockReset();
});

describe('course frontmatter', () => {
  it.each([
    { courseCategory: '专业课', offeringCollege: '计算机学院' },
    { courseCategory: '专业课' },
    { offeringCollege: '计算机学院' },
    {},
  ])('preserves optional metadata: %j', async (fields) => {
    readFile.mockReturnValue(
      `---\n${JSON.stringify({ course: { ...course, ...fields } })}\n---\n`
    );
    const { getDocsCourse } = await import('./course-frontmatter');
    expect(getDocsCourse(['2025', 'cs', 'course'])).toEqual({
      ...course,
      ...fields,
      totalHours: 0,
      introduction: { zh: '', en: '' },
    });
  });
});

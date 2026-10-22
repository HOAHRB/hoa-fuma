import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CourseInfoData } from '@/lib/types';
import { CourseInfo } from './course-info';

const { asMarkdown } = vi.hoisted(() => ({ asMarkdown: vi.fn(() => false) }));
vi.mock('fumadocs-core/server', () => ({ asMarkdown }));

const course: CourseInfoData = {
  credit: 2,
  courseNature: '必修',
  assessmentMethod: '考试',
  hourDistribution: {
    theory: 0,
    lab: 0,
    practice: 0,
    exercise: 0,
    computer: 0,
    tutoring: 0,
  },
  totalHours: 32,
  gradingScheme: [],
  introduction: { zh: '', en: '' },
};

describe('course information', () => {
  beforeEach(() => asMarkdown.mockReturnValue(false));

  it.each([false, true])(
    'shows category and college (Markdown: %s)',
    (markdown) => {
      asMarkdown.mockReturnValue(markdown);
      const data = {
        ...course,
        courseCategory: '专业课',
        offeringCollege: '计算机科学与技术学院',
      };
      const output = markdown
        ? CourseInfo({ data })
        : renderToStaticMarkup(<CourseInfo data={data} />);
      expect(output).toContain('课程类别');
      expect(output).toContain('专业课');
      expect(output).toContain('开课学院');
      expect(output).toContain('计算机科学与技术学院');
    }
  );

  it.each([false, true])(
    'hides missing or blank fields (Markdown: %s)',
    (markdown) => {
      asMarkdown.mockReturnValue(markdown);
      for (const fields of [
        {},
        { courseCategory: '', offeringCollege: '  ' },
      ]) {
        const data = { ...course, ...fields };
        const output = markdown
          ? CourseInfo({ data })
          : renderToStaticMarkup(<CourseInfo data={data} />);
        expect(output).not.toContain('课程类别');
        expect(output).not.toContain('开课学院');
        expect(output).toContain('必修');
      }
    }
  );
});

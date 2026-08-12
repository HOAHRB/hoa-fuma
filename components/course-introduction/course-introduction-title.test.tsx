import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CourseIntroductionTitle } from './course-introduction-title';

describe('CourseIntroductionTitle', () => {
  it('shows the teaching-system source beside the title', () => {
    const markup = renderToStaticMarkup(<CourseIntroductionTitle />);

    expect(markup).toContain('课程介绍');
    expect(markup).toContain('（内容来自教务系统）');
  });
});

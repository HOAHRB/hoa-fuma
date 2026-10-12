import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { fixture } from '@/lib/course-navigation/fixture';
import { CourseNavigation } from './course-navigation';

describe('course navigation', () => {
  it('renders compact groups, per-link assessment and a non-link current item', () => {
    const html = renderToStaticMarkup(
      <CourseNavigation data={fixture} currentHref={fixture.records[0].href} />
    );
    expect(html).toContain('按专业');
    expect(html).toContain('考试');
    expect(html).toContain('考查');
    expect(html.match(/大二上/g)).toHaveLength(1);
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain(`href="${fixture.records[0].href}"`);
    expect(html).toContain(`href="${fixture.records[1].href}"`);
  });
  it('shows a singleton and promotes assessment to the total header', () => {
    const data = structuredClone(fixture);
    data.commonAssessmentMethod = '考试';
    data.records = [data.records[0]];
    data.views.byMajor.groups[0].items = [
      { recordIndex: 0, assessmentMethod: null as never },
    ];
    const html = renderToStaticMarkup(
      <CourseNavigation data={data} currentHref={data.records[0].href} />
    );
    expect(html).toContain('相关课程导航');
    expect(html).toContain('2024 级');
    expect(html.match(/考试/g)).toHaveLength(1);
  });
});

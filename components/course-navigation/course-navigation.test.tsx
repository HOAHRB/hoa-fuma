import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { fixture } from '@/lib/course-navigation/fixture';
import { CourseNavigation } from './course-navigation';
import { Assessment, NavigationGroups } from './navigation-groups';
import { buildCourseNavigationScope } from '@/lib/course-navigation/presentation';

describe('course navigation', () => {
  it('places the compact semester before the group pills', () => {
    const rows = fixture.records.map((record, index) => ({
      ...record,
      entryYear: String(2025 - index),
      relativeTerm: '大一上',
      courseNature: index === 0 ? '必修' : '限选',
    }));
    const scope = buildCourseNavigationScope({
      originalData: { records: rows },
      relatedCourses: [],
      currentCode: 'CS101',
      includeSimilar: false,
      view: 'byEntryYear',
    });
    const html = renderToStaticMarkup(
      <NavigationGroups
        groups={scope.presentation.groups}
        view="byEntryYear"
        currentHref={rows[0].href}
      />
    );
    expect(html.indexOf('大一上')).toBeLessThan(
      html.indexOf('data-assessment')
    );
    expect(html.indexOf('data-assessment')).toBeLessThan(
      html.indexOf('>必修</span>')
    );
  });
  it('promotes the complete combination once and renders two separately colored pills', () => {
    const data = {
      records: fixture.records.map((record) => ({
        ...record,
        assessmentMethod: '考试',
        courseNature: '必修',
      })),
    };
    const html = renderToStaticMarkup(
      <CourseNavigation data={data} currentHref={data.records[0].href} />
    );
    expect(html.match(/>必修<\/span>/g)).toHaveLength(1);
    expect(html.match(/>考试<\/span>/g)).toHaveLength(1);
    expect(html).toContain('bg-[#d2e8ef]');
    expect(html).toContain('dark:bg-[#27443f]');
    expect(html).toContain('bg-[#e3d9ef]');
    expect(html).toContain('dark:bg-[#443452]');
    expect(html).toContain('rounded-full');
  });
  it.each(['考试', '考查', '必修', '其他考核'])(
    'renders one pill for a partial or unknown label: %s',
    (value) => {
      const html = renderToStaticMarkup(<Assessment value={value} />);
      expect(html.match(/rounded-full/g)).toHaveLength(1);
      expect(html).toContain(value);
    }
  );
  it('keeps labels on nested surfaces plain without pill backgrounds', () => {
    const html = renderToStaticMarkup(<Assessment value="限选考查" plain />);
    expect(html).toContain('限选考查');
    expect(html).not.toContain('bg-');
    expect(html).not.toContain('rounded-full');
  });
  it('renders compact groups, per-link assessment and a non-link current item', () => {
    const html = renderToStaticMarkup(
      <CourseNavigation data={fixture} currentHref={fixture.records[0].href} />
    );
    expect(html).toContain('按专业');
    expect(html).toContain('考试');
    expect(html).toContain('考查');
    expect(html.match(/大二上/g)).toHaveLength(2);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>按入学年份<\/button>/);
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain(`href="${fixture.records[0].href}"`);
    expect(html).toContain(`href="${fixture.records[1].href}"`);
  });
  it('shows a singleton and promotes assessment to the total header', () => {
    const data = structuredClone(fixture);
    data.commonAssessmentMethod = '考试';
    data.records = [data.records[0]];
    data.views.byEntryYear.groups = [data.views.byEntryYear.groups[0]];
    data.views.byEntryYear.groups[0].assessmentMethod = null;
    const html = renderToStaticMarkup(
      <CourseNavigation data={data} currentHref={data.records[0].href} />
    );
    expect(html).toContain('课程开设情况');
    expect(html).not.toContain('相关课程导航');
    expect(html).toContain('2024 级');
    expect(html.match(/考试/g)).toHaveLength(1);
  });
});

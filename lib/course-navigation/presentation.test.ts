import { describe, expect, it } from 'vitest';
import { fixture } from './fixture';
import {
  buildNavigationPresentation,
  buildCourseNavigationScope,
  type NavigationNode,
} from './presentation';

const records = (code: string, method: string | null) =>
  fixture.records.map((record) => ({
    ...record,
    entryYear: '2024',
    code,
    courseName: code,
    assessmentMethod: method,
    href: record.href.replace('CS101', code),
  }));

describe('shared navigation presentation', () => {
  it.each(
    ['必修', '限选', '选修'].flatMap((nature) =>
      ['考试', '考查'].map((method) => [nature, method])
    )
  )(
    'promotes the whole %s%s combination and suppresses duplicates',
    (nature, method) => {
      const rows = records('A', method).map((row) => ({
        ...row,
        courseNature: nature,
      }));
      for (const view of ['byMajor', 'byEntryYear', 'byOpeningTerm'] as const) {
        for (const groupByCode of [false, true]) {
          const result = buildNavigationPresentation(rows, view, groupByCode);
          expect(result.commonAssessmentMethod).toBe(`${nature}${method}`);
          const check = (nodes: NavigationNode[]) => {
            for (const node of nodes) {
              expect(node.assessmentMethod).toBeNull();
              expect(
                node.items.every((item) => item.assessmentMethod === null)
              ).toBe(true);
              check(node.children);
            }
          };
          check(result.groups);
        }
      }
    }
  );
  it.each([
    ['必修', '考试', '必修', '考查'],
    ['必修', '考试', '限选', '考试'],
    ['选修', '考查', null, '考查'],
  ])(
    'promotes each shared dimension independently: %s%s / %s%s',
    (natureA, methodA, natureB, methodB) => {
      const rows = records('A', methodA).map((row, index) => ({
        ...row,
        courseNature: index === 0 ? natureA : natureB,
        assessmentMethod: index === 0 ? methodA : methodB,
      }));
      const result = buildNavigationPresentation(rows, 'byEntryYear', true);
      const sharedNature = natureA === natureB ? natureA : null;
      const sharedMethod = methodA === methodB ? methodA : null;
      expect(result.commonAssessmentMethod).toBe(
        [sharedNature, sharedMethod].filter(Boolean).join('') || null
      );
      const course = result.groups[0].children[0].children[0];
      expect(course.assessmentMethod).toBeNull();
      expect(course.items.map((item) => item.assessmentMethod).sort()).toEqual(
        [
          [sharedNature ? null : natureA, sharedMethod ? null : methodA]
            .filter(Boolean)
            .join('') || null,
          [sharedNature ? null : natureB, sharedMethod ? null : methodB]
            .filter(Boolean)
            .join('') || null,
        ].sort()
      );
    }
  );
  it('promotes dimensions at different levels without repeating inherited labels', () => {
    const rows = [
      { ...records('A', '考试')[0], entryYear: '2024', courseNature: '必修' },
      { ...records('A', '考查')[0], entryYear: '2025', courseNature: '必修' },
    ];
    const result = buildNavigationPresentation(rows, 'byEntryYear', true);
    expect(result.commonAssessmentMethod).toBe('必修');
    expect(result.groups.map((group) => group.assessmentMethod)).toEqual([
      '考查',
      '考试',
    ]);
    for (const group of result.groups) {
      const term = group.children[0];
      const course = term.children[0];
      expect(term.assessmentMethod).toBeNull();
      expect(course.assessmentMethod).toBeNull();
      expect(course.items[0].assessmentMethod).toBeNull();
    }
  });
  it('does not promote a dimension with missing metadata', () => {
    const rows = records('A', '考试').map((row, index) => ({
      ...row,
      courseNature: index === 0 ? '必修' : null,
    }));
    const result = buildNavigationPresentation(rows, 'byEntryYear', true);
    expect(result.commonAssessmentMethod).toBe('考试');
    const course = result.groups[0].children[0].children[0];
    expect(course.items.map((item) => item.assessmentMethod).sort()).toEqual(
      ['必修', null].sort()
    );
  });
  it('recomputes combined labels for the heading, tabs and selector when variants broaden the scope', () => {
    const a = {
      code: 'A',
      name: '甲',
      data: {
        records: records('A', '考试').map((row) => ({
          ...row,
          courseNature: '必修',
        })),
      },
    };
    const b = {
      code: 'B',
      name: '乙',
      data: {
        records: records('B', '考试').map((row) => ({
          ...row,
          courseNature: '限选',
        })),
      },
    };
    for (const includeSimilar of [false, true]) {
      for (const selectedCode of ['A', 'B', '__all']) {
        const result = buildCourseNavigationScope({
          originalData: a.data,
          relatedCourses: [a, b],
          currentCode: 'A',
          includeSimilar,
          selectedCode,
          view: 'byEntryYear',
        });
        expect(result.assessmentMethod).toBe(
          includeSimilar ? '考试' : '必修考试'
        );
        expect(result.courses.map((course) => course.assessmentMethod)).toEqual(
          ['必修考试', '限选考试']
        );
      }
    }
  });
  it('sorts opening terms by calendar order, including summer', () => {
    const rows = [
      '2025 年春季',
      '2025 年秋季',
      '2026 年春季',
      '2025 年夏季',
    ].map((openingTerm) => ({ ...records('A', '考试')[0], openingTerm }));
    expect(
      buildNavigationPresentation(rows, 'byOpeningTerm').groups.map(
        (group) => group.label
      )
    ).toEqual(['2026 年春季', '2025 年秋季', '2025 年夏季', '2025 年春季']);
  });
  it('keeps the heading scoped to all enabled courses while entries describe each course', () => {
    const a = { code: 'A', name: 'A', data: { records: records('A', '考试') } };
    const b = { code: 'B', name: 'B', data: { records: records('B', '考查') } };
    const mixed = records('C', '考试');
    mixed[1].assessmentMethod = null;
    const relatedCourses = [
      a,
      b,
      { code: 'C', name: 'C', data: { records: mixed } },
    ];
    for (const selectedCode of ['A', 'B', 'C', '__all']) {
      const result = buildCourseNavigationScope({
        originalData: a.data,
        relatedCourses,
        currentCode: 'A',
        includeSimilar: true,
        selectedCode,
        view: 'byEntryYear',
      });
      expect(result.assessmentMethod).toBeNull();
      expect(result.courses.map((course) => course.assessmentMethod)).toEqual([
        '考试',
        '考查',
        null,
      ]);
    }
    const closed = buildCourseNavigationScope({
      originalData: a.data,
      relatedCourses,
      currentCode: 'A',
      includeSimilar: false,
      selectedCode: 'B',
      view: 'byEntryYear',
    });
    expect(closed.assessmentMethod).toBe('考试');
    expect(closed.presentation.commonAssessmentMethod).toBe('考试');
    const uniform = buildCourseNavigationScope({
      originalData: a.data,
      relatedCourses: [a, { ...b, data: a.data }],
      currentCode: 'A',
      includeSimilar: true,
      selectedCode: 'B',
      view: 'byEntryYear',
    });
    expect(uniform.assessmentMethod).toBe('考试');
  });
  it('promotes a common assessment in both single and all-course views', () => {
    for (const grouped of [false, true]) {
      const result = buildNavigationPresentation(
        records('A', '考试'),
        'byEntryYear',
        grouped
      );
      expect(result.commonAssessmentMethod).toBe('考试');
      const assertSuppressed = (nodes: NavigationNode[]) => {
        for (const node of nodes) {
          expect(node.assessmentMethod).toBeNull();
          expect(
            node.items.every((item) => item.assessmentMethod === null)
          ).toBe(true);
          assertSuppressed(node.children);
        }
      };
      assertSuppressed(result.groups);
    }
  });
  it('recomputes assessment after broadening and keeps course code as the last group', () => {
    const a = records('A', '考试');
    const b = records('B', '考查');
    const result = buildNavigationPresentation(
      [...a, ...b],
      'byEntryYear',
      true
    );
    expect(result.commonAssessmentMethod).toBeNull();
    const primary = result.groups[0];
    expect(primary.label).toBe('2024 级');
    expect(primary.assessmentMethod).toBeNull();
    const term = primary.children[0];
    expect(term.label).toBe('大二上');
    expect(
      term.children.map((node) => [node.code, node.assessmentMethod])
    ).toEqual([
      ['A', '考试'],
      ['B', '考查'],
    ]);
    expect(
      term.children.every((node) =>
        node.items.every((item) => item.assessmentMethod === null)
      )
    ).toBe(true);
    expect(
      buildNavigationPresentation(a, 'byEntryYear').commonAssessmentMethod
    ).toBe('考试');
  });
  it('does not promote an assessment over missing or differing records', () => {
    const rows = records('A', '考试');
    rows[1].assessmentMethod = null;
    const result = buildNavigationPresentation(rows, 'byEntryYear', true);
    expect(result.commonAssessmentMethod).toBeNull();
    const course = result.groups[0].children[0].children[0];
    expect(course.assessmentMethod).toBeNull();
    expect(course.items.map((item) => item.assessmentMethod).sort()).toEqual(
      ['考试', null].sort()
    );
  });
});

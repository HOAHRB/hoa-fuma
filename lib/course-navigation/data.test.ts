import { describe, expect, it } from 'vitest';
import { parseNavigationArtifact, selectCourseNavigation } from './schema';

import { fixture } from './fixture';

describe('navigation data boundary', () => {
  it('keeps every relationship exactly once in each fixture view', () => {
    for (const view of Object.values(fixture.views)) {
      const references = view.groups
        .flatMap((group) => [
          ...group.items,
          ...group.subgroups.flatMap((subgroup) => subgroup.items),
        ])
        .map((item) => item.recordIndex)
        .sort();
      expect(references).toEqual(fixture.records.map((_, index) => index));
    }
  });
  it('selects course identity case-insensitively and rejects non-course routes', () => {
    const artifact = parseNavigationArtifact({
      version: 1,
      courses: { CS101: fixture },
    });
    expect(
      selectCourseNavigation(artifact, [
        '2024',
        'A',
        'sophomore-autumn',
        'cs101',
      ])
    ).toEqual(fixture);
    expect(selectCourseNavigation(artifact, ['2024', 'A'])).toBeUndefined();
    expect(
      selectCourseNavigation(artifact, [
        '2024',
        'A',
        'general-knowledge',
        'CS101',
      ])
    ).toBeUndefined();
  });
  it('fails safely for broken versions, links and record references', () => {
    expect(
      parseNavigationArtifact({ version: 2, courses: {} }).courses
    ).toEqual({});
    const invalid = structuredClone(fixture);
    invalid.views.byMajor.groups[0].items[0].recordIndex = 100;
    expect(
      parseNavigationArtifact({ version: 1, courses: { CS101: invalid } })
        .courses
    ).toEqual({});
    const unsafe = structuredClone(fixture);
    unsafe.records[0].href = 'https://example.com';
    expect(
      parseNavigationArtifact({ version: 1, courses: { CS101: unsafe } })
        .courses
    ).toEqual({});
  });
});

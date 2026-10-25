import { expect, it } from 'vitest';
import {
  buildRelationIndex,
  buildRelationPanels,
  parseRelationArtifact,
} from './course-relations';

const artifact = {
  version: 1,
  groups: {
    Related: { name: '相关课程', members: ['B', 'A'] },
    Another: { name: '另一课程群', members: ['A', 'C'] },
  },
  series: { Sequence: { name: '系列', members: ['C', 'A', 'B'] } },
  names: { A: '共享课程 A', B: '共享课程 B', C: '共享课程 C' },
};

it('indexes multiple memberships, keeps the current resource and preserves series order', () => {
  const index = buildRelationIndex(parseRelationArtifact(artifact));
  const slice = index.get('A')!;
  expect(slice.groups.map((g) => g.id)).toEqual(['Related', 'Another']);
  expect(slice.series[0].members).toEqual(['C', 'A', 'B']);
  expect(index.has('Unrelated')).toBe(false);
});

it('uses only supplied plan offerings and keeps distinct semesters and original codes', () => {
  const slice = buildRelationIndex(parseRelationArtifact(artifact)).get('A')!;
  const own = [
    {
      name: '方案课程',
      code: 'ORIGINAL',
      term: '大一上',
      href: '/docs/2025/CS/fresh-autumn/ORIGINAL',
    },
    {
      name: '方案课程',
      code: 'ORIGINAL',
      term: '大一下',
      href: '/docs/2025/CS/fresh-spring/ORIGINAL',
    },
  ];
  const panels = buildRelationPanels(slice, { A: own, Unrelated: own });
  expect(panels[0].courses.map((c) => c.id)).toEqual(['C', 'A', 'B']);
  expect(panels[0].courses[1]).toEqual({
    id: 'A',
    name: '共享课程 A',
    localOfferings: own,
  });
  expect(panels[0].courses[0].localOfferings).toEqual([]);
  expect(JSON.stringify(panels)).not.toContain('Unrelated');
});

it('rejects duplicate members, unsafe IDs, unsupported versions and branching fields', () => {
  for (const patch of [
    { members: ['A', 'A'] },
    { members: ['A'] },
    { members: ['A', '../B'] },
    { members: ['A', 'B'], branch: ['C'] },
  ]) {
    expect(() =>
      parseRelationArtifact({
        ...artifact,
        series: { Sequence: { name: '系列', ...patch } },
      })
    ).toThrow();
  }
  expect(() => parseRelationArtifact({ ...artifact, version: 2 })).toThrow();
  expect(
    buildRelationIndex(
      parseRelationArtifact({ version: 1, groups: {}, series: {}, names: {} })
    ).size
  ).toBe(0);
});

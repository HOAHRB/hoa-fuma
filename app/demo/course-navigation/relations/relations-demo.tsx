'use client';

import { useState } from 'react';
import { CourseRelations } from '@/components/course-relations';
import { buildRelationPanels } from '@/lib/course-relations';
type Offering = {
  name: string;
  code: string;
  term: string;
  href: string;
};
type Macro = { id: string; name: string; localOfferings: Offering[] };
const currentMacroId = 'Calculus1';
const groupMemberIds = new Set([
  'Calculus1',
  'NeuralNetworks',
  'CivilMachineLearning',
]);
const courses: Macro[] = [
  {
    id: 'Calculus1',
    name: '微积分（上）',
    localOfferings: [
      {
        name: '微积分 A（1）',
        code: '22MA15001',
        term: '大一上',
        href: '/docs/2025/CivilEngineering/fresh-autumn/22MA15001',
      },
    ],
  },
  {
    id: 'AlgebraAndGeometry',
    name: '代数与几何',
    localOfferings: [
      {
        name: '代数与几何 B',
        code: '22MA15017',
        href: '/docs/2025/CivilEngineering/fresh-autumn/22MA15017',
        term: '大一上',
      },
      {
        name: '代数与几何 E',
        code: '22MA15020',
        href: '/docs/2025/CivilEngineering/fresh-spring/22MA15020',
        term: '大一下',
      },
    ],
  },
  {
    id: 'NeuralNetworks',
    name: '神经网络',
    localOfferings: [],
  },
  {
    id: 'CivilMachineLearning',
    name: '土木机器学习',
    localOfferings: [
      {
        name: '土木工程机器学习',
        code: 'DEMO-CE301',
        href: '/docs/2025/CivilEngineering/junior-spring/DEMO-CE301',
        term: '大三下',
      },
    ],
  },
];

export function RelationsDemo() {
  const [destination, setDestination] = useState<string>();
  return (
    <div className="not-prose space-y-3">
      <div className="text-fd-muted-foreground space-y-1 text-sm">
        <p>当前页面：2025 级 · 土木工程 · 微积分 A（1）</p>
        <p>
          演示数据。点击课程可选择本方案课程或 GitHub
          资料仓库；选择后仅预览去向。
        </p>
      </div>
      <CourseRelations
        panels={buildRelationPanels(
          {
            series: [
              {
                id: 'MathematicsAndMachineLearning',
                name: '数学基础与机器学习应用',
                members: courses.map((course) => course.id),
              },
            ],
            groups: [
              {
                id: 'MachineLearning',
                name: '机器学习方法与工程应用',
                members: [...groupMemberIds],
              },
            ],
            names: Object.fromEntries(
              courses.map((course) => [course.id, course.name])
            ),
          },
          Object.fromEntries(
            courses.map((course) => [course.id, course.localOfferings])
          )
        )}
        currentRepoId={currentMacroId}
        currentHref="/docs/2025/CivilEngineering/fresh-autumn/22MA15001"
        onVisit={setDestination}
      />
      <div
        role="status"
        aria-live="polite"
        className="text-fd-muted-foreground border-fd-border rounded-md border border-dashed px-3 py-2 text-xs break-words"
      >
        {destination
          ? `选择的去向：${destination}`
          : '试试“微积分（上）”“代数与几何”“神经网络”：本方案一门、多门，以及未开设。'}
      </div>
    </div>
  );
}

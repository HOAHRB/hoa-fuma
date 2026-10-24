'use client';

import { useState } from 'react';
import { CourseNavigation } from './course-navigation';
import { CourseSelector } from './course-selector';
import { Assessment, NavigationGroups } from './navigation-groups';
import { buildCourseNavigationScope } from '@/lib/course-navigation/presentation';
import type { CourseVariant } from '@/lib/course-navigation/catalog';
import type {
  CourseNavigationData,
  ViewKey,
} from '@/lib/course-navigation/schema';

type Row = CourseNavigationData['records'][number];
const combinations = [
  '必修考试',
  '必修考查',
  '限选考试',
  '限选考查',
  '选修考试',
  '选修考查',
];
const currentHref = '/docs/2025/M0/fresh-autumn/PREVIEW1';

function row(
  label: string | null,
  index: number,
  overrides: Partial<Row> = {}
): Row {
  return {
    entryYear: '2025',
    majorId: `M${index}`,
    majorName: ['自动化', '计算机科学与技术', '电气工程及其自动化'][index % 3],
    relativeTerm: '大一上',
    openingTerm: '2025 年秋季',
    courseNature: label?.replace(/考试|考查/g, '') || null,
    assessmentMethod: label?.match(/考试|考查/)?.[0] ?? null,
    href: `/docs/2025/M${index}/fresh-autumn/PREVIEW1`,
    ...overrides,
  };
}

const scenarios = [
  {
    title: '整体一致 → 标题提取',
    note: '所有记录均为必修考试，下层不重复。',
    records: [row('必修考试', 0), row('必修考试', 1)],
  },
  {
    title: '同性质、不同考核 → 末级完整显示',
    note: '不单独提取“必修”。',
    records: [row('必修考试', 0), row('必修考查', 1)],
  },
  {
    title: '同考核、不同性质 → 末级完整显示',
    note: '不单独提取“考试”。',
    records: [row('必修考试', 0), row('限选考试', 1), row('选修考试', 2)],
  },
  {
    title: '入学年份分组提取',
    note: '同年记录一致，分别上提到年份标题。',
    records: [
      row('必修考试', 0),
      row('必修考试', 1),
      row('限选考查', 2, {
        entryYear: '2024',
        href: '/docs/2024/M2/fresh-autumn/PREVIEW1',
      }),
    ],
  },
  {
    title: '学期分组提取',
    note: '同组不同学期，分别上提到学期标题。',
    records: [
      row('必修考试', 0),
      row('必修考试', 1),
      row('选修考查', 2, {
        relativeTerm: '大一下',
        openingTerm: '2026 年春季',
      }),
    ],
  },
  {
    title: '信息缺失',
    note: '保留已知维度；两项均缺失时不显示标志。',
    records: [row('考试', 0), row('必修', 1), row(null, 2)],
  },
];

function variants(count: number): CourseVariant[] {
  return Array.from({ length: count }, (_, index) => {
    const code =
      index === count - 1 && count > 4
        ? 'PHYSICAL-EDUCATION-SPECIAL-2025-0012'
        : `PREVIEW${index + 1}`;
    return {
      code,
      name:
        index === count - 1 && count > 4
          ? '体育专项训练与综合实践（长课程名称）'
          : `体育（${index + 1}）`,
      data: {
        records: [0, 1].map((major) =>
          row(combinations[index % 6], major, {
            href: `/docs/2025/M${major}/fresh-autumn/${code}`,
          })
        ),
      },
    };
  });
}

const shortVariants = variants(3);
const manyVariants = variants(12);

export function AssessmentPreview() {
  const [view, setView] = useState<ViewKey>('byEntryYear');
  const [selection, setSelection] = useState('PREVIEW1');
  const [narrow, setNarrow] = useState(false);
  const scope = buildCourseNavigationScope({
    originalData: manyVariants[0].data,
    relatedCourses: manyVariants,
    currentCode: 'PREVIEW1',
    includeSimilar: true,
    selectedCode: '__all',
    view,
  });
  return (
    <div className="not-prose space-y-8">
      <p className="text-fd-muted-foreground text-sm">
        使用正式标志、选择器和分组组件。可用站点主题按钮切换明暗；窄屏下选择器会使用抽屉。
      </p>
      <section className="space-y-3" aria-label="底色对照">
        <h2 className="text-lg font-semibold">六种组合 × 实际底色</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {[
            ['页面底色', 'bg-fd-background', false],
            ['标题栏底色', 'bg-fd-muted/50', false],
            ['普通课号块底色', 'bg-fd-secondary/50', false],
            ['当前课号块底色', 'bg-fd-accent', false],
            ['分页夹未选中底色（小号文字）', 'bg-fd-muted/40', true],
            [
              '当前链接底色（小号文字）',
              'bg-fd-primary/10 text-fd-primary',
              true,
            ],
          ].map(([title, background, plain]) => (
            <div
              key={String(title)}
              className={`border-fd-border rounded-lg border p-3 ${background}`}
            >
              <h3 className="mb-3 text-sm font-medium">{title}</h3>
              <div className="flex flex-wrap gap-2">
                {combinations.map((value) => (
                  <Assessment
                    key={value}
                    value={value}
                    plain={Boolean(plain)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3" aria-label="最大公因数组合场景">
        <h2 className="text-lg font-semibold">完整组合的逐层提取</h2>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="预览分组方式"
        >
          {(
            [
              ['byMajor', '按专业'],
              ['byEntryYear', '按入学年份'],
              ['byOpeningTerm', '按开课时间'],
            ] as const
          ).map(([key, text]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`rounded-lg border px-3 py-1 text-sm ${view === key ? 'bg-fd-primary/10 text-fd-primary' : 'bg-fd-background'}`}
            >
              {text}
            </button>
          ))}
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {scenarios.map((scenario) => {
            const result = buildCourseNavigationScope({
              originalData: { records: scenario.records },
              relatedCourses: [],
              currentCode: 'PREVIEW1',
              includeSimilar: false,
              view,
            });
            return (
              <article key={scenario.title} className="min-w-0 space-y-2">
                <h3 className="text-sm font-medium">{scenario.title}</h3>
                <p className="text-fd-muted-foreground text-xs">
                  {scenario.note}
                </p>
                <div className="border-fd-border overflow-hidden rounded-lg border">
                  <div className="bg-fd-muted/50 border-fd-border flex flex-wrap items-center gap-2 border-b px-3 py-2">
                    <span className="text-sm font-semibold">课程开设情况</span>
                    <Assessment value={result.assessmentMethod} />
                  </div>
                  <NavigationGroups
                    groups={result.presentation.groups}
                    view={view}
                    currentHref={currentHref}
                    currentCode="PREVIEW1"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="space-y-3" aria-label="全部变体预览">
        <h2 className="text-lg font-semibold">
          全部变体：课号层提取、当前标记、长课号
        </h2>
        <div className="border-fd-border divide-fd-border divide-y overflow-hidden rounded-lg border">
          <NavigationGroups
            groups={scope.presentation.groups}
            view={view}
            currentHref={currentHref}
            currentCode="PREVIEW1"
          />
        </div>
      </section>
      <section className="space-y-3" aria-label="选择器标志预览">
        <h2 className="text-lg font-semibold">
          选择器：外部小号文字，内部不显示标志
        </h2>
        <div className="bg-fd-muted/30 rounded-lg border p-3">
          <CourseSelector
            courses={scope.courses}
            value={selection}
            currentCode="PREVIEW1"
            onChange={setSelection}
          />
        </div>
      </section>
      <section className="space-y-3" aria-label="真实交互预览">
        <h2 className="text-lg font-semibold">
          真实交互：分页夹、自动溢出、切换重新提取
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={narrow}
            onChange={(event) => setNarrow(event.target.checked)}
          />
          限制面板宽度为 360px
        </label>
        <p className="text-fd-muted-foreground text-xs">
          开启下方面板的“包括变体课程”，查看分页夹或溢出选择器；切换“全部”查看课号分组。
        </p>
        <div className={narrow ? 'max-w-[360px]' : ''}>
          {[shortVariants, manyVariants].map((courses) => (
            <CourseNavigation
              key={courses.length}
              heading={
                courses.length === 3
                  ? '课程开设情况 · 3 个课号'
                  : '课程开设情况 · 12 个课号'
              }
              data={courses[0].data}
              relatedCourses={courses}
              currentHref={currentHref}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

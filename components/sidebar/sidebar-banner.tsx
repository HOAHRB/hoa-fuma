'use client';

import { YearSelector } from '@/components/sidebar/year-selector';
import { StudyLevelSelector } from '@/components/sidebar/study-level-selector';
import type { StudyLevel, YearMajorMap } from '@/lib/docs-utils';
import { usePathname } from 'fumadocs-core/framework';
import { MajorSelector } from './major-selector';

export function SidebarBanner({
  yearMajorMap,
  currentYear,
}: {
  yearMajorMap: YearMajorMap;
  currentYear: string;
}) {
  const pathname = usePathname();
  const majors = yearMajorMap[currentYear] ?? [];
  const currentMajor = majors.find(
    (major) => major.id === pathname.split('/')[3]
  );
  const studyLevel = currentMajor?.studyLevel ?? 'undergrad';
  const yearEntries = Object.entries(yearMajorMap).sort(([a], [b]) =>
    b.localeCompare(a)
  );
  const years = yearEntries.flatMap(([year, options]) => {
    const major = options.find((option) => option.studyLevel === studyLevel);
    return major ? [{ year, url: `/docs/${year}/${major.id}` }] : [];
  });
  const levels: StudyLevel[] = ['undergrad', 'postgrad'];
  const studyLevelOptions = levels.flatMap((level) => {
    const targetYear = majors.some((major) => major.studyLevel === level)
      ? currentYear
      : yearEntries.find(([, options]) =>
          options.some((major) => major.studyLevel === level)
        )?.[0];
    const major = targetYear
      ? yearMajorMap[targetYear].find((major) => major.studyLevel === level)
      : undefined;
    return major
      ? [
          {
            level,
            url:
              level === studyLevel
                ? pathname
                : `/docs/${targetYear}/${major.id}`,
          },
        ]
      : [];
  });
  const options = majors.filter((major) => major.studyLevel === studyLevel);

  return (
    <div className="mt-2 flex flex-col gap-2">
      {studyLevelOptions.length > 1 && (
        <StudyLevelSelector
          options={studyLevelOptions}
          studyLevel={studyLevel}
        />
      )}
      <YearSelector years={years} currentYear={currentYear} />
      <MajorSelector
        key={`${currentYear}/${studyLevel}`}
        options={options}
        currentMajorId={currentMajor?.id}
        year={currentYear}
      />
    </div>
  );
}

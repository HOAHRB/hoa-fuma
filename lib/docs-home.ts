import majorMapping from '@/lib/data/major_mapping.json';
import { docsManifest } from '@/lib/docs-manifest';
import { computeYearMajorMap, type MajorEntry } from '@/lib/docs-utils';

let yearMajorMap: Record<string, { id: string; name: string }[]> | undefined;

export function getYearMajorMap() {
  if (yearMajorMap) return yearMajorMap;

  const pages = Object.entries(docsManifest.majorIdsByYear).flatMap(
    ([year, majorIds]) => majorIds.map((major) => ({ slugs: [year, major] }))
  );
  const mapping = majorMapping as unknown as Record<
    string,
    Record<string, MajorEntry>
  >;

  yearMajorMap = computeYearMajorMap(pages, mapping);
  return yearMajorMap;
}

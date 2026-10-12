import z from 'zod';

const assessment = z.string().nullable();
const itemSchema = z.object({
  recordIndex: z.number().int().nonnegative(),
  assessmentMethod: assessment,
});
const subgroupSchema = z.object({
  key: z.string(),
  label: z.string(),
  assessmentMethod: assessment,
  items: z.array(itemSchema),
});
const groupSchema = subgroupSchema.extend({
  secondaryLabel: z.string().nullable(),
  secondaryAssessmentMethod: assessment,
  subgroups: z.array(subgroupSchema),
});
const viewSchema = z.object({ groups: z.array(groupSchema) });
const recordSchema = z.object({
  entryYear: z.string(),
  majorId: z.string(),
  majorName: z.string(),
  relativeTerm: z.string(),
  openingTerm: z.string(),
  assessmentMethod: assessment,
  href: z.string().regex(/^\/docs\/[\w-]+\/[^/]+\/[\w-]+\/[^/]+$/),
});
const navigationSchema = z
  .object({
    records: z.array(recordSchema),
    commonAssessmentMethod: assessment,
    views: z.object({
      byMajor: viewSchema,
      byEntryYear: viewSchema,
      byOpeningTerm: viewSchema,
    }),
  })
  .refine((data) =>
    Object.values(data.views).every((view) =>
      view.groups.every((group) =>
        [
          ...group.items,
          ...group.subgroups.flatMap((subgroup) => subgroup.items),
        ].every((item) => item.recordIndex < data.records.length)
      )
    )
  );

export type CourseNavigationData = z.infer<typeof navigationSchema>;
type NavigationGroup =
  CourseNavigationData['views']['byMajor']['groups'][number];
export type NavigationItem = NavigationGroup['items'][number];
export type ViewKey = keyof CourseNavigationData['views'];
export type NavigationArtifact = {
  version: 1;
  courses: Record<string, CourseNavigationData>;
};

export function parseNavigationArtifact(input: unknown): NavigationArtifact {
  const result = z
    .object({
      version: z.literal(1),
      courses: z.record(z.string(), navigationSchema),
    })
    .safeParse(input);
  return result.success ? result.data : { version: 1, courses: {} };
}

export function selectCourseNavigation(
  artifact: NavigationArtifact,
  segments: string[]
) {
  if (
    segments.length !== 4 ||
    !/^(fresh|sophomore|junior|senior|fifth)-(autumn|spring|summer)$/.test(
      segments[2]
    )
  )
    return undefined;
  return artifact.courses[segments[3].toUpperCase()];
}

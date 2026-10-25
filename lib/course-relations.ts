import z from 'zod';

const repositoryId = z.string().regex(/^(?!\.{1,2}$)[A-Za-z0-9_.-]+$/);
const relation = z
  .object({
    name: z.string().trim().min(1),
    members: z
      .array(repositoryId)
      .min(2)
      .refine((ids) => new Set(ids).size === ids.length),
  })
  .strict();
const relationTable = z.record(
  z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
  relation
);
const artifactSchema = z
  .object({
    version: z.literal(1),
    groups: relationTable,
    series: relationTable,
    names: z.record(repositoryId, z.string().trim().min(1)),
  })
  .strict();

export type RelationArtifact = z.infer<typeof artifactSchema>;
export type RelationOffering = {
  name: string;
  code: string;
  term: string;
  href: string;
};
export type RelatedCourse = {
  id: string;
  name: string;
  localOfferings: RelationOffering[];
};
export type RelationPanel = {
  id: string;
  kind: 'groups' | 'series';
  name: string;
  courses: RelatedCourse[];
};
export type RelationSlice = {
  groups: ({ id: string } & RelationArtifact['groups'][string])[];
  series: ({ id: string } & RelationArtifact['series'][string])[];
  names: Record<string, string>;
};

export function parseRelationArtifact(value: unknown): RelationArtifact {
  return artifactSchema.parse(value);
}

// Only resources in confirmed relationships receive an index entry.
export function buildRelationIndex(
  artifact: RelationArtifact
): Map<string, RelationSlice> {
  const index = new Map<string, RelationSlice>();
  for (const kind of ['groups', 'series'] as const) {
    for (const [id, relation] of Object.entries(artifact[kind])) {
      for (const member of relation.members) {
        const slice = index.get(member) ?? {
          groups: [],
          series: [],
          names: {},
        };
        slice[kind].push({ id, ...relation });
        for (const related of relation.members)
          slice.names[related] = artifact.names[related] ?? related;
        index.set(member, slice);
      }
    }
  }
  return index;
}

export function buildRelationPanels(
  slice: RelationSlice,
  offerings: Record<string, RelationOffering[]>
): RelationPanel[] {
  return (['series', 'groups'] as const).flatMap((kind) =>
    slice[kind].map((relation) => ({
      id: relation.id,
      kind,
      name: relation.name,
      courses: relation.members.map((id) => ({
        id,
        name: slice.names[id] ?? id,
        localOfferings: offerings[id] ?? [],
      })),
    }))
  );
}

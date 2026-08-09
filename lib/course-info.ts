import z from 'zod';
import type { CourseInfoData } from '@/lib/types';

export const courseInfoSchema: z.ZodType<CourseInfoData> = z.object({
  credit: z.number(),
  assessmentMethod: z.string(),
  courseNature: z.string(),
  hourDistribution: z.object({
    theory: z.number(),
    lab: z.number(),
    practice: z.number(),
    exercise: z.number(),
    computer: z.number(),
    tutoring: z.number(),
  }),
  gradingScheme: z.array(
    z.object({
      name: z.string(),
      percent: z.number(),
    })
  ),
});

import type { CourseNavigationData } from './schema';
export const fixture: CourseNavigationData = {
  records: [
    {
      entryYear: '2024',
      majorId: 'A',
      majorName: '自动化',
      relativeTerm: '大二上',
      openingTerm: '2025 年秋季',
      assessmentMethod: '考试',
      href: '/docs/2024/A/sophomore-autumn/CS101',
    },
    {
      entryYear: '2023',
      majorId: 'A',
      majorName: '自动化',
      relativeTerm: '大二上',
      openingTerm: '2024 年秋季',
      assessmentMethod: '考查',
      href: '/docs/2023/A/sophomore-autumn/CS101',
    },
  ],
  commonAssessmentMethod: null,
  views: {
    byMajor: {
      groups: [
        {
          key: 'A',
          label: '自动化',
          assessmentMethod: null,
          secondaryLabel: '大二上',
          secondaryAssessmentMethod: null,
          items: [
            { recordIndex: 0, assessmentMethod: '考试' },
            { recordIndex: 1, assessmentMethod: '考查' },
          ],
          subgroups: [],
        },
      ],
    },
    byEntryYear: {
      groups: [
        {
          key: '2024',
          label: '2024 级',
          assessmentMethod: '考试',
          secondaryLabel: '大二上',
          secondaryAssessmentMethod: null,
          items: [{ recordIndex: 0, assessmentMethod: null }],
          subgroups: [],
        },
        {
          key: '2023',
          label: '2023 级',
          assessmentMethod: '考查',
          secondaryLabel: '大二上',
          secondaryAssessmentMethod: null,
          items: [{ recordIndex: 1, assessmentMethod: null }],
          subgroups: [],
        },
      ],
    },
    byOpeningTerm: {
      groups: [
        {
          key: '2025-autumn',
          label: '2025 年秋季',
          assessmentMethod: '考试',
          secondaryLabel: '大二上',
          secondaryAssessmentMethod: null,
          items: [{ recordIndex: 0, assessmentMethod: null }],
          subgroups: [],
        },
        {
          key: '2024-autumn',
          label: '2024 年秋季',
          assessmentMethod: '考查',
          secondaryLabel: '大二上',
          secondaryAssessmentMethod: null,
          items: [{ recordIndex: 1, assessmentMethod: null }],
          subgroups: [],
        },
      ],
    },
  },
};

import type { CourseIntroductionData } from '@/lib/types';

export function getIntroductionView(
  data: CourseIntroductionData,
  open: boolean
) {
  const zh = data.zh.trim();
  const en = data.en.trim();
  return {
    empty: !zh && !en,
    preview: zh || en,
    showPreview: !open && Boolean(zh || en),
    showZh: Boolean(zh),
    showEn: Boolean(en),
  };
}

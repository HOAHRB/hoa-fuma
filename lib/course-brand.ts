const UPSTREAM_PLACEHOLDER =
  '当前培养方案中包含这门课程，但 HOA 暂未收录对应的 GitHub 仓库';

export function courseDescription(text: string | undefined) {
  return text?.replace(
    UPSTREAM_PLACEHOLDER,
    '当前培养方案中包含这门课程，但本站暂未收录对应的 GitHub 仓库'
  );
}

export const MISSING_COURSE_COPY =
  '这里还留着一些空白，等上过这门课的你添上几笔。可以是一份笔记、一点复习心得，也可以是你希望当初有人告诉自己的事。';

export function missingCourseParagraph(text: string) {
  if (text.startsWith(UPSTREAM_PLACEHOLDER)) return 'notice';
  if (
    text.startsWith('如果你希望补充这门课程的资料，请前往') &&
    text.includes('查看如何建立映射或者联系管理员添加仓库')
  )
    return 'guide';
}

export function courseMarkdown(text: string, participationUrl: string) {
  return text.replace(
    /当前培养方案中包含这门课程，但 HOA 暂未收录对应的 GitHub 仓库[^\n]*\n+如果你希望补充这门课程的资料，请前往[^\n]*查看如何建立映射或者联系管理员添加仓库。/g,
    '## 课程资料\n\n' +
      MISSING_COURSE_COPY +
      '\n\n[参与与反馈](' +
      participationUrl +
      ')'
  );
}

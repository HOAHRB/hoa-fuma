import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'HOAHRB 教学计划开放平台',
    },
    themeSwitch: {
      mode: 'light-dark-system',
    },
    links: [
      {
        text: '文档',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: '博客',
        url: '/blog',
        active: 'nested-url',
      },
      {
        text: '新闻',
        url: '/news',
        active: 'nested-url',
      },
      {
        text: '友链',
        url: '/links',
        active: 'nested-url',
      },
    ],
    githubUrl: 'https://github.com/HOAHRB',
  };
}

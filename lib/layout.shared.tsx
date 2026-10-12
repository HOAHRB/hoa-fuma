import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(
  linkPlacement: 'nav' | 'all' = 'nav'
): BaseLayoutProps {
  return {
    nav: {
      title: 'HOAHRB 教学计划开放平台',
      url: '/',
    },
    themeSwitch: {
      mode: 'light-dark-system',
    },
    links: [
      {
        text: '文档',
        url: '/docs',
        active: 'nested-url',
        on: linkPlacement,
      },
      {
        text: '博客',
        url: '/blog',
        active: 'nested-url',
        on: linkPlacement,
      },
      {
        text: '新闻',
        url: '/news',
        active: 'nested-url',
        on: linkPlacement,
      },
      {
        text: '参与',
        url: 'https://wiki.hoa.moe',
        active: 'none',
        external: true,
        on: linkPlacement,
      },
      {
        text: '友链',
        url: '/links',
        active: 'nested-url',
        on: linkPlacement,
      },
      {
        text: '关于上游',
        url: '/about',
        active: 'nested-url',
        on: linkPlacement,
      },
    ],
    githubUrl: 'https://github.com/HOAHRB',
  };
}

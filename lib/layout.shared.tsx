import { SITE_TITLE, PROJECT_URL } from '@/lib/brand';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(
  linkPlacement: 'nav' | 'all' = 'nav'
): BaseLayoutProps {
  return {
    nav: {
      title: SITE_TITLE,
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
        url: '/about#参与与反馈',
        active: 'none',
        on: linkPlacement,
      },
      {
        text: '友链',
        url: '/links',
        active: 'nested-url',
        on: linkPlacement,
      },
      {
        text: '关于本站',
        url: '/about',
        active: 'nested-url',
        on: linkPlacement,
      },
    ],
    githubUrl: PROJECT_URL,
  };
}

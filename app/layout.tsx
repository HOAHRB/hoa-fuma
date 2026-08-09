import { RootProvider } from 'fumadocs-ui/provider/next';
import 'katex/dist/katex.css';
import './global.css';
import { Toaster } from '@/components/ui/sonner';
import Script from 'next/script';
import type { Metadata } from 'next';
import { SearchDialog } from '@/components/search-dialog';
import { siteUrl, withBasePath } from '@/lib/base-path';

export const metadata: Metadata = {
  title: 'HOAHRB 教学计划开放平台',
  description: '为你的 HITSZ 求学路提供全面的课程资料与经验分享',
  metadataBase: new URL(siteUrl),
  alternates: {
    types: {
      'application/rss+xml': [
        {
          title: 'HOA 博客',
          url: new URL('blog/rss.xml', siteUrl),
        },
        {
          title: 'HOA 新闻',
          url: new URL('news/rss.xml', siteUrl),
        },
      ],
    },
  },
  icons: {
    icon: [
      {
        url: withBasePath('/icons/favicon-light.png'),
        media: '(prefers-color-scheme: light)',
      },
      {
        url: withBasePath('/icons/favicon-dark.png'),
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: withBasePath('/apple-icon.png'),
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider
          search={{
            SearchDialog,
            options: { api: withBasePath('/api/search') },
          }}
        >
          {children}
          <Toaster />
        </RootProvider>
        {process.env.NEXT_PUBLIC_UMAMI_SRC &&
          process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
            <Script
              src={process.env.NEXT_PUBLIC_UMAMI_SRC}
              data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
              strategy="lazyOnload"
            />
          )}
      </body>
    </html>
  );
}

import { RootProvider } from 'fumadocs-ui/provider/next';
import 'katex/dist/katex.css';
import './global.css';
import { Toaster } from '@/components/ui/sonner';
import Script from 'next/script';
import type { Metadata } from 'next';
import { SearchDialog } from '@/components/search-dialog';
import { siteUrl, withBasePath } from '@/lib/base-path';

// Bound shared HTML caching even when deployments cannot purge the proxy cache.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'HOAHRB 教学计划开放平台',
  description:
    'HOAHRB 教学计划开放平台，按入学年份、专业和学期查询哈尔滨工业大学普通本科培养方案与课程信息。',
  metadataBase: new URL(siteUrl),
  openGraph: {
    images: '/apple-icon.png',
  },
  twitter: {
    card: 'summary',
    images: '/apple-icon.png',
  },
  alternates: {
    canonical: '/',
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
    <html lang="zh-CN" suppressHydrationWarning>
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

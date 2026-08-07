'use client';

import { useEffect } from 'react';
import { HOA_LAST_PATH_COOKIE } from '@/lib/constants';
import { readCookieValue } from '@/lib/docs-client-redirect';

export function DocsEntryRedirect({ fallbackPath }: { fallbackPath: string }) {
  useEffect(() => {
    const rememberedPath = readCookieValue(
      document.cookie,
      HOA_LAST_PATH_COOKIE
    );
    const target =
      rememberedPath && rememberedPath.startsWith('/docs/') &&
      rememberedPath !== '/docs/'
        ? rememberedPath
        : fallbackPath;

    window.location.replace(target);
  }, [fallbackPath]);

  return (
    <p>
      正在打开文档。若没有自动跳转，请 <a href={fallbackPath}>点击这里</a>。
    </p>
  );
}

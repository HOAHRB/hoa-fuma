'use client';

import { useEffect } from 'react';
import { HOA_LAST_PATH_COOKIE } from '@/lib/constants';
import {
  chooseLegacyRedirect,
  readCookieValue,
} from '@/lib/docs-client-redirect';
import type { LegacyRedirectCandidate } from '@/lib/docs-static-routes';

type LegacyDocsRedirectProps = {
  candidates: LegacyRedirectCandidate[];
  fallbackPath: string;
};

export function LegacyDocsRedirect({
  candidates,
  fallbackPath,
}: LegacyDocsRedirectProps) {
  useEffect(() => {
    const rememberedPath = readCookieValue(
      document.cookie,
      HOA_LAST_PATH_COOKIE
    );
    window.location.replace(
      chooseLegacyRedirect(candidates, rememberedPath) ?? fallbackPath
    );
  }, [candidates, fallbackPath]);

  return (
    <p>
      正在打开课程文档。若没有自动跳转，请{' '}
      <a href={fallbackPath}>点击这里</a>。
    </p>
  );
}

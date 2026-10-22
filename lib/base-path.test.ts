import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('siteHref', () => {
  it.each(['https://example.org/hoahrb/', 'https://example.org/hoahrb'])(
    'preserves the deployment prefix for %s',
    async (url) => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', url);
      vi.resetModules();
      const { siteHref } = await import('./base-path');
      expect(siteHref('/docs/2025/cs/CODE.md')).toBe(
        'https://example.org/hoahrb/docs/2025/cs/CODE.md'
      );
      expect(siteHref('/about#参与与反馈')).toBe(
        `https://example.org/hoahrb/about#${encodeURIComponent('参与与反馈')}`
      );
      expect(siteHref('https://github.com/HOAHRB')).toBe(
        'https://github.com/HOAHRB'
      );
    }
  );
  it('supports root deployments', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.org/');
    vi.resetModules();
    const { siteHref } = await import('./base-path');
    expect(siteHref('/docs')).toBe('https://example.org/docs');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/docs-paths', () => ({
  getDocsCoursePathEntries: () => [
    { slugs: ['2024', '01041', 'junior-autumn', '22AS31102'] },
    { slugs: ['2025', 'economics', 'junior-autumn', '22AS31102'] },
  ],
}));

import { proxy } from './proxy';

function request(path: string, cookie?: string) {
  return new NextRequest(`https://test.hitchhike.work/hoahrb${path}`, {
    nextConfig: { basePath: '/hoahrb' },
    headers: cookie ? { cookie: `hoa-last-path=${cookie}` } : {},
  });
}

describe('legacy docs proxy', () => {
  it.each(['/docs/22AS31102', '/docs/junior-autumn/22AS31102'])(
    'preserves the base path and cookie preference for %s',
    (path) => {
      const response = proxy(
        request(path, '/docs/2024/01041/junior-autumn/22AS31102')
      );
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://test.hitchhike.work/hoahrb/docs/2024/01041/junior-autumn/22AS31102'
      );
      expect(response.headers.get('cache-control')).toBe('private, no-store');
    }
  );

  it('leaves year routes untouched', () => {
    const response = proxy(request('/docs/2025/economics'));
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('location')).toBeNull();
  });
});

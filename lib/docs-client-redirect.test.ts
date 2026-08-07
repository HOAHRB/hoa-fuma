import { describe, expect, it } from 'vitest';
import {
  chooseLegacyRedirect,
  readCookieValue,
} from './docs-client-redirect';

const candidates = [
  { year: '2024', major: 'cs', pathname: '/docs/2024/cs/fresh/CS101' },
  { year: '2025', major: 'ai', pathname: '/docs/2025/ai/fresh/CS101' },
];

describe('readCookieValue', () => {
  it('decodes the remembered docs path', () => {
    expect(
      readCookieValue(
        'x=1; hoa-last-path=%2Fdocs%2F2024%2Fcs',
        'hoa-last-path'
      )
    ).toBe('/docs/2024/cs');
  });
});

describe('chooseLegacyRedirect', () => {
  it('prefers an exact remembered year and major', () => {
    expect(
      chooseLegacyRedirect(candidates, '/docs/2024/cs/fresh/OLD')
    ).toBe('/docs/2024/cs/fresh/CS101');
  });

  it('falls back to the newest year deterministically', () => {
    expect(chooseLegacyRedirect(candidates, undefined)).toBe(
      '/docs/2025/ai/fresh/CS101'
    );
  });
});

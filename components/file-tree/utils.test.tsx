import { describe, expect, it } from 'vitest';
import { getDownloadUrl } from './utils';

const path = 'notes/%E7%AC%94%E8%AE%B0%20one.pdf';
const target = 'https://github.com/HOAHRB-Courses/TEST101/raw/main/' + path;

describe('native download URLs', () => {
  it('uses the GitHub raw download endpoint for generated Raw URLs', () => {
    expect(
      getDownloadUrl(
        'https://raw.githubusercontent.com/HOAHRB-Courses/TEST101/main/' + path
      )
    ).toBe(target);
  });
  it('replaces the upstream proxy in legacy generated content', () => {
    expect(
      getDownloadUrl(
        'https://gh.hoa.moe/github.com/HOAHRB-Courses/TEST101/raw/main/' + path
      )
    ).toBe(target);
  });
  it('preserves existing download links and unrelated file hosts', () => {
    expect(getDownloadUrl(target)).toBe(target);
    expect(getDownloadUrl('https://example.com/file.zip')).toBe(
      'https://example.com/file.zip'
    );
  });
});

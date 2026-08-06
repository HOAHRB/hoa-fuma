import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('install-hoa-backend', () => {
  it('downloads release assets from the localized backend repository', () => {
    const script = readFileSync(
      resolve(process.cwd(), 'scripts/install-hoa-backend.sh'),
      'utf8'
    );

    expect(script).toContain(
      'https://github.com/HOAHRB/hoa-backend/releases/latest/download/hoa-backend-linux.tar.gz'
    );
    expect(script).toContain(
      'https://github.com/HOAHRB/hoa-backend/releases/latest/download/hoa-backend-macos-arm64.tar.gz'
    );
    expect(script).not.toContain('HITSZ-OpenAuto/hoa-backend');
  });
});

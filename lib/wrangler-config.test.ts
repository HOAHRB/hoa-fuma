import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('wrangler static assets configuration', () => {
  it('defines the static Worker routing contract', () => {
    const wranglerConfig = JSON.parse(
      readFileSync(resolve(process.cwd(), 'wrangler.jsonc'), 'utf8').replace(
        /,\s*([}\]])/g,
        '$1'
      )
    );

    expect(wranglerConfig.name).toBe('hoahrb-fuma-static');
    expect(wranglerConfig.compatibility_date).toBe('2026-08-07');
    expect(wranglerConfig.assets).toEqual({
      directory: './out',
      html_handling: 'auto-trailing-slash',
      not_found_handling: '404-page',
    });
    expect(wranglerConfig).not.toHaveProperty('workers_dev');
    expect(wranglerConfig).not.toHaveProperty('preview_urls');
  });
});

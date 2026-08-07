import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = resolve(
  process.cwd(),
  '.github',
  'workflows',
  'static-publish.yml'
);

describe('static publish workflow', () => {
  it('runs only on pushes to branches with read-only repository access', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain("push:\n    branches: ['**']");
    expect(workflow).toContain('permissions:\n  contents: read');
    expect(workflow).not.toMatch(/pull_request|workflow_dispatch|tags:/);
  });

  it('uses the shared validation and dry-run deployment contract', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('runs-on: ubuntu-latest');
    expect(workflow).toContain('actions/checkout@v7.0.0');
    expect(workflow).toContain('pnpm/action-setup@v6.0.9');
    expect(workflow).toContain('with:\n          cache: true');
    expect(workflow).toContain('actions/setup-node@v6.4.0');
    expect(workflow).toContain('node-version-file: .node-version');
    expect(workflow).toContain('cache: pnpm');
    expect(workflow).toContain('pnpm install --frozen-lockfile');
    expect(workflow).toContain(
      'name: Build content\n        env:\n          GITHUB_TOKEN: ${{ github.token }}\n        run: make content'
    );
    for (const command of [
      'pnpm run test',
      'pnpm run lint',
      'pnpm run fmt:check',
      'pnpm run knip',
      'pnpm run types:check',
      'pnpm run build',
    ]) {
      expect(workflow).toContain(command);
    }
    expect(workflow).toContain('cloudflare/wrangler-action@v3');
    expect(workflow).toContain('wranglerVersion: 4.119.0');
    expect(workflow).toContain(
      'command: deploy --dry-run --outdir .next/wrangler-dry-run'
    );

    const orderedSteps = [
      'pnpm install --frozen-lockfile',
      'name: Build content',
      'pnpm run test',
      'pnpm run build',
      'command: deploy --dry-run --outdir .next/wrangler-dry-run',
      "if: github.ref == 'refs/heads/static-main'",
    ];
    const stepPositions = orderedSteps.map((step) => workflow.indexOf(step));

    expect(stepPositions.every((position) => position >= 0)).toBe(true);
    expect(stepPositions).toEqual([...stepPositions].sort((a, b) => a - b));
  });

  it('publishes production and branch versions with scoped concurrency', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('group: static-publish-${{ github.ref }}');
    expect(workflow).toContain('cancel-in-progress: true');
    expect(workflow).toContain("if: github.ref == 'refs/heads/static-main'");
    expect(workflow).toContain("if: github.ref != 'refs/heads/static-main'");
    expect(workflow).toContain('command: deploy');
    expect(workflow).toContain('command: versions upload');
    expect(
      workflow.match(/apiToken: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/g)
    ).toHaveLength(2);
    expect(
      workflow.match(/accountId: \$\{\{ secrets\.CLOUDFLARE_ACCOUNT_ID \}\}/g)
    ).toHaveLength(2);
    expect(workflow.match(/secrets\./g)).toHaveLength(4);
    expect(workflow).not.toContain('--preview-alias');
  });
});

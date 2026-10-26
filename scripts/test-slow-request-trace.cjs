const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { install } = require('./slow-request-trace.cjs');

async function fixture(options, handler, run) {
  process.env.FUMA_SLOW_TRACE = '1';
  const records = [];
  const restore = install({
    ...options,
    write: (r) => records.push(structuredClone(r)),
  });
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await run(`http://127.0.0.1:${server.address().port}`, records);
  } finally {
    restore();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    delete process.env.FUMA_SLOW_TRACE;
  }
}

test('fast responses stay unchanged and emit no request logs', async () => {
  await fixture(
    { slowMs: 1000 },
    (_req, res) => res.end('ok'),
    async (base, records) => {
      const response = await fetch(base + '/docs/2025/35158?secret=hidden');
      assert.equal(response.status, 200);
      assert.equal(await response.text(), 'ok');
      assert.deepEqual(
        records.map((r) => r.event),
        ['enabled']
      );
    }
  );
});

test('concurrent slow requests keep separate stages and redact query strings', async () => {
  await fixture(
    { slowMs: 0 },
    (req, res) => {
      const end = globalThis[Symbol.for('hoahrb.slow-request-trace')].begin(
        req.url.split('?')[0]
      );
      setTimeout(
        () => {
          end();
          res.end('ok');
        },
        req.url.includes('/a') ? 20 : 5
      );
    },
    async (base, records) => {
      await Promise.all(
        ['/a?secret=x', '/b'].map(async (p) => (await fetch(base + p)).text())
      );
      const traces = records.filter((r) => r.event === 'finished');
      assert.equal(traces.length, 2);
      assert.notEqual(traces[0].id, traces[1].id);
      for (const trace of traces) {
        assert.equal(trace.steps.length, 1);
        assert.equal(trace.steps[0].name, trace.path);
        assert.equal(typeof trace.steps[0].ms, 'number');
      }
      assert.ok(!JSON.stringify(traces).includes('secret'));
    }
  );
});

test('pending and completion share an id; 5xx are logged even when fast', async () => {
  await fixture(
    { slowMs: 1000, pendingMs: 10 },
    (req, res) => {
      if (req.url === '/error') {
        res.statusCode = 503;
        res.end('unavailable');
      } else setTimeout(() => res.end('ok'), 40);
    },
    async (base, records) => {
      await (await fetch(base + '/slow')).text();
      await (await fetch(base + '/error')).text();
      const pending = records.find((r) => r.event === 'pending');
      assert.ok(pending);
      assert.ok(
        records.some((r) => r.event === 'finished' && r.id === pending.id)
      );
      assert.ok(records.some((r) => r.status === 503));
    }
  );
});

test('log volume is capped and static assets are excluded', async () => {
  await fixture(
    { slowMs: 0 },
    (_req, res) => res.end('ok'),
    async (base, records) => {
      await (await fetch(base + '/_next/static/test.js')).text();
      assert.equal(records.length, 1);
      for (let i = 0; i < 25; i++)
        await (await fetch(base + '/docs/test')).text();
      assert.equal(records.length, 20);
    }
  );
});

test('disabled preload does not patch the HTTP entry', () => {
  const original = http.Server.prototype.emit;
  delete process.env.FUMA_SLOW_TRACE;
  install();
  assert.equal(http.Server.prototype.emit, original);
});
